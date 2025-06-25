# Electron TCP Client

A simple TCP client with GUI built using Electron. This application allows you to connect to TCP servers, send messages with different encodings, and view responses.

## Features

- Connect to any TCP server by specifying host and port
- Send messages with different encodings (UTF-8, ASCII, HEX, Base64)
- View sent and received messages in a log
- Simple and intuitive user interface
- Built with TypeScript, Electron, and Node.js
- Uses ESBuild for fast bundling
- Includes logging with Pino

## Prerequisites

- Node.js (22.x or higher recommended)
- pnpm 10.10.0 or higher

## Installation

To install dependencies, run the following command:

```bash
# Clone the repository
git clone https://github.com/yourusername/electron-tcp-client.git
cd electron-tcp-client

# Install dependencies
pnpm install
```

## Development

To run the application in development mode:

```bash
pnpm dev
```

This will build the application and start Electron with DevTools open.

## Building

To build the application, use the following commands:

```bash
# Build for development
pnpm build:dev

# Build for production (with code obfuscation)
pnpm build:prod

# Start the built application
pnpm start
```

In the production build, the code is obfuscated using JavaScript Obfuscator.

## Packaging

To create distributable packages for your platform:

```bash
pnpm package
```

This will create packages in the `dist` directory.

## Troubleshooting

### Electron Installation Issues

If you encounter an error like:
```
Error: Electron failed to install correctly, please delete node_modules/electron and try installing again
```

You can fix it by running the provided script:

```bash
# Make the script executable if needed
chmod +x fix-electron.sh

# Run the fix script
./fix-electron.sh
```

This script will:
1. Remove the problematic Electron installation
2. Reinstall all dependencies with the correct Electron version
3. Allow you to run the application normally

## Usage

1. Enter the host and port of the TCP server you want to connect to
2. Click "Connect"
3. Once connected, you can send messages:
   - Type your message in the text area
   - Select the encoding (UTF-8, ASCII, HEX, Base64)
   - Click "Send" or press Enter
4. Received messages will appear in the log
5. Click "Disconnect" to close the connection
6. Use "Clear Log" to clear the message history

## Key Technologies

- **Electron**: Framework for building cross-platform desktop applications
- **TypeScript**: A statically typed superset of JavaScript
- **ESBuild**: An extremely fast JavaScript/TypeScript bundler
- **Pino**: A high-performance Node.js logging library
- **JavaScript Obfuscator**: Code protection for production environments

## License

GPL-3.0 license

---

# Electron TCP クライアント (日本語)

ElectronとTypeScriptを使用して構築されたGUIを備えたシンプルなTCPクライアントです。このアプリケーションを使用すると、TCPサーバーに接続し、異なるエンコーディングでメッセージを送信し、応答を表示できます。

## 機能

- ホストとポートを指定して任意のTCPサーバーに接続
- 異なるエンコーディング（UTF-8、ASCII、HEX、Base64）でメッセージを送信
- ログで送受信したメッセージを表示
- シンプルで直感的なユーザーインターフェース
- TypeScript、Electron、Node.jsで構築
- 高速バンドリングのためのESBuild
- Pinoによるロギング機能

## 前提条件

- Node.js (22.x以上推奨)
- pnpm 10.10.0以上

## インストール

依存関係をインストールするには、以下のコマンドを実行してください：

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/electron-tcp-client.git
cd electron-tcp-client

# 依存関係をインストール
pnpm install
```

## 開発

開発モードでアプリケーションを実行するには：

```bash
pnpm dev
```

これにより、アプリケーションがビルドされ、DevToolsが開いた状態でElectronが起動します。

## ビルド

アプリケーションをビルドするには、以下のコマンドを使用します：

```bash
# 開発用ビルド
pnpm build:dev

# 本番用ビルド（コード難読化あり）
pnpm build:prod

# ビルドしたアプリケーションを起動
pnpm start
```

本番ビルドでは、JavaScript Obfuscatorを使用してコードが難読化されます。

## パッケージング

プラットフォーム用の配布可能なパッケージを作成するには：

```bash
pnpm package
```

これにより、`dist`ディレクトリにパッケージが作成されます。

## トラブルシューティング

### Electronインストールの問題

次のようなエラーが発生した場合：
```
Error: Electron failed to install correctly, please delete node_modules/electron and try installing again
```

提供されたスクリプトを実行して修正できます：

```bash
# 必要に応じてスクリプトを実行可能にする
chmod +x fix-electron.sh

# 修正スクリプトを実行
./fix-electron.sh
```

このスクリプトは以下を行います：
1. 問題のあるElectronインストールを削除
2. 正しいElectronバージョンで全ての依存関係を再インストール
3. アプリケーションを正常に実行できるようにする

## 使用方法

1. 接続したいTCPサーバーのホストとポートを入力
2. 「Connect」をクリック
3. 接続後、メッセージを送信できます：
   - テキストエリアにメッセージを入力
   - エンコーディング（UTF-8、ASCII、HEX、Base64）を選択
   - 「Send」をクリックするか、Enterキーを押す
4. 受信したメッセージはログに表示されます
5. 接続を閉じるには「Disconnect」をクリック
6. メッセージ履歴をクリアするには「Clear Log」を使用

## 主要技術

- **Electron**: クロスプラットフォームデスクトップアプリケーション構築フレームワーク
- **TypeScript**: 型安全なJavaScriptスーパーセット
- **ESBuild**: 高速なJavaScript/TypeScriptバンドラー
- **Pino**: 高性能なNode.jsログライブラリ
- **JavaScript Obfuscator**: 本番環境用のコード保護

## ライセンス

GPL-3.0 license
