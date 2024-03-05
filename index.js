const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());

const sanitizeData = require("./sanitizeData");
const queryProducts = require("./queryData"); // Import the DynamoDB query function

app.get("/api/products", async (req, res) => {
  try {
    const { state, year, page, pageSize, sortColumn, sortOrder, crop } =
      req.query;
    let products;

    // Query DynamoDB to get products based on the selected state
    if (state && state !== "All") {
      products = await queryProducts({
        FilterExpression: "#s = :s",
        ExpressionAttributeNames: { "#s": "State" },
        ExpressionAttributeValues: { ":s": state },
      });
    } else {
      // Query DynamoDB to get all products if no state is selected
      products = await queryProducts({});
    }

    // Filtering based on year, crop, etc.
    if (year && year !== "All") {
      products = products.filter((product) => product.Year === year);
    }

    if (crop && crop !== "All") {
      products = products.filter((product) => product.Crop === crop);
    }

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

    // Calculating production data
    const [stateProduction, cropProduction] = [{}, {}];
    products.forEach(({ Year, Crop, Production }) => {
      const production = parseFloat(Production);
      stateProduction[Year] = (stateProduction[Year] || 0) + production;
      cropProduction[Crop] = (cropProduction[Crop] || 0) + production;
    });

    // Extracting unique states, years, and crops
    const [allStates, allYears, stateCrops] = [
      [...new Set(products.map((product) => product.State))],
      [...new Set(products.map((product) => product.Year))],
      [...new Set(products.map((product) => product.Crop))],
    ];

    // Pagination
    const [pageSizeNum, totalProducts] = [parseInt(pageSize), products.length];
    const totalPages = Math.ceil(totalProducts / pageSizeNum);

    if (page)
      products = products.slice(
        (page - 1) * pageSizeNum,
        Math.min(page * pageSizeNum, totalProducts)
      );

    // Sanitize data
    const sanitizedProducts = sanitizeData(products);
    const metadata = {
      totalProducts,
      totalPages,
      currentPage: page ? parseInt(page) : 1,
    };

    // Sending response
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
