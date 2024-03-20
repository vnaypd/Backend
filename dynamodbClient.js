const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dbClient = new DynamoDBClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AWS_ACCESS_KEY_ID",
    secretAccessKey: "AWS_SECRET_ACCESS_KEY",
  },
});

const documentClient = DynamoDBDocumentClient.from(dbClient);

module.exports = documentClient;
