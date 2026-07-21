import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

// 最後のキー押下時間を追跡
const lastKeyPressTime: Record<string, number> = {};

// サウンドパスの設定
let soundsPath: string;
// 起動時にキャッシュした同梱サウンドファイル名の一覧
const availableSounds = new Set<string>();
// 設定項目
let enabled: boolean;
let volume: number;
let keyCooldown: number;
let specialKeys: Record<string, boolean>;

let statusBarItem: vscode.StatusBarItem;

// Linux: 起動時に検出した再生コマンド（null = 見つからなかった）
let linuxPlayer: { cmd: string; args: (file: string, vol: number) => string[] } | null = null;
// Windows: 常駐させるPowerShellプレイヤープロセス
let winPlayer: cp.ChildProcess | undefined;

const warnedMessages = new Set<string>();

export function activate(context: vscode.ExtensionContext) {
    console.log('VSCode Typing Sound extension is now active!');

    // 設定の読み込み
    loadConfiguration();

    // サウンドファイルの存在を起動時に一度だけ確認してキャッシュ
    soundsPath = path.join(context.extensionPath, 'media', 'sounds');
    try {
        for (const file of fs.readdirSync(soundsPath)) {
            availableSounds.add(file);
        }
    } catch (err) {
        console.error('Failed to read sounds directory:', err);
    }

    if (process.platform === 'linux') {
        linuxPlayer = detectLinuxPlayer();
    }

    // 設定変更時のイベントハンドラー
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('typingSound')) {
                loadConfiguration();
            }
        })
    );

    // キーボードイベントのリスナーを登録
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(handleTextDocumentChange)
    );

    // コマンド登録
    context.subscriptions.push(
        vscode.commands.registerCommand('typingSound.toggle', () => {
            const config = vscode.workspace.getConfiguration('typingSound');
            config.update('enabled', !enabled, true);
        })
    );

    // ステータスバーにオン/オフ表示（クリックでトグル）
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'typingSound.toggle';
    updateStatusBar();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}

function loadConfiguration() {
    const config = vscode.workspace.getConfiguration('typingSound');
    enabled = config.get('enabled', true);
    volume = config.get('volume', 50);
    keyCooldown = config.get('keyCooldown', 50);
    specialKeys = config.get('specialKeys', {
        'Enter': true,
        'Tab': true,
        'Space': true,
        'Backspace': true
    });
    if (statusBarItem) {
        updateStatusBar();
    }
}

function updateStatusBar() {
    statusBarItem.text = enabled ? '$(unmute) Typing' : '$(mute) Typing';
    statusBarItem.tooltip = enabled
        ? 'Typing Sound: on (click to mute)'
        : 'Typing Sound: off (click to unmute)';
}

function handleTextDocumentChange(event: vscode.TextDocumentChangeEvent) {
    if (!enabled || volume <= 0) return;

    // Undo/Redoでは鳴らさない
    if (event.reason === vscode.TextDocumentChangeReason.Undo ||
        event.reason === vscode.TextDocumentChangeReason.Redo) {
        return;
    }

    // ユーザーが編集中のドキュメント以外（フォーマッタ・Git・出力パネル等）では鳴らさない
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== event.document) return;
    const scheme = event.document.uri.scheme;
    if (scheme !== 'file' && scheme !== 'untitled') return;

    const now = Date.now();

    for (const change of event.contentChanges) {
        const text = change.text;

        // 入力されたテキストに基づいてサウンドを再生
        if (text) {
            // 自動インデントによりEnterは "\n    " のような文字列になるため前方一致で判定
            if (text.startsWith('\n') || text.startsWith('\r\n')) {
                playKeySound('Enter', now);
            } else if (text === '\t') {
                playKeySound('Tab', now);
            } else if (text === ' ') {
                playKeySound('Space', now);
            } else if (text.length === 1) {
                // 通常のキー入力
                playKeySound('default', now);
            }
        } else if (change.rangeLength > 0) {
            // 削除操作（Backspace・選択削除など）
            playKeySound('Backspace', now);
        }
    }
}

function playKeySound(keyType: string, timestamp: number) {
    // クールダウンチェック
    if (keyCooldown > 0) {
        const lastTime = lastKeyPressTime[keyType] || 0;
        if (timestamp - lastTime < keyCooldown) {
            return; // クールダウン中なのでスキップ
        }
    }

    // 最終押下時間を更新
    lastKeyPressTime[keyType] = timestamp;

    // キータイプに応じたサウンドファイルを選択
    let soundFile = 'key-press.mp3'; // デフォルト
    if (keyType !== 'default' && specialKeys[keyType]) {
        const specificFile = `${keyType.toLowerCase()}.mp3`;
        if (availableSounds.has(specificFile)) {
            soundFile = specificFile;
        }
    }

    if (!availableSounds.has(soundFile)) {
        warnOnce(`Sound file not found: ${soundFile}`);
        return;
    }

    playFile(path.join(soundsPath, soundFile), volume / 100);
}

function playFile(file: string, vol: number) {
    if (process.platform === 'darwin') {
        spawnDetached('afplay', ['-v', vol.toString(), file]);
    } else if (process.platform === 'win32') {
        playOnWindows(file, vol);
    } else {
        if (!linuxPlayer) {
            warnOnce('Typing Sound: no audio player found. Please install mpg123, ffplay (ffmpeg), or sox.');
            return;
        }
        spawnDetached(linuxPlayer.cmd, linuxPlayer.args(file, vol));
    }
}

function spawnDetached(cmd: string, args: string[]) {
    const child = cp.spawn(cmd, args, { stdio: 'ignore' });
    child.on('error', err => console.error('Error playing sound:', err));
}

function detectLinuxPlayer() {
    const candidates: Array<{ cmd: string; args: (file: string, vol: number) => string[] }> = [
        // mpg123の-fは音量スケール（最大32768）
        { cmd: 'mpg123', args: (file, vol) => ['-q', '-f', String(Math.round(vol * 32768)), file] },
        { cmd: 'ffplay', args: (file, vol) => ['-nodisp', '-autoexit', '-loglevel', 'quiet', '-volume', String(Math.round(vol * 100)), file] },
        // play = SoX
        { cmd: 'play', args: (file, vol) => ['-q', file, 'vol', vol.toFixed(2)] }
    ];
    for (const candidate of candidates) {
        const result = cp.spawnSync('which', [candidate.cmd], { stdio: 'ignore' });
        if (result.status === 0) {
            return candidate;
        }
    }
    return null;
}

// Windowsではプロセス起動が遅いため、PowerShellのMediaPlayerを常駐させて
// stdin経由で「ファイルパス|音量」を渡して再生する
function playOnWindows(file: string, vol: number) {
    if (!winPlayer) {
        const script = [
            'Add-Type -AssemblyName PresentationCore;',
            '$player = New-Object System.Windows.Media.MediaPlayer;',
            'while ($null -ne ($line = [Console]::In.ReadLine())) {',
            '  $sep = $line.LastIndexOf("|");',
            '  $player.Stop();',
            '  $player.Volume = [double]$line.Substring($sep + 1);',
            '  $player.Open([Uri]::new($line.Substring(0, $sep)));',
            '  $player.Play();',
            '}'
        ].join(' ');
        winPlayer = cp.spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], {
            stdio: ['pipe', 'ignore', 'ignore'],
            windowsHide: true
        });
        winPlayer.on('error', err => {
            console.error('Error starting sound player:', err);
            winPlayer = undefined;
        });
        winPlayer.on('exit', () => {
            winPlayer = undefined;
        });
    }
    winPlayer.stdin?.write(`${file}|${vol}\n`);
}

function warnOnce(message: string) {
    if (warnedMessages.has(message)) return;
    warnedMessages.add(message);
    console.warn(message);
    vscode.window.showWarningMessage(message);
}

export function deactivate() {
    if (winPlayer) {
        winPlayer.kill();
        winPlayer = undefined;
    }
}
