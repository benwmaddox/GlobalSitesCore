import i18next from './i18n';

export function inlineTranslations() {
	return {
		name: 'inline-translations',
		// Transform code to replace translation keys with actual text
		transform(code: string) {
			// Simple regex to replace calls with translated strings
			return {
				code:
					// Direct method call (translate('key'))
					code
						.replace(/translate\(['"`](.+?)['"`]\)/g, (_, key) => {
							return JSON.stringify(i18next.t(key));
						})
						// bundled style method call ((0, translate)('key'))
						.replace(/\([\w\d,\s_.]*?translate\)\(['"`](.+?)['"`]\)/g, (_, key) => {
							return JSON.stringify(i18next.t(key));
						}),
				map: null
			};
		}
	};
}
export function inlineTranslationsCode(code: string): string {
	return inlineTranslations().transform(code).code;
}
