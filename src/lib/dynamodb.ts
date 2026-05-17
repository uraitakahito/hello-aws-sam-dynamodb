import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// sam local 実行時のみ AWS_SAM_LOCAL=true が自動で設定される。
// ローカルでは DynamoDB Local コンテナへ接続し、本番では通常の AWS 認証情報を使う。
const isLocal = process.env.AWS_SAM_LOCAL === "true";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "ap-northeast-1",
  ...(isLocal && {
    endpoint: "http://dynamodb-local:8000",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  }),
});

export const docClient = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.TODOS_TABLE_NAME ?? "Todos";
