import { HtmlValidate } from "html-validate";
import { FileResult } from "./FileResult";

export function verifyHtmlValidity(files: FileResult[]) {
  var validator = new HtmlValidate({
    extends: ["html-validate:recommended"],
    rules: {
      "void-style": "off",
      "no-trailing-whitespace": "off",
      "no-inline-style": "off",
      "long-title": "off",
    },
  });
  var htmlErrors = 0;
  var filesChecked = 0;
  files.forEach((file) => {
    if (htmlErrors > 100) {
      return;
    }
    htmlErrors += 1;
    if (file.content instanceof Buffer) {
      var report = validator.validateStringSync(file.content.toString());
      filesChecked += 1;
      if (report.errorCount > 0) {
        console.log(`Errors in ${file.relativePath}:`);
        for (let message of report.results[0].messages) {
          console.error(message);
        }
      }
    } else {
      if (file.content === undefined) {
        return;
      }
      var report = validator.validateStringSync(file.content);
      filesChecked += 1;
      if (report.errorCount > 0) {
        console.log(`Errors in ${file.relativePath}:`);
        console.error({
          path: file.relativePath,
          ...report.results[0].messages[0],
        });
      }
    }
  });
  console.log(`Finished checking ${filesChecked} HTML files`);
}
