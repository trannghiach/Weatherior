const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Environment variable ${key} not found`);
    }
    return value;
};

export const NODE_ENV = getEnv('NODE_ENV');

export const PORT = getEnv('PORT', '1205');
export const WEB_URL = getEnv('WEB_URL');
export const JWT_SECRET = getEnv('JWT_SECRET');
export const JWT_REFRESH_SECRET = getEnv('JWT_REFRESH_SECRET');
export const MONGO_URI = getEnv('MONGO_URI');
export const POSTGRES_URI = getEnv('POSTGRES_URI');

