# 08. デプロイとクリーンアップ

ローカルで動くようになったら、本物の AWS アカウントにデプロイしてみる。
**学習用なので、終わったら必ず `sam delete` でリソースを削除する**こと (DynamoDB はオンデマンドだが API Gateway / CloudWatch Logs などで微量に課金される可能性がある)。

## デプロイ手順

### 1. AWS 認証情報を設定

```bash
aws configure
```

### 2. 初回デプロイ (`--guided`)

```bash
npm run deploy
# == sam deploy --guided
```

対話形式で聞かれる:

```
Stack Name [hello-aws-sam-dynamodb]:        ← Enter で OK
AWS Region [ap-northeast-1]:                ← Enter で OK
Confirm changes before deploy [Y/n]:        ← Y を推奨 (差分確認)
Allow SAM CLI IAM role creation [Y/n]:      ← Y (Lambda の実行ロール作成)
Save arguments to configuration file [Y/n]: ← Y (samconfig.toml に保存)
```

入力した値は `samconfig.toml` に保存され、2 回目以降は `sam deploy` だけで OK。

### 3. デプロイ後の確認

成功すると CloudFormation Outputs が出る:

```
-----------------------------------------------------------
Outputs
-----------------------------------------------------------
Key                 ApiUrl
Value               https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/Prod

Key                 TodosTableName
Value               Todos
-----------------------------------------------------------
```

### 4. 本番疎通確認

```bash
API_URL=https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/Prod

curl -X POST $API_URL/todos -H "Content-Type: application/json" \
  -d '{"title":"本番テスト"}'

curl $API_URL/todos
```

## ログ確認

CloudWatch Logs に Lambda の `console.error` 出力が流れる:

```bash
sam logs --stack-name hello-aws-sam-dynamodb --tail
```

特定の関数だけ:

```bash
sam logs -n CreateTodoFunction --stack-name hello-aws-sam-dynamodb --tail
```

## 開発中の高速イテレーション: sam sync

コード修正のたびに `sam build && sam deploy` するのは遅い。**`sam sync` で差分だけホットスワップ**できる:

```bash
sam sync --stack-name hello-aws-sam-dynamodb --watch
```

`--watch` モードではファイル変更を検知して自動同期。**ただし本番環境では使わないこと** (テンプレート以外の変更が CloudFormation のスタック状態と乖離する)。

## クリーンアップ (重要)

学習が終わったらスタックを丸ごと削除:

```bash
sam delete --stack-name hello-aws-sam-dynamodb
```

確認プロンプト:

```
Are you sure you want to delete the stack hello-aws-sam-dynamodb in the region ap-northeast-1 ? [y/N]: y
Are you sure you want to delete the folder hello-aws-sam-dynamodb in S3? [y/N]: y
```

これで Lambda / API Gateway / DynamoDB テーブル / IAM ロールが全部消える。

### CloudWatch Logs は残る

`sam delete` でも `/aws/lambda/<関数名>` のロググループは残る (削除保護のため)。気になる場合は手動削除:

```bash
aws logs delete-log-group --log-group-name /aws/lambda/hello-aws-sam-dynamodb-CreateTodoFunction-xxxxx
```

## 次に学ぶこと

この基礎編が一段落したら:

- **案2 (中級): DynamoDB Streams** — テーブル変更をトリガーに別 Lambda を起動
- **案3 (応用): シングルテーブル設計** — GSI を使った 1 テーブル多用途設計

---

おつかれさまでした。
