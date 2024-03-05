const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());

const sanitizeData = require("./sanitizeData");
const queryProducts = require("./queryData"); // Import the DynamoDB query function

app.get("/api/products", async (req, res) => {
  try {
    const { state, year, page, pageSize, sortColumn, sortOrder, crop } = req.query;
    let products;

    // Query DynamoDB to get products based on the selected state
    if (state && state !== "All") {
      // Modify the query based on whether year and crop are selected
      if (year && year !== "All") {
        if (crop && crop !== "All") {
          products = await queryProducts({
            FilterExpression: "#s = :s and begins_with(#y, :y) and begins_with(#c, :c)",
            ExpressionAttributeNames: { "#s": "State", "#y": "year_sort_id", "#c": "crop_sort_id" },
            ExpressionAttributeValues: { ":s": state, ":y": year, ":c": crop },
          });
        } else {
          products = await queryProducts({
            FilterExpression: "#s = :s and begins_with(#y, :y)",
            ExpressionAttributeNames: { "#s": "State", "#y": "year_sort_id" },
            ExpressionAttributeValues: { ":s": state, ":y": year },
          });
        }
      } else {
        if (crop && crop !== "All") {
          products = await queryProducts({
            FilterExpression: "#s = :s and begins_with(#c, :c)",
            ExpressionAttributeNames: { "#s": "State", "#c": "crop_sort_id" },
            ExpressionAttributeValues: { ":s": state, ":c": crop },
          });
        } else {
          products = await queryProducts({
            FilterExpression: "#s = :s",
            ExpressionAttributeNames: { "#s": "State" },
            ExpressionAttributeValues: { ":s": state },
          });
        }
      }
    } else {
      // Query DynamoDB to get all products if no state is selected
      products = await queryProducts({});
    }

    // Sorting
    if (sortColumn && sortOrder) {
      products.sort((a, b) => {
        let [aValue, bValue] = [a[sortColumn], b[sortColumn]];
        if (["Year", "Production", "Yield", "Area"].includes(sortColumn)) {
          [aValue, bValue] = [parseFloat(aValue), parseFloat(bValue)];
        }
        return (
          (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) *
          (sortOrder === "asc" ? 1 : -1)
        );
      });
    }

    // Calculating production data, extracting unique states, years, and crops, pagination, sanitizing data
    const [stateProduction, cropProduction] = [{}, {}];
    products.forEach(({ Year, Crop, Production }) => {
      const production = parseFloat(Production);
      stateProduction[Year] = (stateProduction[Year] || 0) + production;
      cropProduction[Crop] = (cropProduction[Crop] || 0) + production;
    });

    const [allStates, allYears, stateCrops] = [
      [...new Set(products.map((product) => product.State))],
      [...new Set(products.map((product) => product.Year))],
      [...new Set(products.map((product) => product.Crop))],
    ];

    const [pageSizeNum, totalProducts] = [parseInt(pageSize), products.length];
    const totalPages = Math.ceil(totalProducts / pageSizeNum);

    if (page)
      products = products.slice(
        (page - 1) * pageSizeNum,
        Math.min(page * pageSizeNum, totalProducts)
      );

    const sanitizedProducts = sanitizeData(products);
    const metadata = {
      totalProducts,
      totalPages,
      currentPage: page ? parseInt(page) : 1,
    };

    res.json({
      products: sanitizedProducts,
      metadata,
      stateProduction,
      cropProduction,
      allStates,
      allYears,
      stateCrops,
    });
  } catch (error) {
    console.error("Error fetching or sanitizing data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


const PORT = 3001;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
