const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());

const getAllProducts = require("./getallData");
const sanitizeData = require("./sanitizeData");

app.get("/api/products", async (req, res) => {
  try {
    const { state, year, page, sortColumn, sortOrder } = req.query;
    let products = await getAllProducts();

    ["State", "Year"].forEach(param => {
      if (req.query[param] && req.query[param] !== "All") {
        products = products.filter(product => product[param] === req.query[param]);
      }
    });

    if (sortColumn && sortOrder) {
      products.sort((a, b) => {
        let [aValue, bValue] = [a[sortColumn], b[sortColumn]];
        if (["Production", "Yield", "Area"].includes(sortColumn)) {
          [aValue, bValue] = [parseFloat(aValue), parseFloat(bValue)];
        }
        return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * (sortOrder === "asc" ? 1 : -1);
      });
    }

    const [stateProduction, cropProduction] = [{}, {}];
    products.forEach(({ Year, Crop, Production }) => {
      const production = parseFloat(Production);
      stateProduction[Year] = (stateProduction[Year] || 0) + production;
      cropProduction[Crop] = (cropProduction[Crop] || 0) + production;
    });

    const [allStates, allYears, stateCrops] = [
      [...new Set(products.map(product => product.State))],
      [...new Set(products.map(product => product.Year))],
      state && state !== "All" ? [...new Set(products.filter(product => product.State === state).map(product => product.Crop))] : []
    ];

    const [pageSize, totalProducts] = [50, products.length];
    const totalPages = Math.ceil(totalProducts / pageSize);

    if (page) products = products.slice((page - 1) * pageSize, Math.min(page * pageSize, totalProducts));

    const sanitizedProducts = sanitizeData(products);
    const metadata = { totalProducts, totalPages, currentPage: page ? parseInt(page) : 1 };

    res.json({ products: sanitizedProducts, metadata, stateProduction, cropProduction, allStates, allYears, stateCrops });
  } catch (error) {
    console.error("Error fetching or sanitizing data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
