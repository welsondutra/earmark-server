import { validateEnv } from './env.validation.js';

const TOKEN = 'a'.repeat(32);
const BASE = { ADMIN_TOKEN: TOKEN, DATABASE_PASSWORD: 'secret' };

describe('validateEnv', () => {
  it('applies defaults and binds to loopback', () => {
    const env = validateEnv(BASE);
    expect(env.PORT).toBe(3100);
    expect(env.HOST).toBe('127.0.0.1');
  });

  it('requires the admin token', () => {
    expect(() => validateEnv({ DATABASE_PASSWORD: 'secret' })).toThrow('ADMIN_TOKEN is required');
  });

  it('requires the database password', () => {
    expect(() => validateEnv({ ADMIN_TOKEN: TOKEN })).toThrow('DATABASE_PASSWORD is required');
  });

  it('defaults the database connection to localhost', () => {
    const env = validateEnv(BASE);
    expect(env.DATABASE_HOST).toBe('localhost');
    expect(env.DATABASE_PORT).toBe(5432);
    expect(env.DATABASE_USER).toBe('earmark');
    expect(env.DATABASE_NAME).toBe('earmark');
  });

  it('rejects an invalid database port', () => {
    expect(() => validateEnv({ ...BASE, DATABASE_PORT: '0' })).toThrow('DATABASE_PORT');
  });

  it('rejects a short admin token', () => {
    expect(() => validateEnv({ ...BASE, ADMIN_TOKEN: 'short' })).toThrow('at least 32 characters');
  });

  it('rejects invalid ports', () => {
    expect(() => validateEnv({ ...BASE, PORT: 'abc' })).toThrow('PORT must be a valid port');
    expect(() => validateEnv({ ...BASE, PORT: '70000' })).toThrow('PORT');
  });

  it('keeps CORS closed unless origins are configured', () => {
    expect(validateEnv(BASE).CORS_ORIGINS).toEqual([]);
    expect(validateEnv({ ...BASE, CORS_ORIGINS: '' }).CORS_ORIGINS).toEqual([]);
  });

  it('parses a comma separated list of origins', () => {
    const env = validateEnv({ ...BASE, CORS_ORIGINS: 'http://localhost:3001, https://admin.example.com,,' });
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3001', 'https://admin.example.com']);
  });
});
