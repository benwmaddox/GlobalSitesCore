import * as fs from "fs/promises";
import * as path from "path";
import { FileResult } from "./FileResult";

export async function CopyStaticFiles(): Promise<FileResult[]> {
  const srcDir = path.join("src", "static");
  const destDir = "dest";

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
        relativePath: path.relative(destDir, destPath),
        includeInSitemap: false, // destPath.endsWith(".html"),
        content: undefined,
        alternateLanguages: [],
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

// Usage example
(async () => {
  try {
    await CopyStaticFiles();
  } catch (error) {
    console.error("Error copying files:", error);
  }
})();
