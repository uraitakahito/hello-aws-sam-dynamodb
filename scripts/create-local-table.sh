#!/usr/bin/env bash
# DynamoDB Local 上に Todos テーブルを作成する。
# template.yaml の TodosTable と同じスキーマを再現している。
set -euo pipefail

ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8000}"
TABLE_NAME="${TODOS_TABLE_NAME:-Todos}"
REGION="${AWS_REGION:-ap-northeast-1}"

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local}"

if aws dynamodb describe-table \
    --endpoint-url "$ENDPOINT" \
    --region "$REGION" \
    --table-name "$TABLE_NAME" \
    --no-cli-pager > /dev/null 2>&1; then
  echo "Table '$TABLE_NAME' already exists at $ENDPOINT"
  exit 0
fi

aws dynamodb create-table \
  --endpoint-url "$ENDPOINT" \
  --region "$REGION" \
  --table-name "$TABLE_NAME" \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --no-cli-pager > /dev/null

echo "Table '$TABLE_NAME' created at $ENDPOINT"
