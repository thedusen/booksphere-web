"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// createJobCatalogFromImages/tmp_scripts_723/857d1268-06b4-4211-9ccc-b6329103447b_temp.ts
var d1268_06b4_4211_9ccc_b6329103447b_temp_exports = {};
__export(d1268_06b4_4211_9ccc_b6329103447b_temp_exports, {
  default: () => d1268_06b4_4211_9ccc_b6329103447b_temp_default
});
module.exports = __toCommonJS(d1268_06b4_4211_9ccc_b6329103447b_temp_exports);
async function d1268_06b4_4211_9ccc_b6329103447b_temp_default({ name }, {
  logging
  // Utility for logging during execution
  // env, // Not used in this specific function
  // getBuildShipFile, // Not used in this specific function
}) {
  const markdownJsonString = name;
  logging.log("Input Markdown JSON String:", markdownJsonString);
  if (!markdownJsonString || typeof markdownJsonString !== "string" || !markdownJsonString.trim()) {
    const errorMessage = "Input string is empty or invalid.";
    logging.error(errorMessage);
    throw new Error(errorMessage);
  }
  try {
    const regex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = markdownJsonString.match(regex);
    let jsonString;
    if (match && match[1]) {
      jsonString = match[1].trim();
      logging.log("Extracted JSON string:", jsonString);
    } else {
      logging.warn("No Markdown JSON code block found. Attempting to parse input directly as JSON.");
      jsonString = markdownJsonString.trim();
    }
    if (!jsonString) {
      const noJsonContentError = "Could not extract any JSON content from the input string.";
      logging.error(noJsonContentError);
      throw new Error(noJsonContentError);
    }
    const parsedJson = JSON.parse(jsonString);
    logging.log("Successfully parsed JSON object.");
    return parsedJson;
  } catch (error) {
    let errorMessage = "Error processing the JSON string: ";
    if (error instanceof SyntaxError) {
      errorMessage += "Invalid JSON format. " + error.message;
    } else {
      errorMessage += error.message;
    }
    logging.error(errorMessage, error.stack);
    throw new Error(errorMessage);
  }
}
