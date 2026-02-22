import nodemailer, { Transporter } from "nodemailer";
import sgMail from "@sendgrid/mail";
import mjml2html from "mjml";
import { getConfig } from "../config";
import AppError from "../errors/appError";

export class MailerService {
  private static instance: MailerService;
  private nodemailerTransporter?: Transporter;
  private readonly isProd: boolean;
  private readonly from: string;

  private constructor() {
    this.isProd = process.env.NODE_ENV === "production";
    this.from = getConfig("emailFrom");

    if (this.isProd) {
      sgMail.setApiKey(getConfig("sendgridApiKey"));
    } else {
      this.nodemailerTransporter = nodemailer.createTransport({
        host: getConfig("smtpHost"),
        port: getConfig("smtpPort"),
        auth: {
          user: getConfig("smtpUser"),
          pass: getConfig("smtpPass"),
        },
      });
    }
  }

  public static getInstance(): MailerService {
    if (!MailerService.instance) {
      MailerService.instance = new MailerService();
    }
    return MailerService.instance;
  }

  private compileMjml(mjmlString: string): string {
    const { html, errors } = mjml2html(mjmlString, {
      validationLevel: "soft",
    });

    if (errors.length > 0) {
      console.warn(
        "MJML Warnings:",
        errors.map((e) => e.message),
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

  public async send(to: string, subject: string, mjmlTemplate: string) {
    try {
      const html = this.compileMjml(mjmlTemplate);

      if (this.isProd) {
        return await sgMail.send({
          to,
          from: this.from,
          subject,
          html,
        });
      }

      if (!this.nodemailerTransporter) {
        throw new Error("Nodemailer transporter not initialized");
      }

      return await this.nodemailerTransporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
    } catch (error: any) {
      console.error(`Email Delivery Error to ${to}:`, error.message);

      const message = this.isProd
        ? "We encountered an issue sending your email. Please try again later."
        : `SMTP Error: ${error.message}`;

      throw new AppError(message, 502);
    }
  }
}

export const mailer = MailerService.getInstance();
