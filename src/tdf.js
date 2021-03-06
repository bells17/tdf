"use strict";

import fs from "fs";
import co from "co";
import mime from "mime";
import csvParse from "csv-parse/lib/sync";
import csvStringify from "csv-stringify";

const transformToCSV = (parsed, delimiter) => {
  return new Promise((resolve, reject) => {
    csvStringify(parsed, { header: true, delimiter: delimiter }, (err, csv) => {
      if (err) {
        return reject(err);
      }
      resolve(csv.trim());
    });
  });
};

const transform = (parsed, format) => {
  return co(function*() {
    switch (format) {
      case "json":
        return JSON.stringify(parsed);
      case "tsv":
        return yield transformToCSV(parsed, "\t");
      case "csv":
      default:
        return yield transformToCSV(parsed, ",");
    }
  });
};

const tdf = (data, options, isFile) => {
  return new Promise((resolve, reject) => {
    co(function*() {
      if (isFile) {
        const file = fs.readFileSync(data, (options.encoding || "utf8"));
        switch (mime.lookup(data)) {
          case "application/json":
            try {
              const parsed = JSON.parse(file);
              const transformed = yield transform(parsed, options.output);
              return resolve(transformed);
            } catch (err) {
              return reject(err);
            }
          case "text/csv":
            try {
              const parsed = csvParse(file, {
                columns: true,
                trim: true,
                quote:  (options.quote || '"'),
                delimiter: (options.delimiter || ",")
              });
              const transformed = yield transform(parsed, (options.output || "json"));
              return resolve(transformed);
            } catch (err) {
              return reject(err);
            }
          case "text/tab-separated-values":
            try {
              const parsed = csvParse(file, {
                columns: true,
                trim: true,
                quote:  (options.quote || '"'),
                delimiter: (options.delimiter || "\t")
              });
              const transformed = yield transform(parsed, (options.output || "json"));
              return resolve(transformed);
            } catch (err) {
              return reject(err);
            }
        }
      } else {
        switch (options.format) {
          case "json":
            try {
              const parsed = JSON.parse(data);
              const transformed = yield transform(parsed, options.output);
              return resolve(transformed);
            } catch (err) {
              return reject(err);
            }
          case "tsv":
            try {
              const parsed = csvParse(data, {
                columns: true,
                trim: true,
                quote:  (options.quote || '"'),
                delimiter: (options.delimiter || "\t")
              });
              const transformed = yield transform(parsed, (options.output || "json"));
              return resolve(transformed);
            } catch (err) {
              return reject(err);
            }
          case "csv":
          default:
            try {
              const parsed = csvParse(data, {
                columns: true,
                trim: true,
                quote:  (options.quote || '"'),
                delimiter: (options.delimiter || ",")
              });
              const transformed = yield transform(parsed, (options.output || "json"));
              return resolve(transformed);
            } catch (err) {
              return reject(err);
            }
        }
      }
    });
  });
};

export default tdf;
