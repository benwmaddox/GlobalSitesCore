import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import { minify } from "terser";
import { FileResult } from "./FileResult";
import { glob } from "glob";
import { ellipsis } from "./ConsoleText";
import { rollup } from "rollup";
import { inlineTranslationsCode } from "./inlineTranslations";
import { languageSettings } from "./languages";
import i18next from "./i18n";
import nodePolyfills from "rollup-plugin-polyfill-node";

export async function BundleJSFiles(
  globPattern: string,
  shouldMinify: boolean
): Promise<FileResult[]> {
  const pageFiles = glob.sync(globPattern, { withFileTypes: false });
  const results: FileResult[] = [];
  console.log(`${ellipsis} Bundling ${pageFiles.length} JS files...`);

  for (const file of pageFiles) {
    try {
      // Create and generate the bundle
      const bundle = await rollup({
        input: file,
        plugins: [
          //dynamicImportVars(),
          json(),
          nodeResolve({
            mainFields: ["browser"],
            preferBuiltins: true,
          }),
          commonjs(),
          nodePolyfills(),
        ],
        output: {
          inlineDynamicImports: false,
        },
        onwarn: (warning, warn) => {
          if (warning.code === "THIS_IS_UNDEFINED") {
            return;
          }
          warn(warning);
        },
      });

      var normalizedFilePath = file.replace(/\\/g, "/");
      const fileDir = normalizedFilePath.substring(
        0,
        normalizedFilePath.lastIndexOf("/")
      );
      const { output } = await bundle.generate({
        format: "es",
        dir: fileDir,
        manualChunks(id) {
          id = id.replace(/\\/g, "/");
          // Then handle node_modules as before
          if (id.includes("node_modules")) {
            const matches = id.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
            if (matches) {
              const packageName = matches[1];
              return `vendor-${packageName.replace("@", "").replace("/", "-")}`;
            }
            console.log({ id });
            return "vendor";
          }
        },
      });

      // Process all chunks from the output
      for (const outputChunk of output) {
        // Skip if not a chunk with code
        if (outputChunk.type !== "chunk") {
          continue;
        }

        // Process for each language
        for (const lang of languageSettings.languages) {
          await i18next.changeLanguage(lang);

          // Handle file naming for both main bundle and chunks
          let relativePath: string;
          if (outputChunk.type === "chunk") {
            const fileName = outputChunk.fileName || outputChunk.name;
            relativePath = `${fileDir}/${fileName}`
              .replace("build/", "")
              .replace("build\\", "");
            if (outputChunk.fileName.indexOf("vendor") == -1) {
              relativePath = relativePath.replace(
                ".js",
                shouldMinify ? `.${lang}.min.js` : `.${lang}.js`
              );
            }
          } else {
            relativePath = "unknown.js"; // Add a default value
          }

          // Skip if this path is already in results
          if (results.some((r) => r.relativePath === relativePath)) {
            continue;
          }

          // Apply inline translations
          let processedCode = await inlineTranslationsCode(outputChunk.code);

          // Apply terser if minification is requested
          if (shouldMinify) {
            const minified = await minify(processedCode, {
              sourceMap: false,
              // Add any other terser options here
            });
            processedCode = minified.code || processedCode;
          }

          results.push({
            relativePath,
            content: processedCode,
            includeInSitemap: false,
          });
          //console.log({ relativePath });
        }
      }

      await bundle.close();
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }

  return results;
}
