import dotenv from "dotenv";

dotenv.config();

type NodeEnv = "production" | "development" | "test";

type JWT_MODE_ENUM = "keys" | "secret";

interface EnvironmentVariables {
  DATABASE_URL: string;
  PORT: number;
  JWT_MODE: JWT_MODE_ENUM;
  JWT_SECRET: string;
  NODE_ENV: NodeEnv;
  COOKIE_SECRET: string;
  JWT_TOKEN_TIME_SECONDS: number;
  REFRESH_TOKEN_TIME_SECONDS: number;
  IGNORE_CSRF: boolean;
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
  WEB_PANEL_URL: string;
}

const parseEnv = (name: string, defaultValue: string, required: boolean) => {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }
  return value || defaultValue;
};

const env: EnvironmentVariables = {
  DATABASE_URL: parseEnv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/mydb",
    true
  ),
  PORT: parseInt(parseEnv("PORT", "3000", false), 10),
  JWT_MODE: parseEnv("JWT_MODE", "secret", false) as JWT_MODE_ENUM,
  JWT_SECRET: parseEnv("JWT_SECRET", "defaultsecret", true),
  NODE_ENV: parseEnv("NODE_ENV", "production", false) as NodeEnv,
  COOKIE_SECRET: parseEnv("COOKIE_SECRET", "defaultcookiesecret", true),
  JWT_TOKEN_TIME_SECONDS: parseInt(
    parseEnv("JWT_TOKEN_TIME_SECONDS", (15 * 60).toString(), false),
    10
  ),
  REFRESH_TOKEN_TIME_SECONDS: parseInt(
    parseEnv(
      "REFRESH_TOKEN_TIME_SECONDS",
      (30 * 24 * 60 * 60).toString(),
      false
    ),
    10
  ),
  IGNORE_CSRF: parseEnv("IGNORE_CSRF", "false", false) === "true",
  MAILGUN_API_KEY: parseEnv("MAILGUN_API_KEY", "", true),
  MAILGUN_DOMAIN: parseEnv("MAILGUN_DOMAIN", "", true),
  WEB_PANEL_URL: parseEnv("WEB_PANEL_URL", "http://localhost:3000", false),
};

export default env;
