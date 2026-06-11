const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true }); // Create logs directory if it doesn't exist
}

// Create logger
const logger = winston.createLogger({
  level: 'info', // Only logs 'info' and above (warn, error) - ignores debug noise
  format: winston.format.combine(
    // Know exactly when upload happened
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // Human-readable logs in console, not messy JSON
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    // Console logs
    new winston.transports.Console({
      format: winston.format.combine( // Colorize console output for better visibility
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File logs
    new winston.transports.File({ 
      filename: path.join(logDir, 'app.log'),
      maxsize: 5 * 1024 * 1024, // 5MB Prevent disk full, auto-rotates
      maxFiles: 3 // Keep last 3 logs, old ones get deleted
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'errors.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB Prevent disk full, auto-rotates
      maxFiles: 2 // Keep last 2 error logs, old ones get deleted
    })
  ]
});

module.exports = logger;