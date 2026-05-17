import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/updateTodo";
import { buildApiEvent } from "../helpers/apiGatewayEvent";
import { invokeHandler } from "../helpers/invokeHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

describe("updateTodo", () => {
  it("returns 200 with updated attributes when title is updated", async () => {
    const updated = {
      id: "abc",
      title: "new title",
      completed: false,
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    ddbMock.on(UpdateCommand).resolves({ Attributes: updated });

    const event = buildApiEvent({
      httpMethod: "PUT",
      path: "/todos/abc",
      pathParameters: { id: "abc" },
      body: JSON.stringify({ title: "new title" }),
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(updated);
  });

  it("returns 200 when completed flag is updated", async () => {
    ddbMock.on(UpdateCommand).resolves({
      Attributes: { id: "abc", completed: true },
    });

    const event = buildApiEvent({
      httpMethod: "PUT",
      pathParameters: { id: "abc" },
      body: JSON.stringify({ completed: true }),
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(200);
  });

  it("returns 404 when item does not exist", async () => {
    const err = new Error("Conditional check failed");
    err.name = "ConditionalCheckFailedException";
    ddbMock.on(UpdateCommand).rejects(err);

    const event = buildApiEvent({
      httpMethod: "PUT",
      pathParameters: { id: "missing" },
      body: JSON.stringify({ title: "x" }),
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(404);
  });

  it("returns 400 when id is missing", async () => {
    const event = buildApiEvent({
      httpMethod: "PUT",
      pathParameters: null,
      body: JSON.stringify({ title: "x" }),
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when body is missing", async () => {
    const event = buildApiEvent({
      httpMethod: "PUT",
      pathParameters: { id: "abc" },
      body: null,
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when no updatable fields are provided", async () => {
    const event = buildApiEvent({
      httpMethod: "PUT",
      pathParameters: { id: "abc" },
      body: JSON.stringify({ foo: "bar" }),
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(400);
  });

  it("returns 500 when DynamoDB throws unexpected error", async () => {
    ddbMock.on(UpdateCommand).rejects(new Error("DynamoDB down"));

    const event = buildApiEvent({
      httpMethod: "PUT",
      pathParameters: { id: "abc" },
      body: JSON.stringify({ title: "x" }),
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(500);
  });
});
