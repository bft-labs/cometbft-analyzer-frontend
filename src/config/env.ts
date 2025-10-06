/**
 * Environment configuration
 * Centralizes all environment variables with validation and type safety
 */

interface Config {
  apiBaseUrl: string;
  defaultUserId: string;
  isDevelopment: boolean;
  isProduction: boolean;
  nodeEnv: string;
}

// Removed unused getEnvVar function

function createConfig(): Config {
  // Use direct process.env access for better Next.js compatibility
  const nodeEnv = process.env.NODE_ENV || 'development';
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/v1';
  const defaultUserId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || '68ada24ac653f3d9c62b9a1e';

  // Validate API base URL format (only if not empty)
  if (apiBaseUrl) {
    try {
      new URL(apiBaseUrl);
    } catch {
      console.warn(`Invalid NEXT_PUBLIC_API_BASE_URL: ${apiBaseUrl}, using default`);
    }
  }

  // Validate user ID is not empty
  if (!defaultUserId.trim()) {
    console.warn('NEXT_PUBLIC_DEFAULT_USER_ID is empty, using default');
  }

  const config: Config = {
    apiBaseUrl,
    defaultUserId,
    nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
  };

  // Log configuration in development (client-side safe)
  if (typeof window !== 'undefined' && config.isDevelopment) {
    console.log('🔧 Environment Configuration:', {
      nodeEnv: config.nodeEnv,
      apiBaseUrl: config.apiBaseUrl,
      defaultUserId: config.defaultUserId.substring(0, 8) + '...',
    });
  }

  return config;
}

// Create and export config
export const config = createConfig();

// Convenience exports
export const API_BASE_URL = config.apiBaseUrl;
export const DEFAULT_USER_ID = config.defaultUserId;
export const IS_DEVELOPMENT = config.isDevelopment;
export const IS_PRODUCTION = config.isProduction;