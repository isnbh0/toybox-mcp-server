/**
 * Artifact interface representing a portfolio item
 */
export interface Artifact {
  id: string;
  title: string;
  description?: string;
  type: 'react' | 'svg' | 'mermaid';
  tags: string[];
  folder?: string;
  code: string; // This will be empty for statically imported artifacts
  createdAt: string;
  updatedAt: string;
} 
