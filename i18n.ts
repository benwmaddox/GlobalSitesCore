import i18next, { InitOptions } from "i18next";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

import Backend from "i18next-fs-backend";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { TupleSet } from "./TupleSet";
import { titleCase } from "./titleCase";
import { slugifyText } from "./slugify";
import { crossMarkInRed } from "./ConsoleText";
import { languageSettings } from "./languages";

// All cheap translations for now...
// TODO: maybe use https://locize.com/ or https://cloud.google.com/translate/pricing

const gptModel = "gpt-4o-mini";
const maxTranslationsPerCall = 1000;

interface Translations {
  [key: string]: string;
}

let lastApiCallTime = 0;
export let missingKeys = new TupleSet();

const i18nOptions: InitOptions = {
  lng: languageSettings.defaultLanguage,
  fallbackLng: false,
  backend: {
    loadPath: "./src/locales/{{lng}}/{{ns}}.json",
    // addPath: "./src/locales/{{lng}}/{{ns}}.missing.json",
  },
  saveMissing: true,
  missingKeyHandler: (lng, ns, key) => {
    // console.log(
    //   `Missing translation for key "${key}" in language "${lng}" and namespace "${ns}"`
    // );
    // log js stack trace
    // console.log(new Error().stack);
    lng.forEach((l) => {
      if (key !== "" && !key.includes("%")) missingKeys.add([key, l, ns]);
    });
    // throw new Error(
    //   `Missing translation for key "${key}" in language "${lng}" and namespace "${ns}"`
    // );
  },
  missingInterpolationHandler: (
    text: string,
    value: string,
    options: InitOptions<object>
  ) => {
    // exclude from blog posts, which may have inline code
    if (options.ns === "blog") return value;

    throw new Error(
      `Missing interpolation for key "${text}" with value "${value}".`
    );
  },
  ns: ["common", "url", "meta", "blog"],
};

i18next.use(Backend).init(i18nOptions);
export default i18next;
export async function bulkTranslateOpenAI(
  lng: string,
  ns: string,
  keys: string[],
  additionalSiteContext: string
): Promise<void> {
  const TranslationFormat = z.object({ t: z.string() });
  const filePath = path.resolve(`./src/locales/${lng}/${ns}.json`);
  let existingTranslations: Translations = {};
  if (fs.existsSync(filePath)) {
    existingTranslations = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  let processedCount = 0; // Counter for processed keys

  for (const key of keys) {
    let completion = null;
    const openai = new OpenAI();
    try {
      completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              `Please translate provided text from language code (en) to language code (${lng}).
            Note that ending in _one, _other, _few, _many should be treated as pluralization rules. The key is the original phrase. The value is the translation. Any translation key that has {{}} should not be translated but treated as a replacement placeholder. Keep the {{}} in the key and translation. ` +
              `This translation is used on a public website and should be clear. ` +
              additionalSiteContext +
              " " +
              (ns === "url"
                ? ` This is meant to be used in a url and should not contain spaces or any characters not safe for URLs other than {{ and }} which are used as placeholders.  Use - as word separators. `
                : "") +
              (ns === "blog" ? ` This is intended as a blog post. ` : ""),
          },
          {
            role: "user",
            content: ns === "url" ? titleCase(key) : key,
          },
        ],
        model: gptModel,
        response_format: zodResponseFormat(TranslationFormat, "translation"),
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `Error fetching translation from OpenAI: ${error.message}`
        );
        console.error(error.stack);
      } else {
        console.error(`Unknown error: ${error}`);
        fs.appendFileSync("log.txt", `Unknown error: ${error}\n`);
      }
      continue;
    }

    if (!completion) {
      continue;
    }

    try {
      const messageContent = completion.choices[0].message.content;
      if (!messageContent) {
        throw new Error("Message content is empty");
      }
      const parsedContent = JSON.parse(messageContent);
      const translation = parsedContent.t;
      let processedTranslation = translation;

      processedTranslation = postTranslationProcessing(
        processedTranslation,
        key,
        ns
      );

      console.log(
        `---\nTranslating key "${key}":\n${translation}\n${processedTranslation}\n---`
      );

      if (processedTranslation == "") {
        console.error(`Translation is empty for key "${key}"`);
      } else {
        existingTranslations[key] = processedTranslation;
      }
      const followUp = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are to verify whether the a translation is reasonable. This is from English to ${lng}. If the translation is fine, return an empty translation. If it needs to be corrected, provide the updated translation. Do not include any extra desciption. Just the translation. If no translation is possible, leave it blank. If the translation includes html tags, make sure they close properly.`,
          },
          {
            role: "user",
            content: `${key}\n\nto\n\n${processedTranslation}`,
          },
        ],
        model: gptModel,
        response_format: zodResponseFormat(TranslationFormat, "translation"),
      });

      if (
        followUp.choices[0].message.content &&
        followUp.choices[0].message.content.trim() != "" &&
        followUp.choices[0].message.content.trim() != processedTranslation
      ) {
        processedTranslation = JSON.parse(
          followUp.choices[0].message.content
        ).t;

        processedTranslation = postTranslationProcessing(
          processedTranslation,
          key,
          ns
        );

        if (processedTranslation == "") {
          // Means the original was good.
        } else {
          existingTranslations[key] = processedTranslation;
        }
      }
    } catch (error: unknown) {
      console.error(
        `Error processing translation for key "${key}": ${
          error instanceof Error ? error.message : error
        }\n\n\n`
      );
      console.error(completion);
    }

    processedCount++; // Increment the counter

    // Save translations every x keys
    if (processedCount % 10 === 0) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      // Sort the keys
      existingTranslations = Object.keys(existingTranslations)
        .sort()
        .reduce((obj: Translations, key: string) => {
          obj[key] = existingTranslations[key];
          return obj;
        }, {});
      fs.writeFileSync(
        filePath,
        JSON.stringify(existingTranslations, null, 2),
        "utf-8"
      );
      console.log(`Saved translations for ${processedCount} keys.`);
    }
  }

  // Sort the keys
  existingTranslations = Object.keys(existingTranslations)
    .sort()
    .reduce((obj: Translations, key: string) => {
      obj[key] = existingTranslations[key];
      return obj;
    }, {});
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  // Final save for any remaining translations
  fs.writeFileSync(
    filePath,
    JSON.stringify(existingTranslations, null, 2),
    "utf-8"
  );
}

function postTranslationProcessing(
  translation: string,
  key: string,
  ns: string
): string {
  if (key == undefined) {
    console.trace();
    throw new Error("Key is undefined");
  } else if (key === "") {
    console.trace(`Key is empty for post translation processing.`);
  }
  try {
    if (ns === "url") {
      // Working around some - issues with translation
      return slugifyText(translation);
    } else {
      if (
        !key.includes("-") &&
        key.includes(" ") &&
        translation.includes("-")
      ) {
        return translation.replace(/-/g, " ");
      }
    }
  } catch (error) {
    console.error(
      `Error processing translation for key "${key}" in namespace "${ns}". Translation is listed as "${translation}". Error: ${error}`
    );
    return translation;
  }
  // if it still has placeholder { } in translation and in source, make sure the translation uses the same word as the source. Some translations translate the placeholder by mistake.
  const keywordsInKey = key.match(/{[^}]+}/g);
  const keywordsInTranslation = translation.match(/{[^}]+}/g);
  if (keywordsInKey && keywordsInTranslation) {
    for (let i = 0; i < keywordsInKey.length; i++) {
      if (keywordsInKey[i] !== keywordsInTranslation[i]) {
        translation = translation.replace(
          keywordsInTranslation[i],
          keywordsInKey[i]
        );
      }
    }
  }

  return translation;
}

export async function bulkTranslateGoogleTranslate(
  lng: string,
  ns: string,
  keys: string[]
): Promise<void> {
  const batchSize = 1000;
  const batchCount = Math.ceil(keys.length / batchSize);

  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const batchStart = batchIndex * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, keys.length);
    let batchKeys = keys.slice(batchStart, batchEnd);

    let initialBatchKeyCount = batchKeys.length;
    if (ns !== "url") {
      let originalBatchKeys = batchKeys;
      batchKeys = batchKeys.filter((key) => removePluralSuffix(key) === key);
      if (batchKeys.length !== initialBatchKeyCount) {
        console.log(
          `Google Translate does not support pluralization. Some keys will not be translated:\n  ` +
            originalBatchKeys
              .filter((key) => removePluralSuffix(key) !== key)
              .join("\n  ")
        );
      }
    }

    if (lng === languageSettings.defaultLanguage) {
      for (let i = 0; i < batchKeys.length; i++) {
        const key = batchKeys[i];

        const filePath = path.resolve(`./src/locales/${lng}/${ns}.json`);

        let existingTranslations: Translations = {};
        if (fs.existsSync(filePath)) {
          existingTranslations = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        }

        // Add the new translation
        if (ns === "url") {
          existingTranslations[key] = slugifyText(removePluralSuffix(key));
        } else {
          existingTranslations[key] = removePluralSuffix(key);
        }
        // Sort the keys
        existingTranslations = Object.keys(existingTranslations)
          .sort()
          .reduce((obj: Translations, key: string) => {
            obj[key] = existingTranslations[key];
            return obj;
          }, {});
        /* 
          
    if (removePluralSuffix(batchKeys[i]) !== batchKeys[i] && ns !== "url") {
      console.log(
        `Google Translate does not support pluralization. Replacing value with __. "${
          batchKeys[i]
        }": "${removePluralSuffix(batchKeys[i])}" vs "${removePluralSuffix(
          response.translations[i].translatedText
        )}".`
      );

      existingTranslations[batchKeys[i]] = "____";
      continue;
    }
          */

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        // Save the updated translations back to the file
        fs.writeFileSync(
          filePath,
          JSON.stringify(existingTranslations, null, 2),
          "utf-8"
        );
      }
    } else {
      const { TranslationServiceClient } = require("@google-cloud/translate");

      const translationClient = new TranslationServiceClient();

      const projectId = "translations-426017";
      const translateLocation = "global";
      const contents: string[] = [];
      for (let i = 0; i < batchKeys.length; i++) {
        contents.push(ns === "url" ? titleCase(batchKeys[i]) : batchKeys[i]);
      }

      if (contents.length === 0) {
        console.log(
          `${crossMarkInRed} No keys to translate with Google. Skipping translation.  Another translation service is needed for any pluralization. Alternately, you can change the translation key to not require pluralization.`
        );
        return;
      }
      // Construct request
      const request = {
        parent: `projects/${projectId}/locations/${translateLocation}`,
        contents: contents,
        mimeType: "text/plain", // mime types: text/plain, text/html
        sourceLanguageCode: languageSettings.defaultLanguage,
        targetLanguageCode: lng,
      };

      // Run request

      const [response] = await translationClient.translateText(request);

      const filePath = path.resolve(`./src/locales/${lng}/${ns}.json`);
      let existingTranslations: Translations = {};
      if (fs.existsSync(filePath)) {
        existingTranslations = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }

      for (let i = 0; i < response.translations.length; i++) {
        const key = batchKeys[i];
        if (key === undefined) {
          console.trace();
          console.error(
            "Key is undefined. Translation is: " +
              response.translations[i].translatedText
          );
          continue;
        }
        existingTranslations[batchKeys[i]] = postTranslationProcessing(
          response.translations[i].translatedText,
          key,
          ns
        );
      }

      // Sort and save the updated translations
      existingTranslations = Object.keys(existingTranslations)
        .sort()
        .reduce((obj: Translations, key: string) => {
          obj[key] = existingTranslations[key];
          return obj;
        }, {});

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        JSON.stringify(existingTranslations, null, 2),
        "utf-8"
      );
    }
  }
}

function removePluralSuffix(key: string) {
  var regexMatch = key.match(/_.+$/);
  if (regexMatch) {
    // replace with "
    return key.replace(regexMatch[0], "");
  } else {
    return key;
  }
}

// export async function translate(
//   key: string,
//   lng: string,
//   ns: string
// ): Promise<void> {
//   if (key === "") {
//     // throw new Error("Key is empty");
//     return;
//   }
//   let useOpenAI = false;
//   let useGoogleTranslate = true;
//   let translation = key;
//   if (lng === "en") {
//     useOpenAI = false;
//     useGoogleTranslate = false;
//   }
//   let completion: any;

//   lastApiCallTime = Date.now();

//   console.log(
//     `${new Date().toLocaleTimeString()} | Translating key "${key}" to language "${lng}" in namespace "${ns}"`
//   );
//   // Use OpenAI to generate the translation
//   if (useOpenAI) {
//     try {
//       const openai = new OpenAI();
//       completion = await openai.chat.completions.create({
//         messages: [
//           {
//             role: "system",
//             content:
//               `You are a helpful assistant designed to output JSON. The format should be { "translation": "value" }.` +
//               (ns === "url"
//                 ? ` This is meant to be used in a url and should not contain spaces or any characters not safe for URLs.`
//                 : ""),
//           },
//           {
//             role: "user",
//             content: `Please translate the following text from english (en) to language code ${lng}: "${
//               // for urls, making sure it is easier to translate so using title case
//               ns === "url" ? titleCase(key) : key
//             }"`,
//           },
//         ],
//         // Cheap model for short keys, expensive model for long keys
//         model: key.length > 200 ? gptModelLong : gptModelShort,
//       });
//     } catch (error) {
//       // log all completions to log.txt
//       if (error instanceof Error) {
//         console.error(
//           `Error fetching translation from OpenAI: ${error.message}`
//         );
//         console.error(error.stack);
//         // fs.appendFileSync(
//         //   "log.txt",
//         //   `Error fetching translation from OpenAI: ${error.message}\n`
//         // );
//       } else {
//         console.error(`Unknown error: ${error}`);
//         fs.appendFileSync("log.txt", `Unknown error: ${error}\n`);
//       }
//     }

//     if (!completion) {
//       return;
//     }
//     let content = { [key]: key };
//     let translation = "";

//     // log all completions to log.txt
//     fs.appendFileSync(
//       "log.txt",
//       +"\n\n----------------\n" +
//         " Key: " +
//         key +
//         " Language: " +
//         lng +
//         " Namespace: " +
//         ns +
//         "\n\n" +
//         JSON.stringify(completion, null, 2) +
//         "\n\n----------------\n\n"
//     );

//     // if the key contains %, it is likely translating in error. Skip it.
//     if (key.includes("%")) {
//       console.error(`Skipping key "${key}" as it contains %`);
//       return;
//     }
//     var messageContent = "";
//     try {
//       messageContent = completion.choices[0].message.content;
//       if (messageContent.includes("```json")) {
//         //remove leading ```json and trailing ```
//         messageContent = messageContent.replace("```json", "");
//         messageContent = messageContent.replace("```", "");
//       }
//       // replace all newlines and other control characters with spaces - openai sometimes returns newlines which it shouldn't here.
//       messageContent = messageContent
//         .replace(/\n/g, " ")
//         .replace(/\r/g, " ")
//         .replace(/\t/g, " ");
//       content = JSON.parse(messageContent || "{}");
//     } catch (error: unknown) {
//       console.error(
//         `Error parsing JSON response from OpenAI: ${
//           completion.choices[0].message.content
//         }\n\n\nprocessed message ${messageContent}
//          \n\n\n${error instanceof Error ? error.message : error}\n\n\n`
//       );
//       console.error(completion);

//       // write content to file
//       fs.appendFileSync(
//         "log.txt",
//         `
//     ----
//     Key: ${key}
//     Language: ${lng}
//     Namespace: ${ns}
//     Error parsing JSON response from OpenAI: ${
//       completion.choices[0].message.content
//     }
//     ${error instanceof Error ? error.message : error}
//     ${JSON.stringify(completion, null, 2)}
//     ----`
//       );
//       // Temp measure dealing with things that can't translate currently
//       translation = "____";
//       // return;
//     }
//     if (!translation) {
//       throw new Error(
//         `Translation not found in the response for key "${key}" in language "${lng}". response was ${JSON.stringify(
//           completion
//         )}`
//       );
//     }
//   } else if (useGoogleTranslate) {
//     const { TranslationServiceClient } = require("@google-cloud/translate");

//     const translationClient = new TranslationServiceClient();

//     const projectId = "translations-426017";
//     const translateLocation = "global";
//     const text = ns === "url" ? titleCase(key) : key;

//     // Construct request
//     const request = {
//       parent: `projects/${projectId}/locations/${translateLocation}`,
//       contents: [text],
//       mimeType: "text/plain", // mime types: text/plain, text/html
//       sourceLanguageCode: "en",
//       targetLanguageCode: lng,
//     };

//     // Run request
//     const [response] = await translationClient.translateText(request);

//     for (const googleTranslation of response.translations) {
//       translation = googleTranslation.translatedText;
//     }
//   }

//   // Load the existing translations
//   const filePath = path.resolve(`./src/locales/${lng}/${ns}.json`);
//   // const missingFilePath = path.resolve(
//   //   `./src/locales/${lng}/${ns}.missing.json`
//   // );

//   let existingTranslations: Translations = {};
//   if (fs.existsSync(filePath)) {
//     existingTranslations = JSON.parse(fs.readFileSync(filePath, "utf-8"));
//   } else {
//     // make dir
//     fs.mkdirSync(path.dirname(filePath), { recursive: true });
//     // write file
//     fs.writeFileSync(filePath, "{}", "utf-8");
//   }

//   // Add the new translation
//   existingTranslations[key] = translation;
//   // Sort the keys
//   existingTranslations = Object.keys(existingTranslations)
//     .sort()
//     .reduce((obj: Translations, key: string) => {
//       obj[key] = existingTranslations[key];
//       return obj;
//     }, {});

//   for (let key in existingTranslations) {
//     let translation = existingTranslations[key];
//     if (ns === "url") {
//       // Working around some - issues with translations

//       existingTranslations[key] = slugifyText(translation);
//     } else {
//       if (
//         !key.includes("-") &&
//         key.includes(" ") &&
//         translation.includes("-")
//       ) {
//         translation = translation.replace(/-/g, " ");
//         existingTranslations[key] = translation;
//       }
//     }

//     // Translation cleanup
//     if (false) {
//       // if translation is exact match for key and it isn't in English, remove the key to reprocess in the future
//       if (
//         key === translation &&
//         lng !== "en" &&
//         /*key contains any letters*/ /[a-zA-Z]/.test(key) &&
//         key.length > 3
//       ) {
//         console.log(
//           `Removing key "${key}" from language ${lng} as it is an exact match`
//         );
//         delete existingTranslations[key];
//       }
//       // If the key is the same other than _ being replaced with - and the translation is the same, remove the key
//       else if (
//         key
//           .replace(/_/g, "")
//           .replace(/-/g, "")
//           .replace(/ /g, "")
//           .toLowerCase() ===
//           translation
//             .replace(/_/g, "")
//             .replace(/-/g, "")
//             .replace(/ /g, "")
//             .toLowerCase() &&
//         lng !== "en" &&
//         /*key contains any letters*/ /[a-zA-Z]/.test(key) &&
//         key.length > 3
//       ) {
//         console.log(
//           `Removing key "${key}" from language ${lng} as it is a match (with underscores/dashes)`
//         );
//         delete existingTranslations[key];
//       }
//       // if the translation is the translation code, remove the key
//       else if (lng === translation && key !== "lang") {
//         console.log(
//           `Removing key "${key}" from language ${lng} as it is the language name`
//         );
//         delete existingTranslations[key];
//       }
//       // If the translation starts with the language code and :, remove the key
//       else if (translation.startsWith(lng + ":") && key !== "lang") {
//         // replace lang: with the rest of the translation
//         translation = translation.replace(lng + ":", "");
//         existingTranslations[key] = translation;
//       }
//     }
//   }
//   // make sure directory exists
//   fs.mkdirSync(path.dirname(filePath), { recursive: true });
//   // Save the updated translations back to the file
//   fs.writeFileSync(
//     filePath,
//     JSON.stringify(existingTranslations, null, 2),
//     "utf-8"
//   );

//   // Also save to the missing file for tracking
//   // let missingTranslations: Translations = {};
//   // if (fs.existsSync(missingFilePath)) {
//   //   missingTranslations = JSON.parse(fs.readFileSync(missingFilePath, "utf-8"));
//   // }

//   // missingTranslations[key] = translation;

//   // for each translation, check if it contains a "-" and the key doesn't contain a "-"
//   // for (let key in missingTranslations) {
//   //   let translation = missingTranslations[key];
//   //   // Working around some - issues with translations
//   //   if (key.includes("-") && translation.includes(" ")) {
//   //     translation = translation.replace(/ /g, "-");
//   //     missingTranslations[key] = translation;
//   //   } else if (!key.includes("-") && translation.includes("-")) {
//   //     translation = translation.replace(/-/g, " ");
//   //     missingTranslations[key] = translation;
//   //   }
//   // }

//   // fs.writeFileSync(
//   //   missingFilePath,
//   //   JSON.stringify(missingTranslations, null, 2),
//   //   "utf-8"
//   // );

//   // if (error instanceof Error) {
//   //   console.error(`Error fetching translation from OpenAI: ${error.message}`);
//   //   console.error(error.stack);
//   // } else {
//   //   console.error(`Unknown error: ${error}`);
//   // }
// }

export async function BulkUpdateMissingKeysManual() {
  const uniqueTuples = missingKeys.getUniqueTuples();
  if (uniqueTuples.length > 0) {
    console.log(
      "Preparing to translate missing keys: " +
        uniqueTuples.length +
        " keys\r\n"
    );

    // grouped by ns and lang (strongly typed)
    const groupedTuples = uniqueTuples.reduce((acc, [key, lang, ns]) => {
      if (!acc.has(ns)) {
        acc.set(ns, new Map());
      }
      if (!acc.get(ns).has(lang)) {
        acc.get(ns).set(lang, []);
      }
      acc.get(ns).get(lang).push(key);
      return acc;
    }, new Map());

    for (let [ns, langMap] of groupedTuples) {
      for (let [lang, keys] of langMap) {
        if (keys.length > maxTranslationsPerCall) {
          throw new Error(
            `Likely translating something wrong with ${keys.length} keys. Keys: ` +
              keys.join(", ")
          );
        }
        console.log(
          `Adding ${keys.length} placeholder keys within namespace ${ns} to ${lang} language`
        );

        const filePath = path.resolve(`./src/locales/${lang}/${ns}.json`);

        let existingTranslations: Translations = {};
        if (fs.existsSync(filePath)) {
          existingTranslations = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        }

        for (let key of keys) {
          if (ns === "url") {
            if (lang === languageSettings.defaultLanguage) {
              existingTranslations[key] = slugifyText(key);
            } else {
              existingTranslations[key] = `[[${slugifyText(key)}]]`;
            }
          } else {
            if (lang === languageSettings.defaultLanguage) {
              existingTranslations[key] = key;
            } else {
              existingTranslations[key] = `[[${key}]]`;
            }
          }
        }

        existingTranslations = Object.keys(existingTranslations)
          .sort()
          .reduce((obj: Translations, key: string) => {
            obj[key] = existingTranslations[key];
            return obj;
          }, {});

        fs.mkdirSync(path.dirname(filePath), { recursive: true });

        fs.writeFileSync(
          filePath,
          JSON.stringify(existingTranslations, null, 2),
          "utf-8"
        );
      }
    }

    console.log("Added missing key placeholders to locale files.");
  }
}

export async function BulkUpdateMissingKeysGoogleTranslate() {
  var uniqueTuples = missingKeys.getUniqueTuples();
  if (uniqueTuples.length > 0) {
    console.log(
      "Preparing to translate missing keys: " +
        uniqueTuples.length +
        " keys\r\n"
    );
    // grouped by ns and lang (strongly typed)
    var groupedTuples = uniqueTuples.reduce((acc, [key, lang, ns]) => {
      if (!acc.has(ns)) {
        acc.set(ns, new Map());
      }
      if (!acc.get(ns).has(lang)) {
        acc.get(ns).set(lang, []);
      }
      acc.get(ns).get(lang).push(key);
      return acc;
    }, new Map());

    var translationPromises: Promise<void>[] = [];

    for (let [ns, langMap] of groupedTuples) {
      for (let [lang, keys] of langMap) {
        if (keys.length > maxTranslationsPerCall) {
          throw new Error(
            `Likely translating something wrong with ${keys.length} keys. Keys: ` +
              keys.join(", ")
          );
        }
        console.log(
          `Translating ${keys.length} keys within namespace ${ns} to ${lang} language`
        );
        translationPromises.push(bulkTranslateGoogleTranslate(lang, ns, keys));
      }
    }
    await Promise.all(translationPromises);
    console.log("Done translating missing keys");
  }
}

export async function BulkUpdateMissingKeysOpenAI(
  additionalSiteContext: string
) {
  var uniqueTuples = missingKeys.getUniqueTuples();
  if (uniqueTuples.length > 0) {
    console.log(
      "Preparing to translate missing keys: " +
        uniqueTuples.length +
        " keys\r\n"
    );
    // grouped by ns and lang (strongly typed)
    var groupedTuples = uniqueTuples.reduce((acc, [key, lang, ns]) => {
      if (!acc.has(ns)) {
        acc.set(ns, new Map());
      }
      if (!acc.get(ns).has(lang)) {
        acc.get(ns).set(lang, []);
      }
      acc.get(ns).get(lang).push(key);
      return acc;
    }, new Map());

    var translationPromises: Promise<void>[] = [];
    for (let [ns, langMap] of groupedTuples) {
      for (let [lang, keys] of langMap) {
        if (keys.length > maxTranslationsPerCall) {
          throw new Error(
            `Likely translating something wrong with ${keys.length} keys. Keys: ` +
              keys.join(", ")
          );
        }
        console.log(
          `Translating ${keys.length} keys within namespace ${ns} to ${lang} language`
        );
        translationPromises.push(
          bulkTranslateOpenAI(lang, ns, keys, additionalSiteContext)
        );
      }
    }
    await Promise.all(translationPromises);
    console.log("Done translating missing keys");
  }
}
