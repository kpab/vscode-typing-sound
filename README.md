# VSCode Typing Sound

[![Version](https://img.shields.io/visual-studio-marketplace/v/kpab.vscode-typing-sound)](https://marketplace.visualstudio.com/items?itemName=kpab.vscode-typing-sound)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/kpab.vscode-typing-sound)](https://marketplace.visualstudio.com/items?itemName=kpab.vscode-typing-sound)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/kpab/vscode-typing-sound/blob/main/LICENSE)

[Marketplace](https://marketplace.visualstudio.com/items?itemName=kpab.vscode-typing-sound) | [GitHub](https://github.com/kpab/vscode-typing-sound) | [Issues](https://github.com/kpab/vscode-typing-sound/issues)

[English](#english) | [日本語](#japanese)

<a id="english"></a>
## English

A VSCode extension that plays satisfying mechanical keyboard sounds while typing.

### Features

- Pleasant mechanical keyboard sounds during normal typing
- Custom sound effects for special keys such as Enter, Tab, and Backspace
- Volume adjustment
- Anti-key-repeat protection (prevents sound flooding when holding down keys)
- Status bar toggle (click the "Typing" item to mute/unmute)
- Sounds are only played while you are actually typing — programmatic edits (formatters, Git, undo/redo, etc.) stay silent

### Settings

This extension supports the following settings:

* `typingSound.enabled`: Enable or disable typing sounds
* `typingSound.volume`: Sound volume (0-100)
* `typingSound.keyCooldown`: Minimum interval between sounds for the same key (milliseconds)
* `typingSound.specialKeys`: Enable/disable specific special key sounds

### Commands

* `typingSound.toggle`: Toggle typing sounds on/off

### Supported Platforms

- macOS (uses the built-in `afplay`)
- Windows (uses PowerShell / Windows Media Player, no extra installation required)
- Linux (requires one of: `mpg123`, `ffplay` (ffmpeg), or `play` (SoX))

### Installation

Install from the [VSCode Extension Marketplace](https://marketplace.visualstudio.com/items?itemName=kpab.vscode-typing-sound), or search for "VSCode Typing Sound" in the Extensions view.

### Feedback

Bug reports and feature requests are welcome on [GitHub Issues](https://github.com/kpab/vscode-typing-sound/issues).

---

<a id="japanese"></a>
## 日本語

タイピング時に気持ちの良いメカニカルキーボードの効果音を鳴らすVSCode拡張機能です。

### 機能

- 通常のタイピング時に心地よいメカニカルキーボード音を再生
- エンター、タブ、バックスペースなどの特殊キーに独自の効果音
- 音量調整機能
- 長押し対策（キーリピート検出）
- ステータスバーからワンクリックでオン/オフ切り替え
- 実際のタイピング時のみ再生（フォーマッタ・Git・Undo/Redoなどの自動編集では鳴りません）

### 設定オプション

この拡張機能は以下の設定をサポートしています：

* `typingSound.enabled`: 効果音を有効/無効にする
* `typingSound.volume`: 音量（0-100）
* `typingSound.keyCooldown`: 同一キーの再生間隔（ミリ秒）
* `typingSound.specialKeys`: 特殊キーの有効/無効設定

### コマンド

* `typingSound.toggle`: タイピング効果音のオン/オフを切り替え

### 対応プラットフォーム

- macOS（標準の `afplay` を使用）
- Windows（PowerShell / Windows Media Playerを使用、追加インストール不要）
- Linux（`mpg123`・`ffplay`（ffmpeg）・`play`（SoX）のいずれかが必要）

### インストール

[VSCode拡張機能マーケットプレイス](https://marketplace.visualstudio.com/items?itemName=kpab.vscode-typing-sound)から、または拡張機能ビューで「VSCode Typing Sound」を検索してインストールできます。

### フィードバック

バグ報告・機能要望は [GitHub Issues](https://github.com/kpab/vscode-typing-sound/issues) までお気軽にどうぞ。

## Bundled Sound Files / 同梱の音源ファイル

The following MP3 files are bundled in the `media/sounds/` folder:  
以下のMP3ファイルが `media/sounds/` フォルダに同梱されています：

- `key-press.mp3` - Normal key typing sound / 通常のキー入力音
- `enter.mp3` - Enter key sound effect / Enterキー用効果音
- `tab.mp3` - Tab key sound effect / Tabキー用効果音
- `backspace.mp3` - Backspace key sound effect / Backspaceキー用効果音

Note: There is currently no dedicated sound for the Space key — it falls back to the normal key sound.  
注: 現在スペースキー専用の音源は同梱されておらず、通常のキー入力音が再生されます。

## License / ライセンス

MIT

## Author / 作者

kpab