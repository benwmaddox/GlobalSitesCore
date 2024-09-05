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
	<script>		
		function autoDetectLanguage() {
			try{
				const userLang = navigator.language || navigator.userLanguage;
				const detectedLang = userLang.split('-')[0];
				const languageSelect = document.getElementById("language-select");
				const defaultLang = languageSelect.options[languageSelect.selectedIndex].value;
				var matchingLink = [...languageSelect.options].find(option => option.hreflang.includes(detectedLang)).href;	
			}catch(e){
				console.log(e);
			}
		}

		window.addEventListener('DOMContentLoaded', autoDetectLanguage); 	
	</script>
	
	
	${[...languageOptions]
		.sort((a, b) => (a.code == lang ? 1 : a.code.localeCompare(b.code)))
		.map((option) => {
			return /*html*/ `<span class="language-suggestion" id="language-suggestion-${
				option.code
			}" class="warning" style="display:inline-block;">
		<p>${i18next.t(
			`Looks like we have another page in ${option.name}. Would you like to change languages?`
		)}</p>
		<p>
		${i18next.t(
			`Looks like we have another page in ${option.name}. Would you like to change languages?`,
			{
				lng: option.code
			}
		)}<br /></p>
		<button onclick="window.location.href = matchingLink;">${
			i18next.t(`Yes`) +
			' / ' +
			i18next.t(`Yes`, {
				lng: option.code
			})
		}</button>
		<button onclick="document.getElementById('language-suggestion').style.display = 'none';">${
			i18next.t(`No`) +
			' / ' +
			i18next.t(`No`, {
				lng: option.code
			})
		}</button>
	</span>`;
		})
		.join('\n')}
		
	`;
}
