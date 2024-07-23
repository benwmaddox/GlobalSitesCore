import i18next from "../i18n";
import { RenderProps, renderLanguageFiles } from "../languages";
import { FileResult } from "../FileResult";
import { titleCase } from "../titleCase";

export interface PrivacyPolicyOptions {
  useGoogleAdsense: boolean;
  useAmazonAssociates: boolean;
  useGoogleAnalytics: boolean;
  useCookies: boolean;
  collectPersonalData: boolean;
  individualOrBusiness: "individual" | "business";
}

export function GeneralPrivacyPolicy(
  props: RenderProps,
  options: PrivacyPolicyOptions
): string {
  const title = i18next.t(`Privacy Policy`);
  const metaDescription = i18next.t(
    `Our privacy policy explains how we collect, use, and protect your personal information.`
  );

  //var iOrUs = options.individualOrBusiness === "individual" ? "I" : "us";
  var myOrOur = options.individualOrBusiness === "individual" ? "my" : "our";
  var iOrWe = options.individualOrBusiness === "individual" ? "I" : "we";
  var iOrUs = options.individualOrBusiness === "individual" ? "me" : "us";
  var meOrUs = options.individualOrBusiness === "individual" ? "me" : "us";

  return /* HTML */ `
    <section>
      <h1>${title}</h1>
      <p>${metaDescription}</p>
    </section>

    <section id="introduction">
      <h2>${i18next.t("Introduction")}</h2>
      <p>
        ${i18next.t(
          `This Privacy Policy describes how ${iOrWe} collect, use, and share your personal information when you visit ${myOrOur} website.`
        )}
      </p>
    </section>

    <section id="information-collection">
      <h2>${i18next.t(`Information ${titleCase(iOrWe)} Collect`)}</h2>
      <p>
        ${i18next.t(
          `${titleCase(
            iOrWe
          )} collect information that you provide directly to ${meOrUs}, such as when you create an account, make a purchase, or contact ${meOrUs} for support.`
        )}
      </p>
      ${options.collectPersonalData
        ? `
          <p>${i18next.t("This may include:")}</p>
          <ul>
            <li>${i18next.t("Name and contact information")}</li>
            <li>${i18next.t("Payment information")}</li>
            <li>${i18next.t("Account credentials")}</li>
          </ul>
        `
        : ""}
    </section>

    ${options.useCookies
      ? `
        <section id="cookies">
          <h2>${i18next.t("Cookies")}</h2>
          <p>${i18next.t(
            `${titleCase(
              iOrWe
            )} use cookies and similar tracking technologies to collect information about your browsing behavior and preferences.`
          )}</p>
        </section>
      `
      : ""}
    ${options.useGoogleAnalytics
      ? `
        <section id="google-analytics">
          <h2>${i18next.t("Google Analytics")}</h2>
          <p>${i18next.t(
            `${titleCase(iOrWe)} use Google Analytics to help ${titleCase(
              meOrUs
            )} understand how our customers use the Site.`
          )} 
            ${i18next.t(
              `You can read more about how Google uses your Personal Information here: <a href="https://policies.google.com/privacy" target="_blank">https://policies.google.com/privacy</a>.`
            )} 
            ${i18next.t(
              `You can also opt-out of Google Analytics here: <a href="https://tools.google.com/dlpage/gaoptout">https://tools.google.com/dlpage/gaoptout</a>.`
            )}</p>
        </section>
      `
      : ""}
    ${options.useGoogleAdsense
      ? `
        <section id="google-adsense">
          <h2>${i18next.t("Google AdSense")}</h2>
          <p>${i18next.t(
            `${titleCase(
              iOrWe
            )} use Google AdSense to display ads on our website. Google AdSense may use cookies and web beacons to collect data about your visits to this and other websites to provide relevant advertisements.`
          )} 
            ${i18next.t(
              `You can read more about how Google uses your Personal Information here: <a href="https://policies.google.com/privacy" target="_blank">https://policies.google.com/privacy</a>`
            )}</p>
        </section>
      `
      : ""}
    ${options.useAmazonAssociates
      ? `
        <section id="amazon-associates">
          <h2>${i18next.t("Amazon Associates")}</h2>
          <p>${i18next.t(
            "As an Amazon Associate I earn from qualifying purchases. Amazon uses cookies to track these purchases and may collect information about your browsing behavior."
          )}</p>
        </section>
      `
      : ""}

    <section id="data-usage">
      <h2>${i18next.t("How We Use Your Information")}</h2>
      <p>
        ${i18next.t(
          `${titleCase(
            iOrWe
          )} use the information we collect to provide, maintain, and improve ${myOrOur} services, to process your requests, transactions, and payments, and to communicate with you.`
        )}
      </p>
    </section>

    <section id="data-sharing">
      <h2>${i18next.t("Sharing Your Information")}</h2>
      <p>
        ${i18next.t(
          `${titleCase(
            iOrWe
          )} do not sell your personal information. ${titleCase(
            iOrWe
          )} may share your information with service providers, business partners, and as required by law.`
        )}
      </p>
    </section>

    <section id="your-rights">
      <h2>${i18next.t("Your Rights")}</h2>
      <p>
        ${i18next.t(
          "Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data."
        )}
      </p>
    </section>

    <section id="changes">
      <h2>${i18next.t("Changes to This Privacy Policy")}</h2>
      <p>
        ${i18next.t(
          `${titleCase(
            iOrWe
          )} may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page.`
        )}
      </p>
    </section>

    <section id="contact">
      <h2>${i18next.t("Contact Us")}</h2>
      <p>
        ${i18next.t(
          `If you have any questions about this Privacy Policy, please contact ${meOrUs}.`
        )}
      </p>
    </section>
  `;
}
