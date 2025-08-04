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

// getEnrichedBookDataByIsbn/tmp_scripts_167/c2b83f5e-c657-4d9d-9958-e0f16f7e7bfd_temp.ts
var c2b83f5e_c657_4d9d_9958_e0f16f7e7bfd_temp_exports = {};
__export(c2b83f5e_c657_4d9d_9958_e0f16f7e7bfd_temp_exports, {
  default: () => setExternalDataFromISBNdb
});
module.exports = __toCommonJS(c2b83f5e_c657_4d9d_9958_e0f16f7e7bfd_temp_exports);
async function setExternalDataFromISBNdb({
  data
}) {
  if (data && data.book) {
    return data.book;
  }
  return null;
}
