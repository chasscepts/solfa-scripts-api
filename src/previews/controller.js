import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';

import config from '../config/index.js';

const {
  app: { bannerUrl, clientUrl, name: appName },
  emails: { previewEnabled, support },
} = config;
const dirname = process.cwd();

const templatesDirectory = path.resolve(dirname, 'src', 'views', 'emails', 'templates');
const listTemplatePath = path.resolve(dirname, 'src', 'views', 'emails', 'previewList.hbs');
const notFoundTemplatePath = path.resolve(dirname, 'src', 'views', 'emails', 'notFound.html');

const token = '482991jiidknutencjuuksvvgskujchrekmcgjowksnd'; // Example token for preview purposes

const getTemplateNames = () => fs.readdirSync(templatesDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && path.extname(entry.name) === '.hbs')
  .map((entry) => path.basename(entry.name, '.hbs'))
  .sort((left, right) => left.localeCompare(right));

const getPreviewContext = (template) => ({
  template,
  appName,
  year: new Date().getFullYear(),
  appHome: clientUrl,
  supportEmail: support,
  name: 'Chass',
  email: 'chass@example.com',
  expiresIn: '24 hours',
  verificationPage: `${clientUrl}/verify-email`,
  verificationUrl: `${clientUrl}/verify-email?token=${encodeURIComponent(token)}`,
  resetUrl: `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`,
  posterUrl: bannerUrl,
  securityNote: false,
  message: 'This is a preview of the email template with representative content.',
  token,
  subject: template === 'verify-email' ? 'Verify your email for Solfa Scripts' : template === 'reset-password' ? 'Reset your password for Solfa Scripts' : 'Solfa Scripts Correspondence',
});

const renderTemplatePreview = (template) => {
  const templatePath = path.join(templatesDirectory, `${template}.hbs`);

  if (!fs.existsSync(templatePath)) {
    return null;
  }

  const source = fs.readFileSync(templatePath, 'utf8');
  const compile = handlebars.compile(source);

  return compile(getPreviewContext(template));
};

const renderListPage = (res) => {
  const source = fs.readFileSync(listTemplatePath, 'utf8');
  const compile = handlebars.compile(source);
  const templates = getTemplateNames();
  const html = compile({
    totalTemplates: templates.length,
    templates: templates.map((templateName) => ({
      name: templateName,
      href: `?template=${encodeURIComponent(templateName)}`,
      title: templateName.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()),
    })),
  });

  res.send(html);
};

export function previewEmail(req, res) {
  if (!previewEnabled) {
    res.status(404).send(fs.readFileSync(notFoundTemplatePath, 'utf8'));

    return;
  }

  const { template } = req.query;

  if (!template) {
    renderListPage(res);

    return;
  }

  const html = renderTemplatePreview(template);

  if (!html) {
    res.status(404).send(fs.readFileSync(notFoundTemplatePath, 'utf8'));
    return;
  }

  res.send(html);
}
