import i18next from "./i18n";
import { languageSettings } from "./languages";
export function urlBuilder(
  directoryEnglish: string | undefined,
  pageEnglish: string | undefined,
  pagePrefix?: string | undefined,
  count?: number
): string {
  return `${
    i18next.t("lang", { ns: "meta" }) == languageSettings.defaultLanguage
      ? ""
      : i18next.t("lang", { ns: "meta" }) + "/"
  }${directoryEnglish ? i18next.t(directoryEnglish, { ns: "url" }) + "/" : ""}${
    pagePrefix || ""
  }${
    pageEnglish ? i18next.t(pageEnglish, { ns: "url", count: count }) + "/" : ""
  }`;
}
