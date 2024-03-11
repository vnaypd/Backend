const AWS = require("aws-sdk");

// Update AWS configuration with environment variables
AWS.config.update({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const documentClient = new AWS.DynamoDB.DocumentClient();
const TableName = "cropyeardata";

async function queryProducts(query = {}) {
  let item_count = 0;
  let allItems = [];
  try {
    let response;
    let params = {
      TableName: TableName,
      ...query,
    };

    do {
      response = await documentClient.query(params).promise();

      if (response.Items) {
        item_count += response.Items.length;

        response.Items.forEach((item) => {
          allItems.push(item);
        });
      }

      if (response.LastEvaluatedKey) {
        params.ExclusiveStartKey = response.LastEvaluatedKey;
      }
    } while (response.LastEvaluatedKey);

    console.log("Total number of items found:", item_count);
    return allItems;
  } catch (error) {
    console.error("Error scanning DynamoDB table:", error);
    throw error;
  }
}

module.exports = queryProducts;
