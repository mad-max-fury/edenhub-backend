// Shared MJML layout + helpers used by every transactional email template.

import { getConfig } from "../config";

const storeUrl = () => getConfig("storefrontUrl") || "https://edenwoodwatchhub.com";

export const emailColors = {
  primary: "#342721",
  background: "#EDEFF5",
  text: "#091E42",
  danger: "#DE350B",
  success: "#1F845A",
  white: "#FFFFFF",
  gray: "#5C6880",
  line: "#E4E7EC",
};

export const naira = (amount: number): string =>
  `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// A pill button rendered through mj-raw so it survives most email clients.
export const emailButton = (
  label: string,
  href: string,
  danger = false,
): string =>
  `<mj-raw><div class="gradient-button" style="background:${
    danger ? emailColors.danger : emailColors.primary
  }"><a href="${href}" class="link-button">${label}</a></div></mj-raw>`;

/**
 * Wrap inner content in the branded EdenHub email shell.
 * `name` is the recipient's first name for the greeting line.
 */
export const renderEmailLayout = (content: string, name: string): string => `
<mjml>
  <mj-head>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
    <mj-style>
      body { font-family: "Inter", sans-serif; }
      .gradient-button { height: 40px; width: 220px; border-radius: 4px; margin: 0 auto; display: flex; justify-content: center; align-items: center; }
      .link-button { color: #ffffff; width: 100%; height: 100%; text-decoration: none; text-align: center; display: block; line-height: 40px; font-weight: 600; font-size: 14px; }
    </mj-style>
  </mj-head>
  <mj-body background-color="${emailColors.background}">
    <mj-wrapper padding="40px 20px">
      <mj-section background-color="${emailColors.white}" padding="40px" border-radius="8px">
        <mj-column>
          <mj-image width="160px" src="${storeUrl()}/logo-email.png" href="${storeUrl()}" padding-bottom="24px" alt="Eden Wood Watch Hub" />

          <mj-text font-family="Inter" font-size="17px" font-weight="600" color="${emailColors.text}" padding-bottom="20px">
            Dear ${name},
          </mj-text>

          ${content}

          <mj-divider border-width="1px" border-style="solid" border-color="${emailColors.line}" padding-top="30px" />

          <mj-text font-family="Inter" font-size="13px" line-height="22px" color="${emailColors.gray}" padding-top="16px">
            Need help? Contact us at <a href="mailto:support@edenwoodwatchhub.com" style="color: ${emailColors.primary}; font-weight: 600; text-decoration: none;">support@edenwoodwatchhub.com</a>
          </mj-text>

          <mj-text font-family="Inter" font-size="13px" color="${emailColors.gray}" padding-top="8px" padding-bottom="0">
            <a href="${storeUrl()}/shop" style="color: ${emailColors.primary}; text-decoration: none; font-weight: 500;">Shop</a> &nbsp;·&nbsp;
            <a href="${storeUrl()}/c/account/orders" style="color: ${emailColors.primary}; text-decoration: none; font-weight: 500;">My Orders</a> &nbsp;·&nbsp;
            <a href="${storeUrl()}/c/account" style="color: ${emailColors.primary}; text-decoration: none; font-weight: 500;">My Account</a> &nbsp;·&nbsp;
            <a href="${storeUrl()}/faqs" style="color: ${emailColors.primary}; text-decoration: none; font-weight: 500;">FAQs</a>
          </mj-text>

          <mj-text font-family="Inter" font-size="14px" color="${emailColors.text}" font-weight="500" padding-top="16px">
            The Eden Wood Watch Hub Team
          </mj-text>
        </mj-column>
      </mj-section>

      <mj-section padding-top="20px">
        <mj-column>
          <mj-text font-family="Inter" font-size="11px" align="center" color="${emailColors.gray}">
            © ${new Date().getFullYear()} Eden Wood Watch Hub. All rights reserved.
          </mj-text>
          <mj-text font-family="Inter" font-size="11px" align="center" color="${emailColors.gray}" padding-top="4px">
            <a href="${storeUrl()}/privacy" style="color: ${emailColors.gray}; text-decoration: underline;">Privacy Policy</a> &nbsp;·&nbsp;
            <a href="${storeUrl()}/terms" style="color: ${emailColors.gray}; text-decoration: underline;">Terms</a> &nbsp;·&nbsp;
            <a href="${storeUrl()}/shipping-returns" style="color: ${emailColors.gray}; text-decoration: underline;">Shipping & Returns</a>
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>`;
