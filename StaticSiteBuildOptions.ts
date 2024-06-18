import { FileResult } from "./FileResult";
import { ValidationOptions } from "./ValidationOptions";

export interface StaticSiteBuildOptions {
  baseUrl: string;
  files: FileResult[][];
  validationSkipUrls?: string[];
  start?: number;
  validationOptions?: ValidationOptions;
  translationSource: "Manual" | "GoogleTranslate" | "OpenAI";
  forceFileWrite?: boolean;
}
