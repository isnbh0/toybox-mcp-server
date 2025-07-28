/**
 * Copy template files from local directory to destination
 */
export declare function copyLocalTemplate(templatePath: string, destinationPath: string, replacements?: Record<string, string>): Promise<void>;
/**
 * Get the default template path
 */
export declare function getDefaultTemplatePath(): string;
/**
 * Validate that a template directory has required files
 */
export declare function validateTemplate(templatePath: string): Promise<boolean>;
