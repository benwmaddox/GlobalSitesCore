export interface AlternateLanguage {
  lang: string;
  relativePath: string;
}
export interface FileResult {
  alternateLanguages?: AlternateLanguage[];
  relativePath: string;
  content?: string | Buffer;
  includeInSitemap?: boolean;
}
