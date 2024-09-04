import { FileResult } from './FileResult';
import { promises as fs } from 'fs'; // Import fs for file operations

const standardWidth = 1200;
const standardHeight = 630;
export async function GetGeneratedImageFile(): Promise<FileResult> {
	const openGraphImage = await GenerateOpenGraphImage('<div>{{data}}</div>', { data: 'data V2' });
	const result: FileResult = {
		relativePath: 'openGraphImage.png',
		content: openGraphImage.image,
		includeInSitemap: false
	};
	return result;
}
export async function GenerateOpenGraphImage(
	template: string,
	data: Record<string, string>
): Promise<{
	// include caching based on template & data

	// Take template (html), data (json), and generate image in a browserless environment
	image: Buffer;
	cacheKey: string;
}> {
	// Generate cache key based on template and data
	const cacheKey = generateCacheKey(template, data);

	// Check if image is already cached
	const cachedImage = await checkCache(cacheKey);
	if (cachedImage) {
		return { image: cachedImage, cacheKey };
	}

	// Generate image
	const image = await generateImage(template, data);

	// Cache the generated image
	cacheImage(cacheKey, image);

	return { image, cacheKey };
}

function generateCacheKey(template: string, data: Record<string, string>): string {
	// Implement a hashing function to create a unique key
	// This is a simple example, consider using a more robust hashing algorithm
	const content = template + JSON.stringify(data);
	return Buffer.from(content).toString('base64');
}

async function checkCache(cacheKey: string): Promise<Buffer | null> {
	// Implement cache checking logic
	const cacheFilePath = './GlobalSitesCore/openGraphImage.json';
	try {
		const data = await fs.readFile(cacheFilePath, 'utf-8');
		const cache = JSON.parse(data);
		return cache[cacheKey] ? Buffer.from(cache[cacheKey], 'base64') : null; // Return cached image if found
	} catch (error) {
		return null; // Return null if file read fails
	}
}

async function generateImage(template: string, data: Record<string, string>): Promise<Buffer> {
	// Implement image generation logic
	// This should use a headless browser or similar tool to render the HTML and capture it as an image
	// Return the image as a Buffer
	// This is a placeholder implementation
	// Step 1: Set up a headless browser environment
	const puppeteer = require('puppeteer');

	// Step 2: Launch browser and create a new page
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	// Step 3: Set viewport to match standard OG image dimensions
	await page.setViewport({
		width: standardWidth,
		height: standardHeight
	});

	// Step 4: Compile the HTML content
	const htmlContent = compileTemplate(template, data);

	// Step 5: Set the page content
	await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

	// Step 6: Capture screenshot
	const screenshot = await page.screenshot({ type: 'png' });

	// Step 7: Close the browser
	await browser.close();

	// Step 8: Return the screenshot as a Buffer
	return screenshot;

	function compileTemplate(template: string, data: Record<string, string>): string {
		// Simple template compilation logic
		// Replace placeholders in the template with data
		let compiledTemplate = template;
		// if any key in template doesn't have a corresponding value, throw error
		// Check if all keys in the template have corresponding values in data
		const templateKeys = template.match(/{{(\w+)}}/g)?.map((key) => key.slice(2, -2)) || [];
		const missingKeys = templateKeys.filter((key) => !(key in data));

		if (missingKeys.length > 0) {
			throw new Error(`Missing values for keys in template: ${missingKeys.join(', ')}`);
		}

		for (const [key, value] of Object.entries(data)) {
			compiledTemplate = compiledTemplate.replace(new RegExp(`{{${key}}}`, 'g'), value);
		}
		return compiledTemplate;
	}
	return Buffer.from('');
}

async function cacheImage(cacheKey: string, image: Buffer): Promise<void> {
	// Implement caching logic
	const cacheFilePath = './.GlobalSitesCore/openGraphImage.json';
	let cache: Record<string, string> = {};

	// Read existing cache if it exists
	try {
		const data = await fs.readFile(cacheFilePath, 'utf-8');
		cache = JSON.parse(data);
	} catch (error) {
		// File may not exist, initialize cache as empty
	}

	// Store the image in the cache using the cacheKey
	cache[cacheKey] = image.toString('base64'); // Store image as base64 string
	await fs.writeFile(cacheFilePath, JSON.stringify(cache)); // Write updated cache to file
}
