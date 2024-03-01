const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const documentClient = require("./dynamodbClient");
const TableName = "cropyeardata";

async function getAllProducts() {
  let item_count = 0;
  let allItems = [];
  try {
    let response;
    let params = {
      TableName: TableName,
    };

    do {
      response = await documentClient.send(new ScanCommand(params));
      item_count += response.Items.length;

      response.Items.forEach((item) => {
        allItems.push(item);
      });

      if (response.LastEvaluatedKey) {
        params.ExclusiveStartKey = response.LastEvaluatedKey;
        console.log(
          `Fetched ${response.Items.length} items. Total items so far: ${item_count}`
        );
      }
    } while (response.LastEvaluatedKey);

    console.log("Total number of items found:", item_count);
    // console.log(allItems)
    return allItems;
  } catch (error) {
    console.error("Error scanning DynamoDB table:", error);
    throw error;
  }
}

module.exports = getAllProducts;
