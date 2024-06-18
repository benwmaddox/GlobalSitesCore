import { SiteMap } from "./Sitemap";
import { BulkUpdateMissingKeys as BulkUpdateMissingKeysGoogleTranslate } from "./i18n";
import { verifyHtmlValidity } from "./verifyHtmlValidity";
import { verifyInternalUrls } from "./verifyInternalUrls";
import { writeFileAsync } from "./writeFileAsync";
import fs from "fs-extra";
import crypto from "crypto";
import { StaticSiteBuildOptions } from "./StaticSiteBuildOptions";

const hashFilePath = "./hashFile.json";

// Function to compute hash of the content
function computeHash(content: string) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// Function to load existing hashes
async function loadHashes() {
  try {
    const data = await fs.readFile(hashFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    // File might not exist yet
    return {};
  }
}

// Function to save hashes
async function saveHashes(hashes: Record<string, string>) {
  await fs.writeFile(hashFilePath, JSON.stringify(hashes, null, 2), "utf8");
}
export async function StaticSiteBuild(options: StaticSiteBuildOptions) {
  const maxConcurrentWrites = 50;
  console.log(
    "\n[---------------------------------------------\nStarting Static Site Build"
  );
  options.start = options.start || new Date().getTime();

  var files = options.files.flat();

  let missingKeyPromise: Promise<void> =
    options.translationSource === "GoogleTranslate"
      ? BulkUpdateMissingKeysGoogleTranslate()
      : // TODO: handle other translation sources, including manual and openai
        Promise.resolve();

  const templateRendered = new Date().getTime();

  let ms = templateRendered - options.start;

  const currentHashes = await loadHashes();
  const newHashes = {};
  const writePromises = [];
  let skippedBecauseOfHashMatch = 0;
  let writtenFileCount = 0;
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    let content =
      file.content instanceof Buffer ? file.content.toString() : file.content;

    if (content !== undefined) {
      const hash = computeHash(content);
      (newHashes as Record<string, string>)[file.relativePath] = hash;

      if (
        (currentHashes as Record<string, string>)[file.relativePath] !== hash ||
        options.forceFileWrite === true
      ) {
        writePromises.push(writeFileAsync(file.relativePath, content));
        writtenFileCount++;
        if (
          writtenFileCount % maxConcurrentWrites === 0 &&
          writtenFileCount > 0
        ) {
          // file system help. TODO: figure out better way to handle concurrent file write errors
          await Promise.all(writePromises);
          writePromises.length = 0;
        }
      } else {
        skippedBecauseOfHashMatch++;
      }
    }

    if (i % 1000 === 0 && i > 0) {
      console.log(`Writing file ${i} of ${files.length} (Asynchronously)`);
    }
  }

  if (skippedBecauseOfHashMatch > 0) {
    console.log(`Skipping ${skippedBecauseOfHashMatch} files with no changes`);
  }

  if (options.validationOptions?.HTML !== false) {
    console.log("Verifying HTML is valid");
    verifyHtmlValidity(files);
  }
  if (options.validationOptions?.internalURLs !== false) {
    console.log("Verifying internal URLs");
    const internalURLErrors = [
      ...verifyInternalUrls(
        files,
        options.baseUrl,
        options.validationSkipUrls || []
      ),
    ];
    if (internalURLErrors.length > 0) {
      console.error("Internal URL errors:");
      console.error(internalURLErrors);
    } else {
      console.log("No internal URL errors found");
    }
  }

  await missingKeyPromise;
  files.push(...SiteMap(files, options.baseUrl));
  await Promise.all(writePromises);

  // Save the new hashes
  await saveHashes(newHashes);

  const end = new Date().getTime();
  ms = end - options.start;
  console.log(
    `Done in ${ms} ms with ${files.length} files\n---------------------------------------------]\n`
  );
}
