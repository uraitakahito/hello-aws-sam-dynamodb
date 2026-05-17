# 03. DynamoDB テーブル設計

## テーブル設計

**TableName:** `Todos`

| 属性名 | 型 | 役割 |
|--------|-----|------|
| `id`        | String | パーティションキー (PK)。UUIDv4 を採番 |
| `title`     | String | タスク名 |
| `completed` | Boolean | 完了フラグ |
| `createdAt` | String | 作成日時 (ISO 8601) |
| `updatedAt` | String | 更新日時 (ISO 8601) |

### なぜこのスキーマか？

DynamoDB はリレーショナル DB と違い「テーブル作成時にカラムを全部定義しない」。
**キー (PK / SK) だけ宣言**し、残りの属性は Put のたびに自由に追加できる。
だから `AttributeDefinitions` には `id` だけ書く。

## `template.yaml` での定義

該当部分 ([template.yaml](../template.yaml)):

```yaml
TodosTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: Todos
    BillingMode: PAY_PER_REQUEST
    AttributeDefinitions:
      - AttributeName: id
        AttributeType: S
    KeySchema:
      - AttributeName: id
        KeyType: HASH
```

### ポイント解説

- **`BillingMode: PAY_PER_REQUEST`** — オンデマンド課金。学習用なら確実にこれ。プロビジョンド課金は読み書きキャパシティの事前見積もりが必要で初学者には難しい。
- **`AttributeDefinitions`** — 「キーに使う属性」だけ宣言。`title` などはここに書かない。
- **`KeySchema.KeyType: HASH`** — パーティションキーのこと。`RANGE` (ソートキー) もあるが今回は使わない。

## 他リソースからの参照

`!Ref TodosTable` でテーブル名 (`Todos`) を取得できる。Lambda の環境変数や IAM ポリシーで使う:

```yaml
Globals:
  Function:
    Environment:
      Variables:
        TODOS_TABLE_NAME: !Ref TodosTable   # ← Lambda に注入される
```

## DynamoDB Local でも同じテーブルを使う

`docker compose up -d` で起動した DynamoDB Local には、`template.yaml` から自動でテーブルは作られない。
`scripts/create-local-table.sh` が `aws dynamodb create-table` で同等のスキーマを作る:

```bash
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name Todos \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

## 動作確認

DynamoDB Local 起動後にテーブルが作成されたか確認:

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
# {
#     "TableNames": ["Todos"]
# }
```

## 次のステップ

→ [04. 読み取り系 Lambda](04-lambda-read.md)
