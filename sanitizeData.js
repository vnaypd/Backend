const getAllProducts = require("./getallData");

function sanitizeData(data) {
  if (!Array.isArray(data)) {
    throw new Error("Input data is not an array.");
  }

  for (let entry of data) {
    if (!entry.Yield) {
      entry.Yield = 0;
    }
    if (!entry.Production) {
      entry.Production = 0;
    }
    if (!entry.Area) {
      entry.Area = 0;
    }

    if (!entry.Crop) {
      entry.Crop = "N/A";
    }

    entry.Area = entry.Area ? parseFloat(entry.Area) : 0;
    entry.Production = entry.Production ? parseFloat(entry.Production) : 0;
    entry.Yield = entry.Yield ? parseFloat(entry.Yield) : 0;

    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    } 

    entry.District = capitalizeFirstLetter(entry.District);

    const productionUnit = entry["Production Units"].toLowerCase();
    if (productionUnit !== "tonnes") {
      switch (productionUnit) {
        case "nuts":
          entry.Production *= 0.0014;
          break;
        case "bales":
          entry.Production *= 0.21772;
          break;
      }
      entry["Production Units"] = "tonnes";
    }
  }

  return data;
}

(async () => {
  try {
    const allProducts = await getAllProducts();
    const sanitizedData = sanitizeData(allProducts);
    // console.log(sanitizedData); 
  } catch (error) {
    console.error("Error:", error);
  }
})();

module.exports = sanitizeData;
