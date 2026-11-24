import { validateEnv } from './env.validation.js';

const TOKEN = 'a'.repeat(32);

describe('validateEnv', () => {
  it('applies defaults and binds to loopback', () => {
    const env = validateEnv({ ADMIN_TOKEN: TOKEN });
    expect(env.PORT).toBe(3100);
    expect(env.HOST).toBe('127.0.0.1');
  });

  it('requires the admin token', () => {
    expect(() => validateEnv({})).toThrow('ADMIN_TOKEN is required');
  });

  it('rejects a short admin token', () => {
    expect(() => validateEnv({ ADMIN_TOKEN: 'short' })).toThrow('at least 32 characters');
  });

  it('rejects invalid ports', () => {
    expect(() => validateEnv({ ADMIN_TOKEN: TOKEN, PORT: 'abc' })).toThrow('PORT must be a valid port');
    expect(() => validateEnv({ ADMIN_TOKEN: TOKEN, PORT: '70000' })).toThrow('PORT');
  });

  it('keeps CORS closed unless origins are configured', () => {
    expect(validateEnv({ ADMIN_TOKEN: TOKEN }).CORS_ORIGINS).toEqual([]);
    expect(validateEnv({ ADMIN_TOKEN: TOKEN, CORS_ORIGINS: '' }).CORS_ORIGINS).toEqual([]);
  });

  it('parses a comma separated list of origins', () => {
    const env = validateEnv({ ADMIN_TOKEN: TOKEN, CORS_ORIGINS: 'http://localhost:3001, https://admin.example.com,,' });
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3001', 'https://admin.example.com']);
  });
});
