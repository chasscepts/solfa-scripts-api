import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';

import config from '../config/index.js';

const dirname = process.cwd();

const transporter = nodemailer.createTransport({
  port: 465,
  host: 'smtp.gmail.com',
  auth: {
    user: config.emails.email,
    pass: config.emails.password,
  },
  secure: true,
});

const renderHtmlPage = async (template, options = { throws: false }) => {
  let returnData = '';
  try {
    const templatePath = path.resolve(dirname, 'src', 'views', 'emails', 'templates', `${template.name}.hbs`);

    if (!fs.existsSync(templatePath)) {
      if (options?.throws) {
        throw new Error(`Email template "${template.name}" not found.`);
      }

      return '';
    }

    const content = await fs.promises.readFile(templatePath, 'utf8');
    const delegate = handlebars.compile(content, { strict: true });

    returnData = delegate(template.context);
  } catch (err) {
    if (options?.throws) {
      throw err;
    }
  }

  return returnData;
};

const send = (email, plain, html, subject = 'Solfa Scripts Correspondence') => transporter.sendMail({
  to: email,
  from: config.emails.sender,
  subject,
  text: plain || '',
  html,
});

/**
 * Send Email
 * @param {string} email email of recipient (required)
 * @param {Object} data data for email and template context
 * @param {string} data.template template name to use for the email.
 * If not specified, a generic template will be used
 * @param {string} data.message if no template is specified, message is required
 * @param {string} data.subject subject of email
 * @param {string} data.name name of recipient
 * @param {string} plainText plain text version of email (optional)
 */
const sendEmail = async (email, data, plainText, options = { throws: false }) => {
  let { template } = data;

  if (!template) {
    if (!data.message) {
      if (options?.throws) {
        throw new Error('Message is required when no template is specified.');
      }

      return;
    }

    template = 'generic';
  }

  if (!data.subject) {
    data.subject = 'Solfa Scripts Correspondence';
  }

  if (!data.name) {
    data.name = '';
  }

  const context = {
    ...data,
    appName: data.appName || config.app.name,
    email,
    supportEmail: data.supportEmail || config.emails.support,
    year: new Date().getFullYear(),
  };

  const content = await renderHtmlPage({ name: template, context }, options);

  if (!content) {
    if (options?.throws) {
      throw new Error('Failed to render email template.');
    }

    return;
  }

  try {
    await send(email, plainText || 'Solfa Scripts Correspondence', content, data.subject);
  } catch (err) {
    if (options?.throws) {
      throw err;
    }
  }
};

const EmailService = {
  send,
  sendEmail,
};

export default EmailService;
