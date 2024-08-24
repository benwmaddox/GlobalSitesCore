import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import { FileResult } from './FileResult';
import { glob } from 'glob';
import { ellipsis } from './ConsoleText';
import { rollup } from 'rollup';
import { inlineTranslations } from './inlineTranslations';

export async function bundleJSFiles(globPattern: string, minify: boolean): Promise<FileResult[]> {
	const pageFiles = glob.sync(globPattern, { withFileTypes: false });
	const results: FileResult[] = [];
	console.log(`${ellipsis} Processing ${pageFiles.length} JS files...\n\n`);

	// TODO: for each language... process the file and change the whole route
	// inline translations are used

	for (const file of pageFiles) {
		try {
			const bundle = await rollup({
				input: file,
				plugins: [
					inlineTranslations(),
					json(),
					nodeResolve({
						mainFields: ['browser'],
						preferBuiltins: true
					}),
					commonjs(),
					...(minify ? [terser()] : [])
				]
			});

			const { output } = await bundle.generate({
				format: 'iife',
				name: 'page'
			});

			const content = output[0].code;
			const relativePath = file
				.replace('build/', '')
				.replace('build\\', '')
				.replace('.js', minify ? '.e.js' : '.ee.js');

			results.push({
				relativePath,
				content,
				includeInSitemap: false
			});

			const translationMatches = content.match(/translate\((.*?)\)/g);

			if (translationMatches) {
				//const translationKeys = translationMatches.map((match) => match.replace(/i18next\.t\((.*?)\)/, '$1'));
				//console.log(`Found ${translationKeys.length} translation keys in ${file}`);
				console.log({ translationMatches });
			}

			await bundle.close();
		} catch (error) {
			console.error(`Error processing file ${file}:`, error);
		}
	}

	return results;
}
