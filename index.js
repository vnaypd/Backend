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

    if (state && state !== "All") {
      products = products.filter((product) => product.State === state);
    }

    if (sortColumn && sortOrder) {
      products.sort((a, b) => {
        let aValue = a[sortColumn];
        let bValue = b[sortColumn];

        if (["Year", "Production", "Yield", "Area"].includes(sortColumn)) {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
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

    const stateProduction = {};
    const cropProduction = {};

    products.forEach((product) => {
      const year = product.Year;
      const crop = product.Crop;
      const production = parseFloat(product.Production);

      if (stateProduction[year]) {
        stateProduction[year] += production;
      } else {
        stateProduction[year] = production;
      }

      if (cropProduction[crop]) {
        cropProduction[crop] += production;
      } else {
        cropProduction[crop] = production;
      }
    });

    const allStates = [...new Set(products.map((product) => product.State))];

    const pageSize = 50;
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / pageSize);

    let startIndex, endIndex;
    if (page) {
      startIndex = (page - 1) * pageSize;
      endIndex = Math.min(startIndex + pageSize, totalProducts);
      products = products.slice(startIndex, endIndex);
    }

    const sanitizedProducts = sanitizeData(products);
  
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
