import { HtmlValidate } from "html-validate";
import { FileResult } from "./FileResult";
import { checkMarkInGreen, crossMarkInRed, ellipsis } from "./ConsoleText";

export function verifyHtmlValidity(files: FileResult[]) {
  console.log(`${ellipsis} Verifying HTML is valid`);
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
    if (file.content instanceof Buffer) {
      var report = validator.validateStringSync(file.content.toString());
      filesChecked += 1;
      if (report.errorCount > 0) {
        htmlErrors += 1;
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
        htmlErrors += 1;
        console.log(`Errors in ${file.relativePath}:`);
        console.error({
          path: file.relativePath,
          ...report.results[0].messages[0],
        });
      }
    }
  });
  if (htmlErrors > 0) {
    console.log(
      `${crossMarkInRed} Finished verifying ${filesChecked} HTML files with ${htmlErrors} errors`
    );
  } else {
    console.log(
      `${checkMarkInGreen} Finished verifying ${filesChecked} HTML files`
    );
  }
}
