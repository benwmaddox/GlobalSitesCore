import { ConfigData, HtmlValidate } from 'html-validate';
import { FileResult } from './FileResult';
import { checkMarkInGreen, crossMarkInRed, ellipsis } from './ConsoleText';

export function verifyHtmlValidity(
	files: FileResult[],
	options: ConfigData | undefined,
	throwErrors?: boolean
) {
	console.log(`${ellipsis} Verifying HTML is valid`);
	var validator = new HtmlValidate(
		options || {
			extends: ['html-validate:recommended'],
			rules: {
				'void-style': 'off',
				'no-trailing-whitespace': 'off',
				'no-inline-style': 'off',
				'long-title': 'off',
				'wcag/h63': 'off'
			}
		}
	);
	var htmlErrors = 0;
	var filesChecked = 0;
	files.forEach((file) => {
		if (htmlErrors > 100) {
			return;
		}
		if (file.content instanceof Buffer) {
			const report = validator.validateStringSync(file.content.toString());
			filesChecked += 1;
			if (report.errorCount > 0) {
				htmlErrors += 1;
				console.log(`Errors in ${file.relativePath}:`);
				for (const message of report.results[0].messages) {
					console.error(message);
				}
			}
		} else {
			if (file.content === undefined) {
				return;
			}
			const report = validator.validateStringSync(file.content);
			filesChecked += 1;
			if (report.errorCount > 0) {
				htmlErrors += 1;
				console.log(`Errors in ${file.relativePath}:`);
				const message = report.results[0].messages[0];
				console.error({
					//path: file.relativePath,
					// get the line context from the file content. 1 before through 1 after
					lineContext: file.content
						.split('\n')
						.slice(message.line - 1 - 1, message.line + 2)
						.join('\n'),
					ruleId: message.ruleId,
					message: message.message,
					ruleUrl: message.ruleUrl
				});

				if (throwErrors === true) {
					throw new Error('HTML validation errors found');
				}
			}
		}
	});
	if (htmlErrors > 0) {
		console.log(
			`${crossMarkInRed} Finished verifying ${filesChecked} HTML files with ${htmlErrors} errors`
		);
	} else {
		console.log(`${checkMarkInGreen} Finished verifying ${filesChecked} HTML files`);
	}
}
