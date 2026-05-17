import { describe, it, expect, beforeEach } from "vitest";
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { handler } from "../../src/handlers/listTodos";
import { buildApiEvent } from "../helpers/apiGatewayEvent";
import { invokeHandler } from "../helpers/invokeHandler";

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

describe("listTodos", () => {
  it("returns 200 with all items", async () => {
    const items = [
      { id: "a", title: "todo1", completed: false },
      { id: "b", title: "todo2", completed: true },
    ];
    ddbMock.on(ScanCommand).resolves({ Items: items });

    const event = buildApiEvent({ httpMethod: "GET", path: "/todos" });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ items });
  });

  it("returns 200 with empty array when table is empty", async () => {
    ddbMock.on(ScanCommand).resolves({ Items: [] });

    const event = buildApiEvent({ httpMethod: "GET", path: "/todos" });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ items: [] });
  });

  it("returns 200 with empty array when Items is undefined", async () => {
    ddbMock.on(ScanCommand).resolves({});

    const event = buildApiEvent({ httpMethod: "GET", path: "/todos" });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({ items: [] });
  });

  it("returns 500 when DynamoDB throws", async () => {
    ddbMock.on(ScanCommand).rejects(new Error("DynamoDB down"));

    const event = buildApiEvent({ httpMethod: "GET", path: "/todos" });
    const result = await invokeHandler(handler, event);

    expect(result.statusCode).toBe(500);
  });
});
