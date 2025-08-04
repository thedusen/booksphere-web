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

// getEnrichedBookDataByIsbn/tmp_scripts_167/58b98d6b-c080-4826-8041-e838a47d7098_temp.ts
var b98d6b_c080_4826_8041_e838a47d7098_temp_exports = {};
__export(b98d6b_c080_4826_8041_e838a47d7098_temp_exports, {
  default: () => normalizeBookData
});
module.exports = __toCommonJS(b98d6b_c080_4826_8041_e838a47d7098_temp_exports);
async function normalizeBookData({ externalData, trigger }, { logging }) {
  if (!externalData) {
    logging.log("Normalization Error: No external data was provided.");
    return { bookData: null };
  }
  const bookData = {};
  if (externalData.book) {
    logging.log("Normalizing data from ISBNdb source.");
    const source = externalData.book;
    bookData.title = source.title;
    bookData.authors = source.authors || [];
    bookData.publisher = source.publisher;
    bookData.published_date = source.date_published;
    bookData.cover_image_url = source.image;
    bookData.isbn = source.isbn13 || trigger.body.isbn;
  } else if (externalData.authors && externalData.works && externalData.books) {
    logging.log("Normalizing data from OpenLibrary workflow source.");
    const source = externalData;
    const bookDetails = source.books[`ISBN:${trigger.body.isbn}`]?.details;
    if (!bookDetails) {
      logging.log("Normalization Error: OpenLibrary data is missing the 'details' object.");
      return { bookData: null };
    }
    bookData.title = bookDetails.title;
    bookData.authors = source.authors.map((a) => a.name) || [];
    bookData.publisher = (bookDetails.publishers || [])[0];
    bookData.published_date = bookDetails.publish_date;
    const coverId = (bookDetails.covers || [])[0];
    bookData.cover_image_url = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
    bookData.isbn = trigger.body.isbn;
  } else {
    logging.log("Normalization Error: Could not determine data source format.");
    return { bookData: null };
  }
  logging.log("Book data normalized successfully.", bookData);
  return { bookData };
}
