# 05. 書き込み系 Lambda (POST / PUT / DELETE)

データを変更する 3 関数。読み取り系より考えることが多い (バリデーション、存在チェック、UpdateExpression など)。

## createTodo — 作成

[src/handlers/createTodo.ts](../src/handlers/createTodo.ts) の要点:

```typescript
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

const todo = {
  id: randomUUID(),
  title: parsed.title,
  completed: typeof parsed.completed === "boolean" ? parsed.completed : false,
  createdAt: now,
  updatedAt: now,
};

await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: todo }));
return created(todo);
```

### ポイント

- **`randomUUID()`** — Node.js 標準。UUIDv4 を返す。`uuid` ライブラリは不要。
- **入力バリデーションを丁寧に**
  - body 自体が空 → 400
  - JSON パース失敗 → 400
  - `title` が文字列でない or 空 → 400
- **`PutCommand` は上書き**。同じ `id` が既にあれば上書きされる。今回は UUID なので衝突しない前提。
- **戻り値は 201 Created** + 作成したアイテム全体を返す (REST のベストプラクティス)。

## updateTodo — 更新

部分更新を実現するため `UpdateExpression` を動的に組み立てる:

```typescript
const setExpressions: string[] = [];
const attrNames: Record<string, string> = {};
const attrValues: Record<string, unknown> = {};

if (typeof parsed.title === "string") {
  setExpressions.push("#title = :title");
  attrNames["#title"] = "title";
  attrValues[":title"] = parsed.title;
}
// completed も同様

await docClient.send(new UpdateCommand({
  TableName: TABLE_NAME,
  Key: { id },
  UpdateExpression: `SET ${setExpressions.join(", ")}`,
  ExpressionAttributeNames: attrNames,
  ExpressionAttributeValues: attrValues,
  ConditionExpression: "attribute_exists(id)",   // ← 重要
  ReturnValues: "ALL_NEW",
}));
```

### ポイント

- **`ExpressionAttributeNames` (`#title`)** — 属性名は DynamoDB の予約語と衝突する可能性があるためプレースホルダで包む。
- **`ExpressionAttributeValues` (`:title`)** — 値もプレースホルダで渡す (SQL のバインドパラメータと同じ思想)。
- **`ConditionExpression: attribute_exists(id)`** — このオプションが無いと、存在しないIDで Update してもエラーにならず**新規作成されてしまう**。これで「存在する場合だけ更新」を強制する。
- **`ReturnValues: "ALL_NEW"`** — 更新後の全属性を返してもらう。これで200レスポンスに含められる。
- **`ConditionalCheckFailedException`** をキャッチして 404 に変換する。

## deleteTodo — 削除

```typescript
await docClient.send(
  new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id },
    ConditionExpression: "attribute_exists(id)",
  }),
);
return noContent(); // 204
```

### ポイント

- 更新と同じく `ConditionExpression` で存在チェック。
- 戻り値は **204 No Content** (REST 慣習)。body は空文字列。

## エラーハンドリングの共通パターン

書き込み系全てで以下を踏襲:

| エラー | HTTP ステータス |
|--------|----------------|
| body 欠落 / 不正 JSON / バリデーション NG | 400 |
| `ConditionalCheckFailedException` | 404 |
| その他 | 500 |

## IAM 権限 (DynamoDBCrudPolicy)

`template.yaml` で各関数に必要な最小権限を付与:

```yaml
CreateTodoFunction:
  Properties:
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref TodosTable

ListTodosFunction:
  Properties:
    Policies:
      - DynamoDBReadPolicy:      # ← 読み取り専用
          TableName: !Ref TodosTable
```

SAM が提供する **SAM Policy Templates** を使うと、よくある権限パターンを 1行で書ける。`DynamoDBCrudPolicy` は CRUD 全部、`DynamoDBReadPolicy` は読み取りのみ。

## 次のステップ

→ [06. API Gateway](06-api-gateway.md)
