import { URL } from "url";
import { FileResult } from "./FileResult";

export function verifyInternalUrls(
  files: FileResult[],
  baseUrl: string
): string[] {
  var errorLimit = 100;

  var definedUrls = new Set<string>();
  files.forEach((file) => {
    var url = new URL(file.relativePath, baseUrl).href;
    // if ends with .index.html, remove it
    if (url.endsWith("index.html")) {
      url = url.slice(0, -10);
    }
    // if ends with .html, remove it and use trailing slash
    if (url.endsWith(".html")) {
      url = url.slice(0, -5) + "/";
    }
    definedUrls.add(url);
  });

  var definedUrlsReferenced = new Set<string>();
  var urlsInContentWithoutMatch = new Set<string>();
  var errors: string[] = [];
  files.forEach((file) => {
    if (typeof file.content === "string") {
      let matches = file.content.match(/href="\/[^"]*"/g);
      var fileUrl = new URL(file.relativePath, baseUrl).href;
      // if ends with .index.html, remove it
      if (fileUrl.endsWith("index.html")) {
        fileUrl = fileUrl.slice(0, -10);
      }
      // if ends with .html, remove it and use trailing slash
      if (fileUrl.endsWith(".html")) {
        fileUrl = fileUrl.slice(0, -5) + "/";
      }

      if (matches) {
        matches.forEach((match) => {
          var matchedUrl = new URL(match.slice(6, -1), fileUrl).href;
          var isOnSameDomain = matchedUrl.startsWith(baseUrl);
          if (!isOnSameDomain) {
            return;
          }
          if (!definedUrls.has(matchedUrl)) {
            urlsInContentWithoutMatch.add(matchedUrl);
          } else if (!definedUrlsReferenced.has(matchedUrl)) {
            definedUrlsReferenced.add(matchedUrl);
          }
        });
      }
      matches = file.content.match(/src="[^"]*"/g);
      if (matches) {
        matches.forEach((match) => {
          var matchedUrl = new URL(match.slice(5, -1), fileUrl).href;
          var isOnSameDomain = matchedUrl.startsWith(baseUrl);
          if (!isOnSameDomain) {
            return;
          }
          if (!definedUrls.has(matchedUrl)) {
            urlsInContentWithoutMatch.add(matchedUrl);
          } else if (!definedUrlsReferenced.has(matchedUrl)) {
            definedUrlsReferenced.add(matchedUrl);
          }
        });
      }
    }
  });

  // find defined urls that are not referenced
  var okUrls = new Set<string>([
    new URL("sitemap.xml", baseUrl).href,
    new URL("sitemap.xml/", baseUrl).href,
    new URL("robots.txt", baseUrl).href,
    new URL("robots.txt/", baseUrl).href,
    new URL("404", baseUrl).href,
    new URL("404/", baseUrl).href,
    new URL("ads.txt", baseUrl).href,
    new URL("ads.txt", baseUrl).href,
    new URL("bqc47a42s1rmcym7watcz29swp68pbhv.txt", baseUrl).href,
  ]);
  definedUrls.forEach((definedUrl) => {
    if (errors.length >= errorLimit) {
      return;
    }
    if (!definedUrlsReferenced.has(definedUrl) && !okUrls.has(definedUrl)) {
      errors.push(`Defined url ${definedUrl} is not referenced.`);
    }
  });
  urlsInContentWithoutMatch.forEach((url) => {
    if (errors.length >= errorLimit) {
      return;
    }
    if (!okUrls.has(url)) {
      errors.push(
        `Url ${url} was found in content and is not defined as a file.`
      );
    }
  });
  //   console.log({ definedUrlsReferenced, urlsInContentWithoutMatch, errors });
  // these are ok if they are not referenced
  console.log(
    `Urls in content with match: ${definedUrlsReferenced.size}. Without match: ${urlsInContentWithoutMatch.size}.`
  );

  return errors;
}
