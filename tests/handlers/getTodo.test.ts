import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/getTodo";
import { buildApiEvent } from "../helpers/apiGatewayEvent";
import { invokeHandler } from "../helpers/invokeHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

describe("getTodo", () => {
  it("returns 200 with item when found", async () => {
    const item = { id: "abc-123", title: "test", completed: false };
    ddbMock.on(GetCommand).resolves({ Item: item });

    const event = buildApiEvent({
      httpMethod: "GET",
      path: "/todos/abc-123",
      pathParameters: { id: "abc-123" },
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(item);
  });

  it("returns 404 when item is not found", async () => {
    ddbMock.on(GetCommand).resolves({});

    const event = buildApiEvent({
      httpMethod: "GET",
      path: "/todos/missing",
      pathParameters: { id: "missing" },
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(404);
  });

  it("returns 400 when id path parameter is missing", async () => {
    const event = buildApiEvent({
      httpMethod: "GET",
      path: "/todos/",
      pathParameters: null,
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(400);
  });

  it("returns 500 when DynamoDB throws", async () => {
    ddbMock.on(GetCommand).rejects(new Error("DynamoDB down"));

    const event = buildApiEvent({
      httpMethod: "GET",
      path: "/todos/abc",
      pathParameters: { id: "abc" },
    });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(500);
  });
});
