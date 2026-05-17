# 07. ローカル開発環境

AWS アカウントなしで、開発機だけで API を動かす。

## 全体アーキテクチャ (ローカル)

```
  curl                  ┌──────────────────┐
  ──────► localhost:3000│ sam local start  │
                        │ (Lambda コンテナ) │
                        └────────┬─────────┘
                                 │ Docker network "sam-local"
                                 ▼
                        ┌──────────────────┐
                        │  dynamodb-local  │
                        │   (port 8000)    │
                        └──────────────────┘
```

ポイントは「**Lambda コンテナと DynamoDB Local が同じ Docker ネットワークにいる**」こと。

## Docker ネットワークの設計

[docker-compose.yml](../docker-compose.yml) で `sam-local` という名前のネットワークを作り、DynamoDB Local をそこに繋ぐ:

```yaml
services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: dynamodb-local  # ← この名前で名前解決可能
    networks:
      - sam-local

networks:
  sam-local:
    name: sam-local
```

`sam local start-api` 側もこのネットワークに参加させる:

```bash
sam local start-api --docker-network sam-local
```

すると Lambda コンテナから `http://dynamodb-local:8000` という URL で DynamoDB Local に到達できる。

## エンドポイント切替の仕組み

[src/lib/dynamodb.ts](../src/lib/dynamodb.ts):

```typescript
const isLocal = process.env.AWS_SAM_LOCAL === "true";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "ap-northeast-1",
  ...(isLocal && {
    endpoint: "http://dynamodb-local:8000",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  }),
});
```

- **`AWS_SAM_LOCAL=true`** は `sam local` 実行時に自動で設定される。これを唯一の判定軸にすると、本番コードに `if (process.env.STAGE === "dev")` のようなコードが散らからない。
- 本番ではこの分岐に入らず、Lambda 実行ロールの IAM 認証情報が自動で使われる。

## DynamoDB Local 操作 (CLI)

ローカル DB を AWS CLI で覗ける:

```bash
# テーブル一覧
aws dynamodb list-tables --endpoint-url http://localhost:8000

# 全件取得 (Scan)
aws dynamodb scan \
  --endpoint-url http://localhost:8000 \
  --table-name Todos

# 1件 Put
aws dynamodb put-item \
  --endpoint-url http://localhost:8000 \
  --table-name Todos \
  --item '{"id":{"S":"manual-1"},"title":{"S":"手動投入"}}'
```

DynamoDB Local には `--inMemory` を指定しているのでコンテナ停止時にデータは消える。永続化したい場合は `docker-compose.yml` で `-sharedDb -dbPath /data` に変更してボリュームをマウントする。

## sam local invoke vs sam local start-api

| コマンド | 用途 |
|---------|-----|
| `sam local invoke <FunctionName> -e events/x.json` | 1回限りの実行。デバッグやイベント形式の試行に向く |
| `sam local start-api` | HTTP サーバーとして 5 エンドポイント全部を起動。curl で叩ける |

どちらも `--docker-network sam-local` を付ければ DynamoDB Local と通信できる。

## トラブルシューティング

- **`Could not resolve host: dynamodb-local`** → `--docker-network sam-local` を忘れていないか確認。
- **`ResourceNotFoundException: Cannot do operations on a non-existent table`** → テーブル未作成、または `template.yaml` の `TODOS_TABLE_NAME` が `!Ref TodosTable` のような論理ID参照になっている。本リポジトリでは `Parameters.TodosTableName` を経由して名前を一元管理することでこの問題を回避している。
- **`Connection refused`** → DynamoDB Local が起動していない。`docker ps` で確認、`npm run local:db:up` で起動。
- **`Lambda functions containers initialization failed ... Token has expired`** → SSO ログインが切れている。ローカル開発では実 AWS 認証情報は不要なので、ダミーを渡して起動する:
  ```bash
  AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local AWS_SESSION_TOKEN= \
    sam local start-api --docker-network sam-local
  ```

## 次のステップ

→ [08. テスト](08-testing.md)
