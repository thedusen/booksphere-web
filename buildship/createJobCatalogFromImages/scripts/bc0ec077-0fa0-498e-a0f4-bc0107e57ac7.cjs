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

// createJobCatalogFromImages/tmp_scripts_723/bc0ec077-0fa0-498e-a0f4-bc0107e57ac7_temp.ts
var bc0ec077_0fa0_498e_a0f4_bc0107e57ac7_temp_exports = {};
__export(bc0ec077_0fa0_498e_a0f4_bc0107e57ac7_temp_exports, {
  default: () => bc0ec077_0fa0_498e_a0f4_bc0107e57ac7_temp_default
});
module.exports = __toCommonJS(bc0ec077_0fa0_498e_a0f4_bc0107e57ac7_temp_exports);
async function bc0ec077_0fa0_498e_a0f4_bc0107e57ac7_temp_default({ name }, {
  logging
}) {
  logging.log("Input (expected as array):", name);
  if (!Array.isArray(name) || name.length === 0 || typeof name[0] !== "string" || !name[0].trim()) {
    const errorMessage = "Input must be a non-empty array with a non-empty string as its first element.";
    logging.error(errorMessage);
    throw new Error(errorMessage);
  }
  const markdownJsonString = name[0];
  logging.log("Processing string from array:", markdownJsonString);
  try {
    const regex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = markdownJsonString.match(regex);
  } catch (error) {
  }
}
