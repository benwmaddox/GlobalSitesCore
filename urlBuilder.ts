import i18next from "./i18n";
export function urlBuilder(
  directoryEnglish: string | undefined,
  pageEnglish: string | undefined,
  pagePrefix?: string | undefined
): string {
  return `${i18next.t("lang") == "en" ? "" : i18next.t("lang") + "/"}${
    directoryEnglish ? i18next.t(directoryEnglish, { ns: "url" }) + "/" : ""
  }${pagePrefix || ""}${
    pageEnglish ? i18next.t(pageEnglish, { ns: "url" }) + "/" : ""
  }`;
}
