import fs from "fs";
import { FileResult } from "./FileResult";
export function SiteMap(
  otherFiles: FileResult[],
  baseUrlWithoutTrailingSlash: string
): FileResult[] {
  var files: FileResult[] = [];

  var sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
    ${otherFiles
      .filter((f) => f.includeInSitemap)
      .map(
        (f) =>
          `<url><loc>${baseUrlWithoutTrailingSlash}${standardizePathForSitemap(
            f.relativePath
          )}</loc>${
            f.alternateLanguages
              ? f.alternateLanguages
                  .map(
                    (al) =>
                      `\r\n<xhtml:link rel="alternate" hreflang="${
                        al.code
                      }" href="${baseUrlWithoutTrailingSlash}${standardizePathForSitemap(
                        al.url
                      )}" />`
                  )
                  .join("")
              : ""
          }</url>`
      )
      .join("\r\n")}
      ${
        // Load from disk if html file is not in otherFiles. This allows older files to still work from prior to purchase of the domain
        fs
          .readdirSync("dest")
          .filter(
            (f) =>
              f.endsWith(".html") &&
              standardizePathForSitemap(f) !== "/" &&
              standardizePathForSitemap(f) !== "/404"
          )
          .map((f) => {
            if (!otherFiles.find((of) => of.relativePath === f)) {
              return `<url><loc>${baseUrlWithoutTrailingSlash}${standardizePathForSitemap(
                f
              )}</loc></url>`;
            }
          })
          .join("\r\n")
      }
  </urlset>`;

  files.push({
    relativePath: "sitemap.xml",
    content: sitemap,
    includeInSitemap: false,
  });
  return files;
}

function standardizePathForSitemap(relativePath: string) {
  // remove ending index.html
  if (relativePath.endsWith("index.html")) {
    relativePath = relativePath.substring(0, relativePath.length - 10);
  }
  // remove ending .html
  if (relativePath.endsWith(".html")) {
    relativePath = relativePath.substring(0, relativePath.length - 5);
  }
  // make sure starts with /
  if (!relativePath.startsWith("/")) {
    relativePath = "/" + relativePath;
  }

  return relativePath;
}
