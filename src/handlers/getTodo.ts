import { APIGatewayProxyHandler } from "aws-lambda";
import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../lib/dynamodb";
import { badRequest, notFound, ok, serverError } from "../lib/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return badRequest("id path parameter is required");
  }

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { id },
      }),
    );
    if (!result.Item) {
      return notFound("Todo not found");
    }
    return ok(result.Item);
  } catch (err) {
    console.error("getTodo failed", err);
    return serverError();
  }
};
