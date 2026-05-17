import { APIGatewayProxyHandler } from "aws-lambda";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME } from "../lib/dynamodb";
import { badRequest, notFound, ok, serverError } from "../lib/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return badRequest("id path parameter is required");
  }
  if (!event.body) {
    return badRequest("Request body is required");
  }

  let parsed: { title?: unknown; completed?: unknown };
  try {
    parsed = JSON.parse(event.body);
  } catch {
    return badRequest("Invalid JSON");
  }

  const setExpressions: string[] = [];
  const attrNames: Record<string, string> = {};
  const attrValues: Record<string, unknown> = {};

  if (typeof parsed.title === "string" && parsed.title.trim() !== "") {
    setExpressions.push("#title = :title");
    attrNames["#title"] = "title";
    attrValues[":title"] = parsed.title;
  }
  if (typeof parsed.completed === "boolean") {
    setExpressions.push("#completed = :completed");
    attrNames["#completed"] = "completed";
    attrValues[":completed"] = parsed.completed;
  }

  if (setExpressions.length === 0) {
    return badRequest("At least one of title or completed must be provided");
  }

  setExpressions.push("#updatedAt = :updatedAt");
  attrNames["#updatedAt"] = "updatedAt";
  attrValues[":updatedAt"] = new Date().toISOString();

  try {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id },
        UpdateExpression: `SET ${setExpressions.join(", ")}`,
        ExpressionAttributeNames: attrNames,
        ExpressionAttributeValues: attrValues,
        ConditionExpression: "attribute_exists(id)",
        ReturnValues: "ALL_NEW",
      }),
    );
    return ok(result.Attributes);
  } catch (err) {
    if (err instanceof Error && err.name === "ConditionalCheckFailedException") {
      return notFound("Todo not found");
    }
    console.error("updateTodo failed", err);
    return serverError();
  }
};
