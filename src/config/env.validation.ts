export interface Env {
  PORT: number;
  HOST: string;
  CORS_ORIGINS: string[];
  ADMIN_TOKEN: string;
}

const MIN_ADMIN_TOKEN_LENGTH = 32;

function readPort(value: unknown, name: string, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be a valid port number, received ${JSON.stringify(value)}`);
  }
  return port;
}

function readString(value: unknown, name: string, fallback?: string): string {
  if (typeof value === 'string' && value.length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`${name} is required`);
}

/** Comma separated list, blank entries are dropped. */
function readList(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function readSecret(value: unknown, name: string, minLength: number): string {
  const secret = readString(value, name);
  if (secret.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters long`);
  }
  return secret;
}

export function validateEnv(config: Record<string, unknown>): Env {
  return {
    PORT: readPort(config.PORT, 'PORT', 3100),
    // The admin API is meant for this machine only, so it binds to loopback by default.
    HOST: readString(config.HOST, 'HOST', '127.0.0.1'),
    CORS_ORIGINS: readList(config.CORS_ORIGINS),
    ADMIN_TOKEN: readSecret(config.ADMIN_TOKEN, 'ADMIN_TOKEN', MIN_ADMIN_TOKEN_LENGTH),
  };
}
