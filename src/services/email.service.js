import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';

import config from '../config/index.js';

const transporter = nodemailer.createTransport({
  port: 465,
  host: 'smtp.gmail.com',
  auth: {
    user: config.emails.email,
    pass: config.emails.password,
  },
  secure: true,
});

const renderHtmlPage = async (template) => {
  let returnData = '';
  try {
    const templatePath = path.resolve(__dirname, '..', 'views', 'emails', 'templates', `${template.name}.hbs`);

    if (!fs.existsSync(templatePath)) {
      return '';
    }

    const content = await fs.promises.readFile(templatePath, 'utf8');
    const delegate = handlebars.compile(content, { strict: true });

    returnData = delegate(template.context);
  } catch (err) {
    // ignore
  }

  return returnData;
};

const send = (email, plain, html, subject = 'Neighborly Correspondence') => transporter.sendMail({
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
const sendEmail = async (email, data, plainText) => {
  let { template } = data;

  if (!template) {
    if (!data.message) {
      return;
    }

    template = 'generic';
  }

  if (!data.subject) {
    data.subject = 'Neighborly Correspondence';
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

  const content = await renderHtmlPage({ name: template, context });

  if (!content) {
    return;
  }

  try {
    await send(email, plainText || 'Neighborly Correspondence', content, data.subject);
  } catch {
    // ignore
  }
};

const EmailService = {
  send,
  sendEmail,
};

export default EmailService;
