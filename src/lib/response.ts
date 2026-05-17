import { APIGatewayProxyResult } from "aws-lambda";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
};

const json = (statusCode: number, body: unknown): APIGatewayProxyResult => ({
  statusCode,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const ok = (body: unknown): APIGatewayProxyResult => json(200, body);

export const created = (body: unknown): APIGatewayProxyResult => json(201, body);

export const noContent = (): APIGatewayProxyResult => ({
  statusCode: 204,
  headers: corsHeaders,
  body: "",
});

export const badRequest = (message: string): APIGatewayProxyResult =>
  json(400, { message });

export const notFound = (message = "Not Found"): APIGatewayProxyResult =>
  json(404, { message });

export const serverError = (
  message = "Internal Server Error",
): APIGatewayProxyResult => json(500, { message });
