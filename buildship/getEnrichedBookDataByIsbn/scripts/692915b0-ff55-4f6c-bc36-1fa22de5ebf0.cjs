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

// getEnrichedBookDataByIsbn/tmp_scripts_167/692915b0-ff55-4f6c-bc36-1fa22de5ebf0_temp.ts
var b0_ff55_4f6c_bc36_1fa22de5ebf0_temp_exports = {};
__export(b0_ff55_4f6c_bc36_1fa22de5ebf0_temp_exports, {
  default: () => setExternalData
});
module.exports = __toCommonJS(b0_ff55_4f6c_bc36_1fa22de5ebf0_temp_exports);
async function setExternalData({
  data
}) {
  if (data && Object.keys(data).length > 0) {
    return {
      externalData: data
    };
  }
  return {
    externalData: null
  };
}
