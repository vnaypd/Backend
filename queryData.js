const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const documentClient = require("./dynamodbClient");
const TableName = "cropyeardata";

async function queryProducts(query = {}) {
  let item_count = 0;
  let allItems = [];
  try {
    let response;
    let params = {
      TableName: TableName,
      ...query
    };

    do {
      response = await documentClient.send(new ScanCommand(params));

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
