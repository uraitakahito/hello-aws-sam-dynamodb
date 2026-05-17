import { APIGatewayProxyHandler } from "aws-lambda";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import { docClient, TABLE_NAME } from "../lib/dynamodb";
import { badRequest, created, serverError } from "../lib/response";

export const handler: APIGatewayProxyHandler = async (event) => {
  if (!event.body) {
    return badRequest("Request body is required");
  }

  let parsed: { title?: unknown; completed?: unknown };
  try {
    parsed = JSON.parse(event.body);
  } catch {
    return badRequest("Invalid JSON");
  }

  if (typeof parsed.title !== "string" || parsed.title.trim() === "") {
    return badRequest("title is required and must be a non-empty string");
  }

  const now = new Date().toISOString();
  const todo = {
    id: randomUUID(),
    title: parsed.title,
    completed: typeof parsed.completed === "boolean" ? parsed.completed : false,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: todo,
      }),
    );
    return created(todo);
  } catch (err) {
    console.error("createTodo failed", err);
    return serverError();
  }
};
