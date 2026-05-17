# 02. プロジェクト構成

リポジトリのファイル群が「何のためにあるのか」を一望する。

## ディレクトリツリー

```
hello-aws-sam-dynamodb/
├── README.md                   ← 入口
├── docs/                       ← この解説群
├── src/
│   ├── handlers/               ← Lambda の関数ごとに 1ファイル
│   │   ├── createTodo.ts
│   │   ├── listTodos.ts
│   │   ├── getTodo.ts
│   │   ├── updateTodo.ts
│   │   └── deleteTodo.ts
│   └── lib/                    ← 全 Lambda で共有するコード
│       ├── dynamodb.ts         ←  DynamoDB Client の初期化 (ローカル/本番切替)
│       └── response.ts         ← API Gateway レスポンスのヘルパー
├── tests/
│   ├── handlers/               ← 各 Lambda のユニットテスト
│   └── helpers/                ← テスト用の共通コード
├── events/                     ← sam local invoke 用のサンプル JSON
├── scripts/
│   └── create-local-table.sh   ← DynamoDB Local にテーブルを作る
├── template.yaml               ← SAM テンプレート (IaC の本体)
├── samconfig.toml              ← SAM CLI の設定
├── docker-compose.yml          ← DynamoDB Local の起動定義
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## それぞれのファイルの役割

### IaC 系

- **`template.yaml`** — SAM テンプレート。DynamoDBテーブル、Lambda関数5本、API Gateway を CloudFormation で定義する。**このリポジトリの心臓部**。
- **`samconfig.toml`** — `sam deploy` などのデフォルトオプション。スタック名やリージョンを毎回入力しなくて済む。

### コード系

- **`src/handlers/*.ts`** — 1ファイル = 1 Lambda 関数。`export const handler = async (event) => {...}` を持つ。
- **`src/lib/*.ts`** — DynamoDB クライアントやレスポンスヘルパー。esbuild が自動でバンドルしてくれる。

### ローカル開発系

- **`docker-compose.yml`** — DynamoDB Local のコンテナ定義。`sam local` 用に `sam-local` という Docker ネットワークを共有する。
- **`scripts/create-local-table.sh`** — AWS CLI で DynamoDB Local にテーブルを作る。`template.yaml` の `TodosTable` と同じスキーマを再現。
- **`events/*.json`** — `sam local invoke <FunctionName> -e events/xxx.json` で API Gateway イベントを再現するためのサンプル。

### テスト系

- **`tests/handlers/*.test.ts`** — Vitest によるユニットテスト。`aws-sdk-client-mock` で DynamoDB をモック。
- **`tests/helpers/`** — テストを書きやすくする共通コード。

## ビルドの仕組み（TypeScript → JavaScript）

`template.yaml` の各 Lambda には次の `Metadata` がついている:

```yaml
Metadata:
  BuildMethod: esbuild
  BuildProperties:
    EntryPoints:
      - handlers/createTodo.ts
```

`sam build` を実行すると、SAM CLI が **esbuild** を呼び出して TypeScript をバンドル + トランスパイルし、`.aws-sam/build/` 配下に各関数の `index.js` を生成する。`tsc` は型チェック専用 (`noEmit: true`)。

## 次のステップ

→ [03. DynamoDB テーブル設計](03-dynamodb-table.md)
