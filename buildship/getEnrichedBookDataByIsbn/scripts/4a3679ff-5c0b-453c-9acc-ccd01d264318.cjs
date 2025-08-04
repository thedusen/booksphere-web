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

// getEnrichedBookDataByIsbn/tmp_scripts_167/4a3679ff-5c0b-453c-9acc-ccd01d264318_temp.ts
var a3679ff_5c0b_453c_9acc_ccd01d264318_temp_exports = {};
__export(a3679ff_5c0b_453c_9acc_ccd01d264318_temp_exports, {
  default: () => buildFinalOutputJson
});
module.exports = __toCommonJS(a3679ff_5c0b_453c_9acc_ccd01d264318_temp_exports);
async function buildFinalOutputJson({
  bookData,
  internalCheck,
  isbn
}) {
  const existingId = internalCheck?.edition_id;
  const jsonResult = {
    id: existingId,
    // Use the ID from Supabase if it exists
    isNew: !existingId,
    // A flag to tell the frontend if this is a new book
    isbn,
    ...bookData,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  return {
    jsonResult
  };
}
