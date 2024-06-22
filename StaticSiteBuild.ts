import { SiteMap } from "./Sitemap";
import {
  BulkUpdateMissingKeysGoogleTranslate as BulkUpdateMissingKeysGoogleTranslate,
  BulkUpdateMissingKeysManual,
  BulkUpdateMissingKeysOpenAI,
  missingKeys,
} from "./i18n";
import { verifyHtmlValidity } from "./verifyHtmlValidity";
import { verifyInternalUrls } from "./verifyInternalUrls";
import { writeFileAsync } from "./writeFileAsync";
import fs from "fs-extra";
import crypto from "crypto";
import { StaticSiteBuildOptions } from "./StaticSiteBuildOptions";
import { checkMarkInGreen, crossMarkInRed, ellipsis } from "./ConsoleText";

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
  var lockFilePath = "./staticSiteBuildLock.json";
  var lockFile = fs.existsSync(lockFilePath)
    ? fs.readFileSync(lockFilePath, "utf8")
    : "{}";
  var lock = JSON.parse(lockFile);
  if (lock.locked) {
    //console.log(
    //  `${ellipsis} Changes detected. Static Site Build is currently running. If this is in error, delete staticSiteBuildLock.json file and try again.`
    //);
    return;
  }
  lock.locked = true;
  fs.writeFileSync(lockFilePath, JSON.stringify(lock, null, 2), "utf8");
  const maxConcurrentWrites = 50;
  console.log(
    `\n[---------------------------------------------\n${ellipsis} Starting build for ${options.baseUrl}`
  );
  options.startTime = options.startTime || new Date().getTime();

  var files = options.files.flat();

  let missingKeyPromise: Promise<void> =
    options.translationSource === "GoogleTranslate"
      ? BulkUpdateMissingKeysGoogleTranslate()
      : // TODO: handle other translation sources, including manual and openai
      options.translationSource === "Manual"
      ? BulkUpdateMissingKeysManual()
      : BulkUpdateMissingKeysOpenAI();

  if (
    options.translationSource !== "GoogleTranslate" &&
    options.translationSource !== "Manual"
  ) {
    throw new Error("Translation source not supported yet");
  }

  const templateRendered = new Date().getTime();

  let ms = templateRendered - options.startTime;

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
          await Promise.all(writePromises);
          writePromises.length = 0;
        }
      } else {
        skippedBecauseOfHashMatch++;
      }
    }

    if (i % 1000 === 0 && i > 0) {
      console.log(`Writing file ${i} of ${files.length}`);
    }
  }

  if (skippedBecauseOfHashMatch > 0) {
    console.log(
      `${ellipsis} Skipping ${skippedBecauseOfHashMatch} files with no changes`
    );
  }

  if (options.validationOptions?.HTML === "Full") {
    verifyHtmlValidity(files, options.validationOptions?.HTMLValidationConfig);
  }
  if (options.validationOptions?.HTML === "Sample") {
    // sample of 1% of files or 10 random files (whichever is greater)
    const sampleSize = Math.max(Math.ceil(files.length * 0.01), 10);
    const randomFiles = [...files]
      .sort(() => 0.5 - Math.random())
      .slice(0, sampleSize);
    verifyHtmlValidity(
      randomFiles,
      options.validationOptions?.HTMLValidationConfig
    );
  }
  if (options.validationOptions?.internalURLs !== false) {
    const internalURLErrors = [
      ...verifyInternalUrls(
        files,
        options.baseUrl,
        options.validationOptions?.skipUrls || []
      ),
    ];
  }

  await missingKeyPromise;
  files.push(...SiteMap(files, options.baseUrl));
  await Promise.all(writePromises);

  // Save the new hashes
  await saveHashes(newHashes);

  const end = new Date().getTime();
  ms = end - options.startTime;

  if (missingKeys.getUniqueTuples().length > 0) {
    await missingKeyPromise;
    console.log(
      `${crossMarkInRed} Run the build again to update with missing keys.\nDone in  ${ms} ms\n---------------------------------------------]\n`
    );
  } else {
    console.log(
      `${checkMarkInGreen} Done in ${ms} ms with ${files.length} files\n---------------------------------------------]\n`
    );
  }
  lock.locked = false;
  await fs.writeFile(lockFilePath, JSON.stringify(lock, null, 2), "utf8");
}
