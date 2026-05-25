# 05. API Gateway とルーティング

5本の Lambda を HTTP エンドポイントに紐付ける。

## SAM での書き方

API Gateway リソース本体を定義し、各 Lambda の `Events` でルートを紐付ける:

```yaml
TodosApi:
  Type: AWS::Serverless::Api
  Properties:
    StageName: Prod
    Cors:
      AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
      AllowHeaders: "'Content-Type'"
      AllowOrigin: "'*'"

CreateTodoFunction:
  Type: AWS::Serverless::Function
  Properties:
    Events:
      Api:
        Type: Api
        Properties:
          RestApiId: !Ref TodosApi
          Path: /todos
          Method: POST
```

### ポイント

- **`Events`** — Lambda のトリガー。`Api` のほか、`DynamoDB` (Streams), `Schedule` (EventBridge cron) などもある。
- **`RestApiId: !Ref TodosApi`** — 全 Lambda が同じ API Gateway を共有する。これを省くと SAM が暗黙のうちに API を作るが、複数 Lambda で別々の API ができてしまう。
- **`Path` のパスパラメータ** — `/todos/{id}` のように波括弧で書くと、Lambda 側で `event.pathParameters.id` として取得できる。
- **`Cors` をテンプレートで宣言**するだけで OPTIONS プリフライトと CORS ヘッダーが自動設定される。

## ルーティング全体図

| Method | Path | Lambda |
|--------|------|--------|
| POST   | `/todos`       | CreateTodoFunction |
| GET    | `/todos`       | ListTodosFunction |
| GET    | `/todos/{id}`  | GetTodoFunction |
| PUT    | `/todos/{id}`  | UpdateTodoFunction |
| DELETE | `/todos/{id}`  | DeleteTodoFunction |

## デプロイ後の URL

`sam deploy` 後、`Outputs.ApiUrl` で API のベース URL が出力される:

```
ApiUrl: https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/Prod
```

これに `/todos` を足してアクセスする。

## ローカルでの URL

`sam local start-api` で起動すると `http://localhost:3000` でリッスンする。本番と違って `/Prod` のステージプレフィックスは付かない:

```bash
curl http://localhost:3000/todos     # 本番では https://.../Prod/todos
```

## イベントの中身

Lambda が受け取る `event` の主要フィールド:

```jsonc
{
  "httpMethod": "POST",
  "path": "/todos",
  "pathParameters": { "id": "abc-123" },  // /todos/{id} の場合のみ
  "queryStringParameters": { ... },
  "headers": { ... },
  "body": "{\"title\":\"...\"}",          // 文字列！ JSON.parse が必要
  "requestContext": { ... }
}
```

`event.body` が**常に文字列**なのが要注意ポイント。バイナリの場合は `isBase64Encoded: true` になる。

## 次のステップ

→ [06. ローカル開発環境](06-local-development.md)
