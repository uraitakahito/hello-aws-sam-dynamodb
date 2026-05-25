# 03. 読み取り系 Lambda (GET)

DynamoDB から「取り出す」だけのシンプルな 2 関数。

## ハンドラの基本形

すべての Lambda は同じ形をしている:

```typescript
import { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  // event は API Gateway から渡される
  // 戻り値は { statusCode, headers, body } の形
};
```

`APIGatewayProxyHandler` は `@types/aws-lambda` が提供する型。`event.pathParameters` や `event.body` の型を自動で付けてくれる。

## listTodos — 一覧取得

[src/handlers/listTodos.ts](../src/handlers/listTodos.ts):

```typescript
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../lib/dynamodb";
import { ok, serverError } from "../lib/response";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const result = await docClient.send(
      new ScanCommand({ TableName: TABLE_NAME }),
    );
    return ok({ items: result.Items ?? [] });
  } catch (err) {
    console.error("listTodos failed", err);
    return serverError();
  }
};
```

### ポイント

- **`ScanCommand`** — テーブル全件を読む。学習用には最も簡単だが、本番では全件読みは高コストなので注意。
- **`docClient`** — `DynamoDBDocumentClient`。**生の DynamoDB Client は型変換が面倒** (`{S: "abc"}` のような Attribute Value 形式) で、DocumentClient なら普通の JS オブジェクトとして扱える。
- **エラー時は 500 を返し、`console.error` で CloudWatch Logs に記録**する。

## getTodo — 1件取得

[src/handlers/getTodo.ts](../src/handlers/getTodo.ts):

```typescript
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) return badRequest("id path parameter is required");

  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    }),
  );
  if (!result.Item) return notFound("Todo not found");
  return ok(result.Item);
};
```

### ポイント

- **`event.pathParameters?.id`** — `/todos/{id}` の `{id}` をここで取り出す。型は `string | undefined` なのでオプショナルチェイン必須。
- **`GetCommand`** — `Key` に PK を指定して 1件取得。`Scan` と違って課金単位が小さい (1 RCU 程度)。
- **`result.Item` が `undefined`** なら 404 を返す。GetItem は見つからない場合エラーにならず空が返る仕様。

## 共通ヘルパー

毎回 `{ statusCode: 200, headers: {...}, body: JSON.stringify(...) }` を書くと面倒なので [src/lib/response.ts](../src/lib/response.ts) にまとめた:

```typescript
export const ok = (body: unknown) => json(200, body);
export const notFound = (message = "Not Found") => json(404, { message });
// ...
```

CORS ヘッダーもここで一括設定。

## ローカルで動かす

DynamoDB Local とテーブルが準備済みなら:

```bash
sam build
sam local invoke ListTodosFunction -e events/listTodos.json --docker-network sam-local
sam local invoke GetTodoFunction   -e events/getTodo.json   --docker-network sam-local
```

`events/getTodo.json` の `pathParameters.id` を実在する ID に書き換えるか、まず POST してから試す。

## 次のステップ

→ [04. 書き込み系 Lambda](04-lambda-write.md)
