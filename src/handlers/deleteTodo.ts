import { APIGatewayProxyHandler } from "aws-lambda";
import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../lib/dynamodb";
import { badRequest, noContent, notFound, serverError } from "../lib/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return badRequest("id path parameter is required");
  }

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { id },
        ConditionExpression: "attribute_exists(id)",
      }),
    );
    return noContent();
  } catch (err) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
      return notFound("Todo not found");
    }
    console.error("deleteTodo failed", err);
    return serverError();
  }
};
