const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());

const getAllProducts = require("./getallData");
const sanitizeData = require("./sanitizeData");

app.get("/api/products", async (req, res) => {
  try {
    const { state, page, sortColumn, sortOrder } = req.query;
    let products = await getAllProducts();

    // If state parameter is provided, filter the data
    if (state && state !== "All") {
      products = products.filter((product) => product.State === state);
    }

    // Sorting
    if (sortColumn && sortOrder) {
      products.sort((a, b) => {
        let aValue = a[sortColumn];
        let bValue = b[sortColumn];

        // Convert to integers if sorting by numerical columns
        if (["Year", "Production", "Yield", "Area"].includes(sortColumn)) {
          aValue = parseInt(aValue);
          bValue = parseInt(bValue);
        }

        if (aValue < bValue) {
          return sortOrder === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    // Calculate production per year and production per crop
    const stateProduction = {};
    const cropProduction = {};

    products.forEach((product) => {
      const year = product.Year;
      const crop = product.Crop;
      const production = parseInt(product.Production);

      // Production per year
      if (stateProduction[year]) {
        stateProduction[year] += production;
      } else {
        stateProduction[year] = production;
      }

      // Production per crop
      if (cropProduction[crop]) {
        cropProduction[crop] += production;
      } else {
        cropProduction[crop] = production;
      }
    });

    // Get unique states
    const allStates = [...new Set(products.map((product) => product.State))];

    // Calculate pagination metadata
    const pageSize = 50;
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / pageSize);

    // If page parameter is provided, paginate the data
    let startIndex, endIndex;
    if (page) {
      startIndex = (page - 1) * pageSize;
      endIndex = Math.min(startIndex + pageSize, totalProducts);
      products = products.slice(startIndex, endIndex);
    }

    const sanitizedProducts = sanitizeData(products);
    
    // Prepare metadata for response
    const metadata = {
      totalProducts,
      totalPages,
      currentPage: page ? parseInt(page) : 1
    };
    
    res.json({ products: sanitizedProducts, metadata, stateProduction, cropProduction, allStates });
  } catch (error) {
    console.error("Error fetching or sanitizing data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
