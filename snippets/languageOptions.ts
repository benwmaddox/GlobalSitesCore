import { LanguageOption } from '../LanguageOption';
import { languageSettings } from '../languages';

export function languageOptionLinks(
	languageOptions: { name: string; url: string }[],
	joinString = ' | '
): string {
	return [...languageOptions]
		.map((option) => {
			return `<a href="${option.url}" >${option.name}</a>`;
		})
		.join(joinString);
}

export function languageOptionAlternateUrls(
	languageOptions: LanguageOption[],
	baseUrl: string
): string {
	return [...languageOptions]
		.map((option) => {
			return option.code == languageSettings.defaultLanguage
				? `<link rel="alternate" href="${baseUrl}${option.url}" hreflang="${option.code}"/>\n<link rel="alternate" href="${baseUrl}${option.url}" hreflang="x-default"/>`
				: `<link rel="alternate" href="${baseUrl}${option.url}" hreflang="${option.code}"/>`;
		})
		.join('\n');
}

export function languageOptionDropDown(languageOptions: LanguageOption[], lang: string): string {
	return /*HTML*/ `
  <script>
    function switchLanguage() {
      var selectedLanguageUrl =
        document.getElementById("language-select").value;
      window.location.href = selectedLanguageUrl;
    }
  </script>
  <div class="language-switcher">
    <select id="language-select" onchange="switchLanguage()">
      ${[...languageOptions]
			.sort((a, b) => (a.code == lang ? 1 : a.code.localeCompare(b.code)))
			.map((option) => {
				return `<option value="${option.url}" ${option.code === lang ? 'selected' : ''}>${
					option.name
				}</option>`;
			})
			.join('\n')}
    </select>
  </div>`;
}
