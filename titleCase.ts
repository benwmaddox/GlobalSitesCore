export function titleCase(item: string) {
	// Copied from root beer text's convert case page
	let l = standardizeToSentenceCaseSingleLine(item);
	var title = l
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
	// This regex pattern finds words in various cases, including non-Latin scripts
	const words = str.match(/\p{L}+|\d+|\S/gu) || [];

	const result = words
		.map((word, index) => {
			if (/^\p{Lu}+$/u.test(word)) {
				// If all characters are uppercase, keep it uppercase
				return word;
			} else if (/^\p{Ll}+$/u.test(word) || /^\p{Lu}\p{Ll}+$/u.test(word)) {
				// If it's all lowercase or starts with a capital letter, apply sentence case
				return index === 0
					? word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()
					: word.toLocaleLowerCase();
			} else {
				// For non-Latin scripts or mixed scripts, preserve the original case
				return word;
			}
		})
		.join(' ')
		.replace(/\s\s+/g, ' ')
		.trim();

	return result || str;
}
