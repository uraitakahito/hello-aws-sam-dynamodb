# 01. プロジェクト構成

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

→ [02. DynamoDB テーブル設計](02-dynamodb-table.md)
