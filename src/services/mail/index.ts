import 'dotenv/config';
import nodemailer, { Transporter } from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import sgMail from '@sendgrid/mail';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

const smtpConfig: SMTPTransport.Options = {
  host: process.env.SMTP_SERVER_ADDRESS || '',
  port: Number(process.env.SMTP_SERVER_PORT) || 25,
  auth: {
    user: process.env.SMTP_SERVER_USERNAME || '',
    pass: process.env.SMTP_SERVER_PASSWORD || '',
  },
};

const createTransporter = (): Transporter | typeof sgMail => {
  if (process.env.NODE_ENV === 'production') {
    return sgMail;
  } else {
    const transporter = nodemailer.createTransport(smtpConfig);

    transporter.use(
      'compile',
      hbs({
        viewEngine: {
          extname: '.hbs',
          partialsDir: path.resolve('./src/templates/'),
          layoutsDir: path.resolve('./src/templates/layouts/'),
          defaultLayout: '',
        },
        viewPath: path.resolve('./src/templates/'),
        extName: '.hbs',
      }),
    );

    return transporter;
  }
};

interface MailContext {
  [key: string]: any;
}

const sendMail = async (
  to: string,
  subject: string,
  template: string,
  context: MailContext,
): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions: any = {
    from: {
      email:
        process.env.EMAIL_FROM ||
        'EdenHub <no-reply@greenlight.nwobodoe712gmail.com>',
      name: process.env.APP_NAME,
    },
    to,
    subject,
    template,
    context,
  };

  if (process.env.NODE_ENV === 'production') {
    const msg = {
      to,
      from: process.env.EMAIL_FROM as string,
      subject,
      text: context.text,
      html: context.html,
    };

    try {
      await sgMail.send(msg);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  } else {
    try {
      await (transporter as Transporter).sendMail(mailOptions);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
};

export { sendMail };
