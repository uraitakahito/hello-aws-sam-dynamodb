import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/deleteTodo";
import { buildApiEvent } from "../helpers/apiGatewayEvent";
import { invokeHandler } from "../helpers/invokeHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

describe("deleteTodo", () => {
  it("returns 204 when item is deleted", async () => {
    ddbMock.on(DeleteCommand).resolves({});

    const event = buildApiEvent({
      httpMethod: "DELETE",
      path: "/todos/abc",
      pathParameters: { id: "abc" },
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(204);
    expect(result.body).toBe("");
  });

  it("returns 404 when item does not exist", async () => {
    const err = new Error("Conditional check failed");
    err.name = "ConditionalCheckFailedException";
    ddbMock.on(DeleteCommand).rejects(err);

    const event = buildApiEvent({
      httpMethod: "DELETE",
      pathParameters: { id: "missing" },
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(404);
  });

  it("returns 400 when id is missing", async () => {
    const event = buildApiEvent({
      httpMethod: "DELETE",
      pathParameters: null,
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(400);
  });

  it("returns 500 when DynamoDB throws unexpected error", async () => {
    ddbMock.on(DeleteCommand).rejects(new Error("DynamoDB down"));

    const event = buildApiEvent({
      httpMethod: "DELETE",
      pathParameters: { id: "abc" },
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(500);
  });
});
