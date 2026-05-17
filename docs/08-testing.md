# 08. テスト

Vitest + `aws-sdk-client-mock` で DynamoDB を呼び出さずにハンドラのロジックを検証する。

## なぜモックするのか

- **速い** — DynamoDB Local を起動しなくてもテストが走る
- **再現性** — 任意のレスポンスやエラーを返せる (404 / Conditional 失敗 / ネットワーク切断 など)
- **CI で動かしやすい** — Docker 不要

統合テスト (DynamoDB Local を実際に叩く) も価値はあるが、本リポジトリではユニットテストに絞る。

## ライブラリ構成

| ライブラリ | 役割 |
|-----------|------|
| `vitest` | テストランナー & アサーション |
| `aws-sdk-client-mock` | AWS SDK v3 のクライアントをモック |

## モックの基本パターン

```typescript
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

it("creates a todo", async () => {
  ddbMock.on(PutCommand).resolves({});  // 成功させる
  // ...
});

it("returns 500 on failure", async () => {
  ddbMock.on(PutCommand).rejects(new Error("boom"));  // 失敗させる
  // ...
});
```

### キーポイント

- **`mockClient(DynamoDBDocumentClient)`** — `DocumentClient` のレベルでモックする (生の `DynamoDBClient` ではない)。ハンドラ側が DocumentClient を使っているため。
- **`.on(PutCommand).resolves(...)`** — 「`PutCommand` が送られたら成功扱いで返す」。Command 別に挙動を変えられる。
- **`beforeEach(() => ddbMock.reset())`** — テスト間で状態を持ち越さない。

## ハンドラ呼び出しヘルパー

Lambda ハンドラのシグネチャは `(event, context, callback)` だが、テストでは context / callback はダミーで十分。[tests/helpers/invokeHandler.ts](../tests/helpers/invokeHandler.ts) で隠蔽:

```typescript
const result = await invokeHandler(handler, event);
expect(result.statusCode).toBe(201);
```

## イベントビルダー

`APIGatewayProxyEvent` は必須フィールドが多くテストが書きにくいので [tests/helpers/apiGatewayEvent.ts](../tests/helpers/apiGatewayEvent.ts) で雛形を用意:

```typescript
const event = buildApiEvent({
  httpMethod: "POST",
  body: JSON.stringify({ title: "test" }),
});
```

`buildApiEvent` がデフォルト値を埋め、引数で上書きしたいフィールドだけ渡す。

## テストパターン

各ハンドラで網羅したケース:

| ケース | 確認内容 |
|--------|---------|
| 正常系 | 期待通りの statusCode と body |
| 入力欠落 | 400 |
| JSON 不正 | 400 |
| バリデーション NG | 400 |
| 存在しないアイテム | 404 (Conditional 失敗を 404 へ変換) |
| DynamoDB エラー | 500 |

## 実行

```bash
# 全テスト
npm test

# ウォッチモード
npm run test:watch

# 単一ファイル
npx vitest run tests/handlers/createTodo.test.ts
```

## 型チェックは別

esbuild は型エラーを無視してビルドが通る。**型チェックは `tsc --noEmit` で別に走らせる**:

```bash
npm run typecheck
```

CI では `npm run typecheck && npm test` を組み合わせるとよい。

## 次のステップ

→ [09. デプロイとクリーンアップ](09-deploy-and-cleanup.md)
