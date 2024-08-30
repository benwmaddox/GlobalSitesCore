import fs from 'fs';
import { FileResult } from './FileResult';
export function SiteMap(
	inputFiles: FileResult[],
	baseUrlWithoutTrailingSlash: string
): FileResult[] {
	var files: FileResult[] = [];

	var sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
    ${inputFiles

		.filter((f) => f.includeInSitemap)
		.map(
			(f) =>
				`<url><loc>${baseUrlWithoutTrailingSlash}${standardizePathForSitemap(
					f.relativePath
				)}</loc>${
					f.languageOptions
						? f.languageOptions
								.map(
									(al) =>
										`\r\n<xhtml:link rel="alternate" hreflang="${
											al.code
										}" href="${baseUrlWithoutTrailingSlash}${standardizePathForSitemap(
											al.url
										)}" />`
								)
								.join('')
						: ''
				}</url>`
		)
		.join('\r\n')}
  </urlset>`;

	files.push({
		relativePath: 'sitemap.xml',
		content: sitemap,
		includeInSitemap: false
	});
	return files;
}

function standardizePathForSitemap(relativePath: string) {
	// remove ending index.html
	if (relativePath.endsWith('index.html')) {
		relativePath = relativePath.substring(0, relativePath.length - 10);
	}
	// remove ending .html
	if (relativePath.endsWith('.html')) {
		relativePath = relativePath.substring(0, relativePath.length - 5);
	}
	// make sure starts with /
	if (!relativePath.startsWith('/')) {
		relativePath = '/' + relativePath;
	}

	return relativePath;
}
