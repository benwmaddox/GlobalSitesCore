export function titleCase(item: string) {
	// Copied from root beer text's convert case page
	if (item === null || item === undefined || item === '') {
		console.trace(`Title is empty.`);
	}
	const l = standardizeToSentenceCaseSingleLine(item);
	const title = l
		.split(' ')
		.map((w: string) => {
			// If all are uppercase, keep uppercase
			if (w === w.toUpperCase()) {
				return w;
			}
			return w.length > 1 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase();
		})
		.join(' ')
		// replace all double spaces with one space
		.replace(/\s\s+/g, ' ');
	if (title.trim() === '') {
		console.trace(`Title is empty for ${item}. ${l} then ${title}`);
		//throw new Error(`Title is empty for ${item}. ${l} then ${title}`);
	}

	return title;
}

function standardizeToSentenceCaseSingleLine(str: string): string {
	// First split camelCase into separate words
	str = str.replace(/([a-z])([A-Z])/g, '$1 $2');
	// This regex pattern finds words in various scripts, including hyphenated words
	const words = str.match(/[\p{L}\p{M}]+(?:[-'][\p{L}\p{M}]+)*|\d+|\S+/gu) || [];

	const result = words
		.map((word, index) => {
			if (/^[\p{Lu}\p{Lt}]+$/u.test(word)) {
				// If all characters are uppercase or titlecase, keep it as is
				return word;
			} else if (
				/^[\p{Ll}\p{Lo}]+$/u.test(word) ||
				/^[\p{Lu}\p{Lt}][\p{Ll}\p{Lo}]+$/u.test(word)
			) {
				// If it's all lowercase, uncased, or starts with an uppercase/titlecase letter, apply sentence case
				return index === 0
					? word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()
					: word.toLocaleLowerCase();
			} else {
				// For mixed scripts or other cases, preserve the original word
				return word;
			}
		})
		.join(' ')
		.replace(/\s\s+/g, ' ')
		.trim();

	return result || str;
}
