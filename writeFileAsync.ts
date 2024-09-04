import path from 'path';
import { promises as fsPromises } from 'fs';

export async function writeFileAsync(filePath: string, data: string) {
	try {
		filePath = path.join('dest', filePath);
		const dir = path.dirname(filePath);

		// Ensure the directory exists
		await fsPromises.mkdir(dir, { recursive: true });

		// Check if the file exists and read its content
		let currentContent = '';
		try {
			currentContent = await fsPromises.readFile(filePath, 'utf-8');
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err; // Ignore error if file doesn't exist
		}

		// Write the file only if there is a difference
		if (currentContent !== data) {
			await fsPromises.writeFile(filePath, data, 'utf-8');
			// console.log(`Writing to ${filePath} | ` + data.substring(0, 300) + "...");
		}
	} catch (err) {
		if (err instanceof Error) {
			console.error(`Error writing file ${filePath}:`, err.message);
		} else {
			console.error(`Unexpected error writing file ${filePath}:`, err);
		}
	}
}
