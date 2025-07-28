export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}
declare class Logger {
    private logFilePath;
    private logLevel;
    private isDebugMode;
    constructor(logLevel?: LogLevel);
    private findProjectRoot;
    private initializeLogFile;
    private shouldLog;
    private formatLogEntry;
    private writeLog;
    debug(message: string, data?: any): void;
    info(message: string, data?: any): void;
    warn(message: string, data?: any): void;
    error(message: string, data?: any): void;
    getLogFilePath(): string;
    isEnabled(): boolean;
}
export declare const logger: Logger;
export declare const log: {
    debug: (message: string, data?: any) => void;
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    getLogFilePath: () => string;
    isEnabled: () => boolean;
};
export {};
