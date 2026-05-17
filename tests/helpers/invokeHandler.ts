import type {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";

const emptyContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: "test",
  functionVersion: "1",
  invokedFunctionArn: "arn:aws:lambda:test",
  memoryLimitInMB: "128",
  awsRequestId: "test",
  logGroupName: "test",
  logStreamName: "test",
  getRemainingTimeInMillis: () => 1000,
  done: () => undefined,
  fail: () => undefined,
  succeed: () => undefined,
};

export const invokeHandler = async (
  handler: APIGatewayProxyHandler,
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  const result = await handler(event, emptyContext, () => undefined);
  if (!result) {
    throw new Error("Handler returned undefined");
  }
  return result;
};
