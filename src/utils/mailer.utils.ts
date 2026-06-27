import nodemailer, { Transporter } from "nodemailer";
import sgMail from "@sendgrid/mail";
import mjml2html from "mjml";
import { getConfig } from "../config";
import AppError from "../errors/appError";
import log from "./logger";

type EmailProvider = "sendgrid" | "smtp" | "console";

/**
 * Transactional email sender.
 *
 * The transport is chosen by EMAIL_PROVIDER (falling back to sendgrid in
 * production / smtp elsewhere):
 *   - "smtp"     → any SMTP server. Use Mailtrap, Gmail, Brevo, etc. in
 *                  dev/staging; deliverable to yopmail/gmail recipients.
 *   - "sendgrid" → SendGrid API, intended for production.
 *   - "console"  → no network send; logs the message. Used automatically as a
 *                  safe fallback when the selected provider has no credentials.
 */
export class MailerService {
  private static instance: MailerService;
  private nodemailerTransporter?: Transporter;
  private provider: EmailProvider;
  private readonly from: string;

  private constructor() {
    this.from = getConfig("emailFrom");
    this.provider = this.resolveProvider();
  }

  // Decide the active transport and initialise it. Falls back to "console" when
  // the chosen provider is missing credentials so dev never crashes on boot.
  private resolveProvider(): EmailProvider {
    const requested = String(getConfig("emailProvider")).toLowerCase();

    if (requested === "sendgrid") {
      const key = getConfig("sendgridApiKey");
      if (!key) {
        log.warn(
          "[mailer] EMAIL_PROVIDER=sendgrid but SENDGRID_API_KEY is empty — falling back to console.",
        );
        return "console";
      }
      sgMail.setApiKey(key);
      return "sendgrid";
    }

    if (requested === "console") return "console";

    // Default / "smtp": validate the SMTP config before committing.
    const host = getConfig("smtpHost");
    const user = getConfig("smtpUser");
    const pass = getConfig("smtpPass");
    if (!host || host === "smtp.example.com" || !user || !pass) {
      log.warn(
        "[mailer] SMTP credentials missing or placeholder — falling back to console. " +
          "Set SMTP_HOST/SMTP_USER/SMTP_PASS (e.g. Mailtrap or Gmail) to send for real.",
      );
      return "console";
    }

    const smtpPort = getConfig("smtpPort");
    this.nodemailerTransporter = nodemailer.createTransport({
      host,
      port: smtpPort,
      secure: smtpPort === 465, // 465 = implicit TLS; 587 upgrades via STARTTLS
      auth: { user, pass },
    });
    return "smtp";
  }

  public static getInstance(): MailerService {
    if (!MailerService.instance) {
      MailerService.instance = new MailerService();
    }
    return MailerService.instance;
  }

  public get activeProvider(): EmailProvider {
    return this.provider;
  }

  // When the recipient guard is on (dev/staging by default), restrict real
  // delivery to the configured allow-list so a non-prod box can never email a
  // real customer. Allow-list entries are matched as either an exact address
  // or a domain. When the guard is off (production), everyone is allowed.
  private isRecipientAllowed(to: string): boolean {
    if (!getConfig("emailRestrictRecipients")) return true;
    const address = to.trim().toLowerCase();
    const domain = address.split("@")[1] || "";
    return getConfig("emailAllowedRecipients").some(
      (allowed) =>
        address === allowed || // exact address, e.g. qa@edenhub.com
        domain === allowed || // whole domain, e.g. yopmail.com
        domain.endsWith(`.${allowed}`), // subdomains of an allowed domain
    );
  }

  private compileMjml(mjmlString: string): string {
    const { html, errors } = mjml2html(mjmlString, {
      validationLevel: "soft",
    });

    if (errors.length > 0) {
      log.warn(
        "MJML Warnings:",
        errors.map((e: any) => e.message),
      );

      if (!html) {
        throw new AppError(
          "Email template compilation failed critically.",
          500,
        );
      }
    }
    return html;
  }

  // Compile an MJML template to HTML without sending — used to validate
  // every template renders before relying on it in a live flow.
  public renderHtml(mjmlTemplate: string): string {
    return this.compileMjml(mjmlTemplate);
  }

  // Fire-and-forget send: never throws, so transactional flows (orders,
  // payments) are not aborted by an email delivery hiccup.
  public async sendSafe(to: string, subject: string, mjmlTemplate: string) {
    try {
      await this.send(to, subject, mjmlTemplate);
    } catch (error: any) {
      log.error(`Non-blocking email failed to ${to}:`, error?.message);
    }
  }

  public async send(to: string, subject: string, mjmlTemplate: string) {
    try {
      if (!this.isRecipientAllowed(to)) {
        log.info(
          `[mailer] recipient guard: skipped email to "${to}" — only ${getConfig(
            "emailAllowedRecipients",
          ).join(", ")} are allowed in this environment.`,
        );
        return { skipped: true, reason: "recipient-not-allowed", to };
      }

      const html = this.compileMjml(mjmlTemplate);

      switch (this.provider) {
        case "sendgrid":
          return await sgMail.send({ to, from: this.from, subject, html });

        case "smtp":
          if (!this.nodemailerTransporter) {
            throw new Error("SMTP transporter not initialized");
          }
          return await this.nodemailerTransporter.sendMail({
            from: this.from,
            to,
            subject,
            html,
          });

        case "console":
        default:
          log.info(
            `[mailer:console] would send → to=${to} subject="${subject}" (${html.length} bytes). ` +
              "Configure EMAIL_PROVIDER + credentials to deliver.",
          );
          return { provider: "console", to, subject };
      }
    } catch (error: any) {
      log.error(`Email Delivery Error to ${to}:`, error.message);

      const isProd = process.env.NODE_ENV === "production";
      const message = isProd
        ? "We encountered an issue sending your email. Please try again later."
        : `Email Error (${this.provider}): ${error.message}`;

      throw new AppError(message, 502);
    }
  }
}

export const mailer = MailerService.getInstance();
