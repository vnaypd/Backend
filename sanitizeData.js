const getAllProducts = require("./getallData");

function sanitizeData(data) {
  // yha pr array of obj
  // console.log(data)
  if (!Array.isArray(data)) {
    throw new Error("Input data is not an array.");
  }

  for (let entry of data) {
    //bhaiya object chahaie yha

    if (!entry.Yield) {
      entry.Yield = "0";
    }
    if (!entry.Production) {
      entry.Production = "0";
    }
    if (!entry.Area) {
      entry.Area = "0";
    }

    if (!entry.Crop) {
      entry.Crop = "N/A";
    }

    entry.Area = entry.Area ? parseFloat(entry.Area).toFixed(2) : "0";
    entry.Production = entry.Production
      ? parseFloat(entry.Production).toFixed(2)
      : "0";
    entry.Yield = entry.Yield ? parseFloat(entry.Yield).toFixed(2) : "0";

    function capitalizeFirstLetter(string) {
        // console.log(string)
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    } 

    entry.District = capitalizeFirstLetter(entry.District)

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

    entry.Production_Units = entry["Production Units"];
    delete entry["Production Units"];

    entry.Area_Units = entry["Area Units"];
    delete entry["Area Units"];

    entry.District = entry.District.replace(/[^a-zA-Z ]/g, "");
    entry.State = entry.State.replace(/[^a-zA-Z ]/g, "");

    if (!/\d{4}-\d{2}/.test(entry.Year)) {
      const yearParts = entry.Year.split("-");
      entry.Year =
        yearParts[0] + "-" + (parseInt(yearParts[0]) + 1).toString().slice(-2);
    }
  }

  return data;
}

(async () => {
  try {
    const allProducts = await getAllProducts();
    const sanitizedData = sanitizeData(allProducts);
  } catch (error) {
    console.error("Error:", error);
  }
})();

module.exports = sanitizeData;
