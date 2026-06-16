import {
  emailButton,
  emailColors,
  renderEmailLayout,
} from "./emailLayout";

export class AuthEmailTemplates {
  private static readonly colors = emailColors;
  private static readonly storefront =
    process.env.STOREFRONT_URL || "https://edenhub.com";

  private static baseLayout(content: string, name: string): string {
    return renderEmailLayout(content, name);
  }

  public static welcome(name: string): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">Welcome to EdenHub! Your account is now ready. We're excited to have you on board.</mj-text>
      ${emailButton("Go to Dashboard", `${this.storefront}/c/account`)}
    `,
      name,
    );
  }

  public static verification(name: string, code: string): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">Please verify your identity using the One-Time Password (OTP) below:</mj-text>
      <mj-text font-family="Inter" font-size="28px" color="${this.colors.primary}" font-weight="700" align="center" padding="20px 0">${code}</mj-text>
      <mj-text font-size="12px" color="${this.colors.gray}" align="center">This code expires in 15 minutes.</mj-text>
    `,
      name,
    );
  }

  // Dedicated two-factor login code (distinct from password reset).
  public static twoFactorCode(name: string, code: string): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">Someone is signing in to your EdenHub account. Enter the verification code below to complete your login:</mj-text>
      <mj-text font-family="Inter" font-size="32px" color="${this.colors.primary}" font-weight="700" align="center" padding="20px 0" letter-spacing="6px">${code}</mj-text>
      <mj-text font-size="12px" color="${this.colors.gray}" align="center">This code expires in 15 minutes. If you didn't try to sign in, please change your password immediately.</mj-text>
    `,
      name,
    );
  }

  public static forgotPassword(name: string, code: string): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">We received a request to reset your password. Use the code below:</mj-text>
      <mj-text font-family="Inter" font-size="28px" color="${this.colors.primary}" font-weight="700" align="center" padding="20px 0">${code}</mj-text>
      <mj-text font-size="12px" color="${this.colors.gray}" align="center">This code expires in 15 minutes.</mj-text>
    `,
      name,
    );
  }

  public static resetPasswordConfirmation(name: string): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">Success! Your password has been successfully reset.</mj-text>
      ${emailButton("Login Now", `${this.storefront}/auth/login`)}
    `,
      name,
    );
  }

  public static passwordChanged(name: string): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">This is a confirmation that your password was recently changed. If this wasn't you, secure your account right away.</mj-text>
      ${emailButton("Secure Account", `${this.storefront}/auth/login`, true)}
    `,
      name,
    );
  }

  public static loginAlert(
    name: string,
    data: { ip: string; device: string; time: string },
  ): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">New login detected from an unrecognized device.</mj-text>
      <mj-text font-size="13px" line-height="20px" padding-top="10px">
        <strong>Time:</strong> ${data.time}<br/>
        <strong>Device:</strong> ${data.device}<br/>
        <strong>IP:</strong> ${data.ip}
      </mj-text>
    `,
      name,
    );
  }

  // Sent when an admin onboards a staff member with login credentials.
  public static staffInvite(
    name: string,
    data: { email: string; password: string; staffId: string; role: string },
  ): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">An EdenHub administrator has created a staff account for you with the role of <strong>${data.role}</strong>. Use the credentials below to sign in, then change your password.</mj-text>
      <mj-text font-size="13px" line-height="22px" padding-top="10px">
        <strong>Staff ID:</strong> ${data.staffId}<br/>
        <strong>Email:</strong> ${data.email}<br/>
        <strong>Temporary password:</strong> ${data.password}
      </mj-text>
      ${emailButton("Sign in to EdenHub", `${this.storefront}/auth/login`)}
    `,
      name,
    );
  }
}
