/**
 * Environment variable validation for production deployments
 */

export function validateEnvironment(): void {
  const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const optional = ['GEMINI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  const missingOptional = optional.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missing.join(', ')}`);
    console.warn('   Google OAuth login will not work until these are set.');
  }

  if (missingOptional.length > 0) {
    console.info('ℹ️  GEMINI_API_KEY is not set. AI features will run in simulation mode.');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.APP_URL) {
      console.warn('⚠️  APP_URL not set in production. OAuth callbacks may fail.');
    }

    if (process.env.APP_URL && process.env.APP_URL.includes('localhost')) {
      console.warn('⚠️  APP_URL contains localhost in production. This may cause issues.');
    }
  }
}