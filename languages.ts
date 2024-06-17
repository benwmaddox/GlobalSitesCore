import i18next from "i18next";
import { LanguageOption } from "./LanguageOption";

export var languages = [
  "bn",
  "de",
  "el",
  "es",
  "fr",
  "hi",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "nl",
  "pa",
  "pl",
  "pt",
  "ru",
  "th",
  "tr",
  "vi",
  "zh",
  "en",
];

export async function getLanguageOptions(
  fileNameWithoutNumberInEnglish: string | undefined,
  i: number | undefined
): Promise<LanguageOption[]> {
  var languageOptions: LanguageOption[] = [];
  for (let language of languages) {
    await i18next.changeLanguage(language);

    var fileNameWithoutNumber = fileNameWithoutNumberInEnglish
      ? i18next.t(fileNameWithoutNumberInEnglish, { ns: "url" })
      : undefined;
    var url =
      (language === "en" ? "/" : `/${language}/`) +
      (fileNameWithoutNumber
        ? i !== undefined
          ? `${i}-${fileNameWithoutNumber}/`
          : fileNameWithoutNumber + "/"
        : "");
    languageOptions.push({
      code: language,
      name: i18next.t(`Language`),
      url: url,
      filePath: url + "index.html",
    });
  }
  return languageOptions;
}

export async function verifyLanguageIntegrity() {
  const languages = Object.keys(i18next.store.data);

  for (let language of languages) {
    await i18next.changeLanguage(language);

    // Retrieve all namespaces, as translations might be split into multiple namespaces
    const namespaces = Object.keys(i18next.store.data[language]);

    console.log(`Checking language ${language}...`);

    var errorCount = 0;
    for (let namespace of namespaces) {
      const translations = i18next.store.data[language][namespace];

      const checkTranslations = (obj: any, prefix = "") => {
        for (let key in obj) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          const value = obj[key];

          if (typeof value === "object") {
            checkTranslations(value, fullKey);
          } else {
            if (fullKey === "localeDateStringFormat") {
              continue;
            }
            if (
              fullKey.includes("-") &&
              !fullKey.includes(" ") &&
              value.includes(" ")
            ) {
              console.error(
                `Key: ${fullKey} has a - but value has a space in language ${language}`
              );
              errorCount++;
            }
            if (!fullKey.includes("-") && value.includes("-")) {
              console.error(
                `Key: ${fullKey} has doesn't have a - but value has a - in language ${language}`
              );
              errorCount++;
            }
          }
        }
      };

      checkTranslations(translations);
    }
    if (errorCount > 0) {
      console.error(
        `Language ${language} has ${errorCount} errors. See above for details.`
      );
    }
  }
}
