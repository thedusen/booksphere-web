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

// getEnrichedBookDataByIsbn/tmp_scripts_167/8c6fa043-cccd-47c4-8a01-9ec15da7dcae_temp.ts
var c6fa043_cccd_47c4_8a01_9ec15da7dcae_temp_exports = {};
__export(c6fa043_cccd_47c4_8a01_9ec15da7dcae_temp_exports, {
  default: () => notFoundResult
});
module.exports = __toCommonJS(c6fa043_cccd_47c4_8a01_9ec15da7dcae_temp_exports);
async function notFoundResult({
  isbn
}, {
  logging
}) {
  const notFoundResponse = {
    status: "not_found",
    message: `No results found for ISBN: ${isbn}`,
    isbn,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
  logging.log(`Returning not found result for ISBN: ${isbn}`);
  return notFoundResponse;
}
