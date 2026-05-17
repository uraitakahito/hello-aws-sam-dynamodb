import { APIGatewayProxyHandler } from "aws-lambda";
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
