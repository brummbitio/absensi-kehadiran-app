import winston from 'winston';

const { combine, timestamp, json, errors } = winston.format;

// Mask sensitive fields
const sensitiveFields = ['password', 'token', 'access_token', 'refresh_token', 'authorization'];

const maskSensitiveData = winston.format((info) => {
    if (typeof info.message === 'object' && info.message !== null) {
        const sensitiveKeys = Object.keys(info.message).filter(key => sensitiveFields.includes(key.toLowerCase()));
        sensitiveKeys.forEach(key => {
            (info.message as any)[key] = '***MASKED***';
        });
    }
    return info;
});

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        errors({ stack: true }), // Log stack trace
        timestamp(),
        maskSensitiveData(),
        json() // Structured JSON logs
    ),
    transports: [
        new winston.transports.Console()
    ],
});

export default logger;
