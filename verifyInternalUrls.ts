import { URL } from 'url';
import { FileResult } from './FileResult';
import { checkMarkInGreen, crossMarkInRed, ellipsis } from './ConsoleText';

export function verifyInternalUrls(
	files: FileResult[],
	baseUrl: string,
	ignoreUrls: string[]
): string[] {
	console.log(`${ellipsis} Verifying internal URLs`);
	const errorLimit = 20;

	const definedUrls = new Set<string>();
	files.forEach((file) => {
		let url = new URL(file.relativePath, baseUrl).href;
		// if ends with .index.html, remove it
		if (url.endsWith('index.html')) {
			url = url.slice(0, -10);
		}
		// if ends with .html, remove it and use trailing slash
		if (url.endsWith('.html')) {
			url = url.slice(0, -5) + '/';
		}
		definedUrls.add(url);
	});

	const definedUrlsReferenced = new Set<string>();
	const urlsInContentWithoutMatch = new Set<string>();
	const errors: string[] = [];
	files.forEach((file) => {
		if (typeof file.content === 'string' && file.relativePath.endsWith('.html')) {
			let matches = file.content.match(/href="\/[^"]*"/g);
			let fileUrl = new URL(
				file.relativePath,

				baseUrl
			).href;
			// if ends with .index.html, remove it
			if (fileUrl.endsWith('index.html')) {
				fileUrl = fileUrl.slice(0, -10);
			}
			// if ends with .html, remove it and use trailing slash
			if (fileUrl.endsWith('.html')) {
				fileUrl = fileUrl.slice(0, -5) + '/';
			}

			if (matches) {
				matches.forEach((match) => {
					const matchedUrl = new URL(match.slice(6, -1), fileUrl).href;
					const isOnSameDomain = matchedUrl.startsWith(baseUrl);
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
					const matchedUrl = new URL(match.slice(5, -1), fileUrl).href;
					const isOnSameDomain = matchedUrl.startsWith(baseUrl);
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

			matches = file.content.match(/url\([^)]*\)/g);
			if (matches) {
				matches.forEach((match) => {
					const matchedUrl = new URL(match.slice(4, -1), fileUrl).href;
					const isOnSameDomain = matchedUrl.startsWith(baseUrl);
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

			matches = file.content.match(/content\("[^"]*"\)/g);
			if (matches) {
				matches.forEach((match) => {
					const matchedUrl = new URL(match.slice(9, -2), fileUrl).href;
					const isOnSameDomain = matchedUrl.startsWith(baseUrl);
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
	const okUrls = new Set<string>(ignoreUrls.map((url) => new URL(url, baseUrl).href));

	definedUrls.forEach((definedUrl) => {
		if (errors.length >= errorLimit) {
			return;
		}
		if (definedUrl.indexOf('/vendor-') !== -1) {
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
			const closestMatchA = Array.from(definedUrls)
				.filter((definedUrl) => definedUrl > url)
				.sort((a, b) => a.localeCompare(b))[0];

			const closestMatchB = Array.from(definedUrls)
				.filter((definedUrl) => definedUrl < url)
				.sort((a, b) => b.localeCompare(a))[0];

			const closestMatchC = findClosestMatch(url, definedUrls);

			errors.push(
				`Url ${url} was found in content and is not defined as a file. Closest matches: ${closestMatchA} |\n ${closestMatchB} |\n ${closestMatchC}.`
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
		console.error('Internal URL errors:');
		const verbose = false;
		if (verbose) {
			console.error({ errors, definedUrls, urlsInContentWithoutMatch });
		} else {
			console.error({ errors, urlsInContentWithoutMatch });
		}
	} else {
		console.log(`${checkMarkInGreen} No internal URL errors found`);
	}
	return errors;
}

function findClosestMatch(url: string, definedUrls: Set<string>): string | null {
	let closestMatch: string | null = null;
	let closestDistance = Infinity;

	definedUrls.forEach((definedUrl) => {
		const distance = levenshteinDistance(url, definedUrl);
		if (distance < closestDistance) {
			closestDistance = distance;
			closestMatch = definedUrl;
		}
	});

	return closestMatch;
}

function levenshteinDistance(a: string, b: string): number {
	const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

	for (let i = 0; i <= a.length; i++) {
		for (let j = 0; j <= b.length; j++) {
			if (i === 0) {
				matrix[i][j] = j;
			} else if (j === 0) {
				matrix[i][j] = i;
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
				);
			}
		}
	}

	return matrix[a.length][b.length];
}
