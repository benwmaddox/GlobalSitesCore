import i18next from '../GlobalSitesCore/i18n';
import { RenderProps, renderLanguageFiles } from '../GlobalSitesCore/languages';
import { FileResult } from '../GlobalSitesCore/FileResult';

// Define an async function to generate robots.txt for all languages
export async function RobotsTXTPages(baseUrl: string): Promise<FileResult[]> {
	return [
		{
			relativePath: './robots.txt',
			includeInSitemap: false,
			content: RobotsTXT(
				{
					option: {
						code: 'en',
						name: 'English',
						url: '/robots.txt',
						filePath: '/robots.txt'
					},
					allOptions: []
				},
				baseUrl
			),
			languageOptions: []
		}
	];
}

// Implement the main render function
export function RobotsTXT(props: RenderProps, baseUrl: string): string {
	const sitemapUrl = new URL('sitemap.xml', baseUrl).href;

	return `
    User-agent: *
    Allow: /
    
    Sitemap: ${sitemapUrl}
  `;
}

// Update the main application file @build.ts to include the new page
// import { RobotsTXTPages } from "./pages/RobotsTXT";
// await RobotsTXTPages();
