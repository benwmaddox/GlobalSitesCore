import i18next from 'i18next';
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
      var selectedLanguageUrl = document.getElementById("language-select").value;
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

export function autoDetectLanguageNotice(languageOptions: LanguageOption[], lang: string): string {
	return /*HTML*/ `
	
	${[...languageOptions]
		.sort((a, b) => (a.code == lang ? 1 : a.code.localeCompare(b.code)))
		.filter((option) => option.code !== lang)
		.map((option) => {
			return /*html*/ `<div class="language-suggestion warning hidden" id="language-suggestion-${
				option.code
			}" ><p>${i18next.t(
				`We have another page in ${option.name}. Would you like to change languages?`
			)}</p><p>${i18next.t(
				`We have another page in ${option.name}. Would you like to change languages?`,
				{
					lng: option.code
				}
			)}</p><p><a class="button" href="${option.url}">${
				i18next.t(`Yes`) +
				' / ' +
				i18next.t(`Yes`, {
					lng: option.code
				})
			}</a> <a class="button" href="#" onclick="hideLanguageSuggestion('${option.code}');">${
				i18next.t(`No`) +
				' / ' +
				i18next.t(`No`, {
					lng: option.code
				})
			}</a></p></div>`;
		})
		.join('\n')}
		
	<script>		
		function autoDetectLanguage() {
			try {
				const userLang = navigator.language || navigator.userLanguage;
				var languageSuggestionElement = document.getElementById('language-suggestion-' + userLang) ||  document.getElementById('language-suggestion-' + userLang.split('-')[0])

				if (languageSuggestionElement) {
					const skipDate = localStorage.getItem('language-suggestion-skipped-'+userLang) || localStorage.getItem('language-suggestion-skipped-'+userLang.split('-')[0]);
					// if the user has not skipped the suggestion in the last 7 days, show the suggestion
					if (!skipDate || Date.now() > new Date(skipDate).getTime() + 7 * 24 * 60 * 60 * 1000) {
						languageSuggestionElement.classList.remove('hidden');
					}
				}
			} catch(e){
				console.log(e);
			}
		}

		function hideLanguageSuggestion(code) {		

			// add class hidden to the element
			document.getElementById('language-suggestion-' + code).classList.add('hidden');

			const skipDate = new Date().toISOString().split('T')[0];
			localStorage.setItem('language-suggestion-skipped-'+code, skipDate);
			return false;
		}
		window.addEventListener('DOMContentLoaded', autoDetectLanguage); 	
	</script>

	`;
}
