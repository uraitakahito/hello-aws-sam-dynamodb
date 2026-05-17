# 01. セットアップ

このリポジトリを動かすために必要なツールを揃える。

## 必要なツール

| ツール | バージョン | 用途 |
|--------|------------|------|
| Node.js | 24.x 以上 | Lambda ランタイム (nodejs24.x) と合わせる |
| Docker | 最新 | DynamoDB Local と sam local のコンテナ実行 |
| AWS SAM CLI | 1.130 以上 | `sam build` / `sam local` / `sam deploy` |
| AWS CLI | v2 | DynamoDB Local へのテーブル作成、本番デプロイ |

## macOS でのインストール例

```bash
# Node.js (Homebrew + nodebrew や mise などお好みで)
brew install node@24

# Docker Desktop
brew install --cask docker

# AWS SAM CLI
brew install aws-sam-cli

# AWS CLI
brew install awscli
```

## バージョン確認

```bash
node --version       # v24.x.x
docker --version     # Docker version 27.x or later
sam --version        # SAM CLI, version 1.130.x or later
aws --version        # aws-cli/2.x.x
```

## AWS 認証情報

本リポジトリは「**ローカルでは AWS アカウント不要**」で動かせる。
本番デプロイ (`sam deploy`) を試したい場合のみ、AWS CLI に認証情報を設定する:

```bash
aws configure
# AWS Access Key ID     : ...
# AWS Secret Access Key : ...
# Default region name   : ap-northeast-1
# Default output format : json
```

## 次のステップ

→ [02. プロジェクト構成を見る](02-project-structure.md)
