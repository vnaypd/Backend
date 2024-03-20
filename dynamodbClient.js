const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dbClient = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIA57F2A3LJ5X6JUBX5",
    secretAccessKey: "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",
  },
});

const documentClient = DynamoDBDocumentClient.from(dbClient);

module.exports = documentClient;
