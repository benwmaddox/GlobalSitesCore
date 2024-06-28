import { URL } from "url";
import { FileResult } from "./FileResult";
import { checkMarkInGreen, crossMarkInRed, ellipsis } from "./ConsoleText";

export function verifyInternalUrls(
  files: FileResult[],
  baseUrl: string,
  ignoreUrls: string[]
): string[] {
  console.log(`${ellipsis} Verifying internal URLs`);
  var errorLimit = 20;

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
  var okUrls = new Set<string>(
    ignoreUrls.map((url) => new URL(url, baseUrl).href)
  );

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
      // closest matches (before and after) alphabetically from defined urls
      var closestMatchA = Array.from(definedUrls)
        .filter((definedUrl) => definedUrl > url)
        .sort((a, b) => a.localeCompare(b))[0];

      var closestMatchB = Array.from(definedUrls)
        .filter((definedUrl) => definedUrl < url)
        .sort((a, b) => b.localeCompare(a))[0];

      errors.push(
        `Url ${url} was found in content and is not defined as a file. Closest matches: ${closestMatchA} | ${closestMatchB}.`
      );
    }
  });
  //   console.log({ definedUrlsReferenced, urlsInContentWithoutMatch, errors });
  // these are ok if they are not referenced
  if (urlsInContentWithoutMatch.size > 0 && errors.length > 0) {
    console.log(
      `${crossMarkInRed} Urls in content with match: ${definedUrlsReferenced.size}. Without match: ${urlsInContentWithoutMatch.size}.`
    );
  }

  if (errors.length > 0) {
    console.error("Internal URL errors:");
    console.error({ errors });
  } else {
    console.log(`${checkMarkInGreen} No internal URL errors found`);
  }
  return errors;
}
