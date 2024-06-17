import { FileResult } from "./FileResult";
import { SiteMap } from "./Sitemap";
import { BulkUpdateMissingKeys } from "./i18n";
import { verifyHtmlValidity } from "./verifyHtmlValidity";
import { verifyInternalUrls } from "./verifyInternalUrls";
import { writeFileAsync } from "./writeFileAsync";
import fs from "fs-extra";
import crypto from "crypto";

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

export async function StaticSiteBuild(
  baseUrl: string,
  // if true, run validation steps (slow)
  productionBuild: boolean,
  filePromises: FileResult[][],
  start: number
) {
  console.log("---\nStarting Static Site Build");

  var files = filePromises.flat();

  files.push(...SiteMap(files, baseUrl));

  const missingKeyPromise = BulkUpdateMissingKeys();
  const templateRendered = new Date().getTime();
  let ms = templateRendered - start;

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
        productionBuild
      ) {
        writePromises.push(writeFileAsync(file.relativePath, content));
        writtenFileCount++;
        if (writtenFileCount % 10 === 0 && writtenFileCount > 0) {
          // file system help. TODO: figure out better way to handle concurrent file write errors
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      } else {
        skippedBecauseOfHashMatch++;
      }
    }

    if (i % 1000 === 0 && i > 0) {
      console.log(`Writing file ${i} of ${files.length} (Asynchronously)`);
    }
  }

  console.log(`Finishing file writes`);
  if (skippedBecauseOfHashMatch > 0) {
    console.log(
      `Skipped ${skippedBecauseOfHashMatch} files because they had the same hash (Dev build only)`
    );
  }

  if (productionBuild) {
    console.log("Verifying HTML validity");
    verifyHtmlValidity(files);
    console.log("Verifying internal URLs");
    const internalURLErrors = [...verifyInternalUrls(files, baseUrl)];
    if (internalURLErrors.length > 0) {
      console.error("Internal URL errors:");
      console.error(internalURLErrors);
    } else {
      console.log("No internal URL errors found");
    }
  } else {
    console.log("This is a dev build.");
    console.log(" 1. Skipping HTML validity check");
    console.log(" 2. Skipping internal URL check");
    console.log(
      ` 3. Skipped writing ${skippedBecauseOfHashMatch} files because of hash match`
    );
  }

  await missingKeyPromise;
  await Promise.all(writePromises);

  // Save the new hashes
  await saveHashes(newHashes);

  const end = new Date().getTime();
  ms = end - start;
  console.log(`Done in ${ms} ms with ${files.length} files\n---`);
}
