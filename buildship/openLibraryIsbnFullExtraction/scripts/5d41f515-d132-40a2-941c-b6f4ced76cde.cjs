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

// openLibraryIsbnFullExtraction/tmp_scripts_174/5d41f515-d132-40a2-941c-b6f4ced76cde_temp.ts
var d41f515_d132_40a2_941c_b6f4ced76cde_temp_exports = {};
__export(d41f515_d132_40a2_941c_b6f4ced76cde_temp_exports, {
  default: () => validationError
});
module.exports = __toCommonJS(d41f515_d132_40a2_941c_b6f4ced76cde_temp_exports);
async function validationError({
  validation_error
}, {
  logging
}) {
  logging.log(`Validation error: ${validation_error}`);
  return {
    success: false,
    error: validation_error
  };
}
