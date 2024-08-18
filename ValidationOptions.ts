import { ConfigData } from 'html-validate';

export interface ValidationOptions {
	HTML: 'Sample' | 'Full' | 'None';
	internalURLs: boolean;
	/*
	 * Using html-validate to validate the HTML of the files
	 * See https://html-validate.org/usage/index.html
	 */
	HTMLValidationConfig?: ConfigData;
	skipUrls?: string[];
	throwErrors?: boolean;
	duplicateFilePaths?: boolean;
}
