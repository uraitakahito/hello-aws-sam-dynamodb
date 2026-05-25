# hello-aws-sam-dynamodb

AWS SAM + DynamoDB + TypeScript で TODO REST API を作る学習用リポジトリ。

API Gateway → Lambda → DynamoDB という最小構成を、ローカル(DynamoDB Local + sam local)で完結して動かせる。

---

## できること

- TODO の CRUD 5 エンドポイントを TypeScript Lambda で実装
- DynamoDB Local によるオフライン開発
- Vitest + `aws-sdk-client-mock` によるユニットテスト
- `sam deploy` で AWS 環境にもデプロイ可能

| Method | Path | 概要 |
|--------|------|------|
| `POST`   | `/todos`       | TODO を作成 |
| `GET`    | `/todos`       | TODO 一覧を取得 |
| `GET`    | `/todos/{id}`  | TODO を1件取得 |
| `PUT`    | `/todos/{id}`  | TODO を更新 |
| `DELETE` | `/todos/{id}`  | TODO を削除 |

---

## 前提ツール

- Node.js 24.x 以上 (Lambda ランタイムに合わせる)
- Docker / Docker Compose
- AWS SAM CLI (`brew install aws-sam-cli`)
- AWS CLI (DynamoDB Local 操作のため)

---

## クイックスタート

```bash
# 1. 依存関係をインストール
npm install

# 2. DynamoDB Local を起動 + テーブル作成
npm run local:db:up
npm run local:db:init

# 3. SAM ビルド + ローカル API 起動
npm run build
npm run local:api
```

別ターミナルで疎通確認:

```bash
# 作成
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"買い物に行く"}'

# 一覧
curl http://localhost:3000/todos

# 1件取得（上で返ってきたidを使う）
curl http://localhost:3000/todos/<id>

# 更新
curl -X PUT http://localhost:3000/todos/<id> \
  -H "Content-Type: application/json" \
  -d '{"completed":true}'

# 削除
curl -X DELETE http://localhost:3000/todos/<id>
```

テスト実行:

```bash
npm test
```

---

## 学習ステップ（推奨読み順）

| # | ドキュメント | 内容 |
|---|---|---|
| 01 | [project-structure](docs/01-project-structure.md) | リポジトリ構成の全体像 |
| 02 | [dynamodb-table](docs/02-dynamodb-table.md) | テーブル設計と `template.yaml` |
| 03 | [lambda-read](docs/03-lambda-read.md) | 読み取り系 Lambda (GET 2本) |
| 04 | [lambda-write](docs/04-lambda-write.md) | 書き込み系 Lambda (POST/PUT/DELETE) |
| 05 | [api-gateway](docs/05-api-gateway.md) | API Gateway のルーティング |
| 06 | [local-development](docs/06-local-development.md) | DynamoDB Local + sam local の連携 |
| 07 | [testing](docs/07-testing.md) | Vitest + aws-sdk-client-mock |
| 08 | [deploy-and-cleanup](docs/08-deploy-and-cleanup.md) | AWS へのデプロイと削除 |

---

## ディレクトリ構成

```
.
├── docs/                 # ステップ別の解説
├── src/
│   ├── handlers/         # Lambda ハンドラ (5本)
│   └── lib/              # 共通コード (DynamoDB Client / レスポンスヘルパー)
├── tests/                # Vitest テスト
├── events/               # sam local invoke 用イベント JSON
├── scripts/              # ローカル開発用シェルスクリプト
├── template.yaml         # SAM テンプレート (IaC)
├── samconfig.toml        # SAM CLI 設定
├── docker-compose.yml    # DynamoDB Local 起動定義
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

---

## スコープ外

このリポジトリは「最小構成で SAM + DynamoDB を理解する」ことが目的なので、以下は意図的に扱っていません:

- 認証/認可 (Cognito など)
- DynamoDB Streams / GSI / シングルテーブル設計
- CI/CD (GitHub Actions など)
- カスタムドメイン / CloudFront

これらは後続教材で扱う予定です。
