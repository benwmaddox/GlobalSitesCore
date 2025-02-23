import * as fs from "fs/promises";
import * as path from "path";
import { FileResult } from "./FileResult";

export async function CopyStaticFiles(options?: {
  srcDir: string;
  destDir: string;
}): Promise<FileResult[]> {
  var srcDir = options?.srcDir || path.join("src", "static");
  var destDir = options?.destDir || "dest";
  var destinationRoot = "dest";

  var files: FileResult[] = [];

  // Helper function to compare file metadata and copy if different
  async function copyFileIfDifferent(
    srcPath: string,
    destPath: string
  ): Promise<void> {
    try {
      const srcStat = await fs.stat(srcPath);
      let destStat;
      try {
        destStat = await fs.stat(destPath);
      } catch (error: any) {
        if (error.code === "ENOENT") {
          // Destination file does not exist
          console.log(`Copying ${srcPath} to ${destPath}`);
          await fs.copyFile(srcPath, destPath);

          files.push({
            relativePath: destPath
              .replaceOnce(destinationRoot, ".")
              //replace all \ with /
              .replace(/\\/g, "/"),
            includeInSitemap: false, // destPath.endsWith(".html"),
            content: undefined,
            languageOptions: [],
          });
          return;
        } else {
          throw error;
        }
      }

      const isDifferent =
        srcStat.size !== destStat.size || srcStat.mtimeMs !== destStat.mtimeMs;
      if (isDifferent) {
        console.log(`Copying ${srcPath} to ${destPath}`);
        await fs.copyFile(srcPath, destPath);
      } else {
        // console.log(`${srcPath} is the same as ${destPath}`);
      }
      files.push({
        relativePath: destPath
          .replaceOnce(destinationRoot, ".")
          //replace all \ with /
          .replace(/\\/g, "/"),
        includeInSitemap: false, // destPath.endsWith(".html"),
        content: undefined,
        languageOptions: [],
      });
    } catch (error) {
      console.error(`Error processing file ${srcPath}:`, error);
    }
  }

  // Recursive function to scan directory and copy files
  async function scanDirectory(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(currentDir, entry.name);
      const destPath = srcPath.replace(srcDir, destDir);

      if (entry.isDirectory()) {
        await scanDirectory(srcPath);
      } else {
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        await copyFileIfDifferent(srcPath, destPath);
      }
    }
  }

  // Start scanning from the source directory
  await scanDirectory(srcDir);
  return files;
}
