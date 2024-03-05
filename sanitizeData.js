const queryProducts = require("./queryData");

function sanitizeData(data) {
  if (!Array.isArray(data)) {
    throw new Error("Input data is not an array.");
  }
  for (let entry of data) {
    entry.Crop = entry.Crop || "N/A";
    entry.District =
    entry.District.charAt(0).toUpperCase() +
    entry.District.slice(1).toLowerCase();
 

    const productionUnit = entry["Production Units"]
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
    sanitizeData(await queryProducts());
  } catch (error) {
    console.error("Error:", error);
  }
})();
module.exports = sanitizeData;
