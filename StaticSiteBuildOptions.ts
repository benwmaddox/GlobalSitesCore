import { ConfigData } from "html-validate";
import { FileResult } from "./FileResult";
import { ValidationOptions } from "./ValidationOptions";

export interface StaticSiteBuildOptions {
  baseUrl: string;
  files: FileResult[][];
  validationSkipUrls?: string[];
  startTime?: number;
  validationOptions?: ValidationOptions;
  translationSource: "Manual" | "GoogleTranslate" | "OpenAI";
  forceFileWrite?: boolean;
  /*
   * Using html-validate to validate the HTML of the files
   * See https://html-validate.org/usage/index.html
   */
  HTMLValidationConfig?: ConfigData;
}
