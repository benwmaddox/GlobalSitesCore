import { LanguageOption } from "./LanguageOption";

export interface FileResult {
  alternateLanguages?: LanguageOption[];
  relativePath: string;
  content?: string | Buffer;
  includeInSitemap?: boolean;
}
