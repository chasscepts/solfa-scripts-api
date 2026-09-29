import 'dotenv/config';
import envVar from 'env-var';

const { from, logger } = envVar;

const nodeEnv = process.env.NODE_ENV?.trim() || 'development';

const { get } = nodeEnv === 'development' ? from(process.env, {}, logger) : from(process.env, {});

let DB_KEY = 'DATABASE_URL';
let PORT_KEY = 'PORT';

if (nodeEnv === 'test') {
  DB_KEY = `TEST_${DB_KEY}`;
  PORT_KEY = `TEST_${PORT_KEY}`;
}

const HOST = get('APP_BASE_URL').required().asString();
const CLIENT_BASE_URL = get('CLIENT_BASE_URL').default('http://localhost:5173').asString();

const env = {
  nodeEnv,
  app: {
    bannerUrl: get('BANNER_IMAGE_URL').asString() || 'https://res.cloudinary.com/chasscepts/image/upload/v1790659347/solfa-scripts/banners/choir-connect_d9wsac.png',
    baseUrl: HOST,
    clientUrl: CLIENT_BASE_URL,
    name: get('APP_NAME').asString() || 'Solfa Scripts',
    port: get(PORT_KEY).asString(),
  },
  cloudinary: {
    cloudName: get('CLOUDINARY_CLOUD_NAME').required().asString(),
    folder: get('CLOUDINARY_UPLOAD_FOLDER').asString() || 'solfa-scripts/dev',
    apiKey: get('CLOUDINARY_API_KEY').required().asString(),
    apiSecret: get('CLOUDINARY_API_SECRET').required().asString(),
    preset: get('CLOUDINARY_UPLOAD_PRESET').asString() || 'solfa-scripts-dev',
  },
  db: {
    url: get(DB_KEY).required().asString(),
    user: get('DATABASE_USER').asString(),
    password: get('DATABASE_PASS').asString(),
  },
  defaultSuperAdmin: {
    email: get('DEFAULT_SUPER_ADMIN_EMAIL').required().asString(),
    password: get('DEFAULT_SUPER_ADMIN_PASSWORD').required().asString(),
    firstname: get('DEFAULT_SUPER_ADMIN_FIRSTNAME').required().asString(),
    lastname: get('DEFAULT_SUPER_ADMIN_LASTNAME').required().asString(),
  },
  emails: {
    email: get('EMAIL_USER').required().asString(),
    password: get('EMAIL_PASSWORD').required().asString(),
    previewEnabled: get('PREVIEW_ENABLED').asBool() ?? false,
    sender: get('EMAIL_SENDER').asString() || 'no-reply@solfa-scripts.com',
    support: get('SUPPORT_EMAIL').asString() || 'support@solfa-scripts.com',
  },
  jwt: {
    accessSecret: get('JWT_ACCESS_SECRET').required().asString(),
    refreshSecret: get('JWT_REFRESH_SECRET').required().asString(),
    accessExpiry: get('JWT_ACCESS_EXPIRY').default('24h').asString(),
    refreshExpiry: get('JWT_REFRESH_EXPIRY').default('30d').asString(),
    secret: get('JWT_SECRET').required().asString(),
    expiresIn: get('JWT_EXPIRES_IN').default('24h').asString(),
  },
};

export default env;
