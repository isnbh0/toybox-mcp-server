import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logFilePath: string;
  private logLevel: LogLevel;
  private isDebugMode: boolean;

  constructor(logLevel?: LogLevel) {
    // Only enable file logging in debug mode
    this.isDebugMode = process.env.TOYBOX_DEBUG === 'true' || process.env.TOYBOX_LOG_LEVEL === 'debug';
    
    // Set log level based on debug mode and environment
    this.logLevel = logLevel || (this.isDebugMode ? 'debug' : 'info');
    
    if (this.isDebugMode) {
      // Create log filename with format: yymmdd_HHMMSS.log
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      
      const filename = `${year}${month}${day}_${hours}${minutes}${seconds}.log`;
      
      // Find the project root (where package.json is located)
      const projectRoot = this.findProjectRoot();
      this.logFilePath = join(projectRoot, '.local', 'logs', filename);
      
      // Ensure log directory exists
      const logDir = dirname(this.logFilePath);
      if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }
      
      // Initialize log file with session header
      this.initializeLogFile();
    } else {
      this.logFilePath = '';
    }
  }

  private findProjectRoot(): string {
    try {
      // Try to find the project root by looking at the script location
      // This file is in src/utils/, so go up to find the project root
      const currentFile = fileURLToPath(import.meta.url);
      let currentDir = dirname(dirname(dirname(currentFile))); // Go up from src/utils/logger.ts
      
      // If we're in toybox-mcp-server subdirectory, go up one more level
      if (currentDir.endsWith('toybox-mcp-server')) {
        currentDir = dirname(currentDir);
      }
      
      return currentDir;
    } catch (error) {
      // Fallback to working directory or home
      let currentDir = process.cwd();
      
      // If we're in toybox-mcp-server subdirectory, go up one level
      if (currentDir.endsWith('toybox-mcp-server')) {
        currentDir = dirname(currentDir);
      }
      
      // Final fallback - use home directory
      if (!currentDir || currentDir === '/' || currentDir === '.') {
        currentDir = process.env.HOME || '/tmp';
      }
      
      return currentDir;
    }
  }

  private initializeLogFile(): void {
    if (!this.isDebugMode) return;
    
    const header = `=== TOYBOX MCP Server Log Session ===
Started: ${new Date().toISOString()}
Process ID: ${process.pid}
Working Directory: ${process.cwd()}
Log Level: ${this.logLevel}
Debug Mode: ${this.isDebugMode}
=====================================

`;
    writeFileSync(this.logFilePath, header, 'utf8');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.logLevel];
  }

  private formatLogEntry(level: LogLevel, message: string, data?: any): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    let formatted = `[${entry.timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (data !== undefined) {
      try {
        formatted += ` | Data: ${JSON.stringify(data, null, 2)}`;
      } catch (error) {
        formatted += ` | Data: [Unable to serialize: ${error}]`;
      }
    }
    
    return formatted + '\n';
  }

  private writeLog(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const logEntry = this.formatLogEntry(level, message, data);
    
    // Only write to file in debug mode
    if (this.isDebugMode && this.logFilePath) {
      try {
        appendFileSync(this.logFilePath, logEntry, 'utf8');
      } catch (error) {
        // Fallback to console if file writing fails
        console.error('Failed to write to log file:', error);
        console.error('Log entry:', logEntry);
      }
    }
    
    // In debug mode, also output to stderr for real-time monitoring (except debug level)
    if (this.isDebugMode && level !== 'debug') {
      process.stderr.write(`[TOYBOX-MCP] ${logEntry}`);
    }
  }

  debug(message: string, data?: any): void {
    this.writeLog('debug', message, data);
  }

  info(message: string, data?: any): void {
    this.writeLog('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.writeLog('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.writeLog('error', message, data);
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }
  
  isEnabled(): boolean {
    return this.isDebugMode;
  }
}

// Create a singleton logger instance
export const logger = new Logger(process.env.TOYBOX_LOG_LEVEL as LogLevel || 'info');

// Export convenience functions
export const log = {
  debug: (message: string, data?: any) => logger.debug(message, data),
  info: (message: string, data?: any) => logger.info(message, data),
  warn: (message: string, data?: any) => logger.warn(message, data),
  error: (message: string, data?: any) => logger.error(message, data),
  getLogFilePath: () => logger.getLogFilePath(),
  isEnabled: () => logger.isEnabled()
};