import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/createTodo";
import { buildApiEvent } from "../helpers/apiGatewayEvent";
import { invokeHandler } from "../helpers/invokeHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

describe("createTodo", () => {
  it("creates a todo with title only and returns 201", async () => {
    ddbMock.on(PutCommand).resolves({});

    const event = buildApiEvent({
      httpMethod: "POST",
      path: "/todos",
      body: JSON.stringify({ title: "買い物に行く" }),
    });

    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.title).toBe("買い物に行く");
    expect(body.completed).toBe(false);
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBe(body.createdAt);
  });

  it("returns 400 when body is missing", async () => {
    const event = buildApiEvent({ httpMethod: "POST", body: null });
    const result = await invokeHandler(handler, event);
    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when body is invalid JSON", async () => {
    const event = buildApiEvent({ httpMethod: "POST", body: "{not json" });
    const result = await invokeHandler(handler, event);
    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when title is missing", async () => {
    const event = buildApiEvent({
      httpMethod: "POST",
      body: JSON.stringify({ completed: true }),
    });
    const result = await invokeHandler(handler, event);
    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when title is empty string", async () => {
    const event = buildApiEvent({
      httpMethod: "POST",
      body: JSON.stringify({ title: "   " }),
    });
    const result = await invokeHandler(handler, event);
    expect(result.statusCode).toBe(400);
  });

  it("returns 500 when DynamoDB throws", async () => {
    ddbMock.on(PutCommand).rejects(new Error("DynamoDB down"));
    const event = buildApiEvent({
      httpMethod: "POST",
      body: JSON.stringify({ title: "test" }),
    });
    const result = await invokeHandler(handler, event);
    expect(result.statusCode).toBe(500);
  });
});
