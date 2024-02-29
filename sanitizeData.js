const getAllProducts = require("./getallData");
function sanitizeData(data) {
  if (!Array.isArray(data)) {
    throw new Error("Input data is not an array.");
  }
  for (let entry of data) {
    entry.Yield = entry.Yield ? parseFloat(entry.Yield) : 0;
    entry.Production = entry.Production ? parseFloat(entry.Production) : 0;
    entry.Area = entry.Area ? parseFloat(entry.Area) : 0;
    entry.Crop = entry.Crop || "N/A";
    entry.District =
      entry.District.charAt(0).toUpperCase() +
      entry.District.slice(1).toLowerCase();
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
    const sanitizedData = sanitizeData(await getAllProducts());
  } catch (error) {
    console.error("Error:", error);
  }
})();
module.exports = sanitizeData;
