const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());

const getAllProducts = require("./getallData");
const sanitizeData = require("./sanitizeData");

app.get("/api/products", async (req, res) => {
  try {
    const { state, year, page, pageSize, sortColumn, sortOrder ,crop} = req.query;
    let products = await getAllProducts();

    if (state && state !== "All") {
      products = products.filter((product) => product.State === state);
    }

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
      [...new Set(products.map(product => product.Crop))]
      // state && state !== "All" ? [...new Set(products.filter(product => product.State === state).map(product => product.Crop))] : []
    ];

    const [pageSizeNum, totalProducts] = [parseInt(pageSize), products.length];
    const totalPages = Math.ceil(totalProducts / pageSizeNum);

    if (page) products = products.slice((page - 1) * pageSizeNum, Math.min(page * pageSizeNum, totalProducts));

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
