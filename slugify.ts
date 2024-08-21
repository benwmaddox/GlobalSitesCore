import { titleCase } from './titleCase';

export function slugifyText(input: string): string {
	return (
		titleCase(input)
			.replace(/ /g, '-')
			.replace(/_/g, '-')
			.replace(/,/g, '-')
			.replace(/\(/g, '-')
			.replace(/\)/g, '-')
			.replace(/--/g, '-')
			.replace(/&/g, 'and')
			.replace(/'/g, '')
			.replace(/:/g, '')
			.replace(/;/g, '')
			.replace(/"/g, '')
			.replace(/\./g, '')
			.replace(/!/g, '')
			.replace(/\?/g, '')
			.replace(/%/g, '')
			.replace(/¿/g, '')
			.replace(/--/g, '-')
			//replace starting and trailing hyphens
			.replace(/^-/, '')
			.replace(/-$/, '')
			.toLowerCase()
	);
}
