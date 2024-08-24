import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import { minify } from 'terser';
import { FileResult } from './FileResult';
import { glob } from 'glob';
import { ellipsis } from './ConsoleText';
import { rollup } from 'rollup';
import { inlineTranslationsCode } from './inlineTranslations';
import { languageSettings } from './languages';
import i18next from './i18n';

export async function bundleJSFiles(
	globPattern: string,
	shouldMinify: boolean
): Promise<FileResult[]> {
	const pageFiles = glob.sync(globPattern, { withFileTypes: false });
	const results: FileResult[] = [];
	console.log(`${ellipsis} Processing ${pageFiles.length} JS files...\n\n`);

	for (const file of pageFiles) {
		try {
			// Create and generate the bundle
			const bundle = await rollup({
				input: file,
				plugins: [
					json(),
					nodeResolve({
						mainFields: ['browser'],
						preferBuiltins: true
					}),
					commonjs()
				]
			});

			const { output } = await bundle.generate({
				format: 'iife',
				name: 'page'
			});

			const bundledCode = output[0].code;

			// Process for each language
			for (const lang of languageSettings.languages) {
				await i18next.changeLanguage(lang);

				// Apply inline translations
				let processedCode = await inlineTranslationsCode(bundledCode);

				// Apply terser if minification is requested
				if (shouldMinify) {
					const minified = await minify(processedCode, {
						sourceMap: false
						// Add any other terser options here
					});
					processedCode = minified.code || processedCode; // Fallback to original if minification fails
				}

				const relativePath = file
					.replace('build/', '')
					.replace('build\\', '')
					.replace('.js', shouldMinify ? `.${lang}.min.js` : `.${lang}.js`);

				results.push({
					relativePath,
					content: processedCode,
					includeInSitemap: false
				});
			}

			await bundle.close();
		} catch (error) {
			console.error(`Error processing file ${file}:`, error);
		}
	}

	return results;
}
