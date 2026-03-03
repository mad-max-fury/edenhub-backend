export class AuthEmailTemplates {
  private static readonly colors = {
    primary: "#342721",
    background: "#EDEFF5",
    text: "#091E42",
    danger: "#DE350B",
    white: "#FFFFFF",
    gray: "#5C6880",
  };

  private static baseLayout(content: string, name: string): string {
    return `
<mjml>
  <mj-head>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
    <mj-style>
      body { font-family: "Inter", sans-serif; }
      .gradient-button { background: ${this.colors.primary}; height: 40px; width: 220px; border-radius: 4px; margin: 0 auto; display: flex; justify-content: center; align-items: center; }
      .link-button { color: #ffffff; width: 100%; height: 100%; text-decoration: none; text-align: center; display: block; line-height: 40px; font-weight: 600; font-size: 14px; }
    </mj-style>
  </mj-head>
  <mj-body background-color="${this.colors.background}">
    <mj-wrapper padding="40px 20px">
      <mj-section background-color="${this.colors.white}" padding="40px" border-radius="8px">
        <mj-column>
          <mj-image width="147px" src="https://designspell.files.wordpress.com/2012/01/sciolino-paris-bw.jpg" href="https://edenhub.com" padding-bottom="30px" />
          
          <mj-text font-family="Inter" font-size="17px" font-weight="600" color="${this.colors.text}" padding-bottom="20px">
            Dear ${name},
          </mj-text>
          
          ${content}
          
          <mj-divider border-width="1px" border-style="solid" border-color="lightgrey" padding-top="30px" />
          <mj-text font-family="Inter" font-size="14px" line-height="20px" color="${this.colors.text}">
            Need help? Contact <span style="color: ${this.colors.primary}; font-weight: 600">support@edenhub.com</span>
          </mj-text>
          <mj-text font-family="Inter" font-size="14px" color="${this.colors.text}" font-weight="500">
            Safe Trip, safe travel
          </mj-text>
        </mj-column>
      </mj-section>
      
      <mj-section padding-top="20px">
        <mj-column>
          <mj-text font-family="Inter" font-size="12px" align="center" color="${this.colors.gray}">
            © 2026 EdenHub Limited. All rights reserved.
          </mj-text>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>`;
  }

  public static welcome(name: string): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">Welcome to EdenHub! Your account is now verified. We're excited to have you on board.</mj-text>
      <mj-raw><div class="gradient-button"><a href="https://edenhub.com/dashboard" class="link-button">Go to Dashboard</a></div></mj-raw>
    `,
      name,
    );
  }

  public static verification(name: string, code: string): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">Please verify your identity using the One-Time Password (OTP) below:</mj-text>
      <mj-text font-family="Inter" font-size="28px" color="${this.colors.primary}" font-weight="700" align="center" padding="20px 0">${code}</mj-text>
      <mj-raw><div class="gradient-button"><a href="https://edenhub.com/verify" class="link-button">Verify Account</a></div></mj-raw>
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
      <mj-raw><div class="gradient-button"><a href="https://edenhub.com/login" class="link-button">Login Now</a></div></mj-raw>
    `,
      name,
    );
  }

  public static passwordChanged(name: string): string {
    return this.baseLayout(
      `
      <mj-text font-family="Inter" font-size="14px" line-height="30px">This is a confirmation that your password was recently changed.</mj-text>
      <mj-raw><div class="gradient-button" style="background:${this.colors.danger}"><a href="https://edenhub.com/security" class="link-button">Secure Account</a></div></mj-raw>
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
}
