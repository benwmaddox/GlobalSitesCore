import { LanguageOption } from "./LanguageOption";

export interface FileResult {
  languageOptions?: LanguageOption[];
  relativePath: string;
  content?: string | Buffer;
  includeInSitemap?: boolean;
}
