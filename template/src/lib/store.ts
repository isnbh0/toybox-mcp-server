// Simplified state management for TOYBOX template
// No editing features - just basic types and utilities

export interface Artifact {
  id: string;
  title: string;
  description?: string;
  type: 'react' | 'svg' | 'mermaid';
  tags: string[];
  folder?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToyboxConfig {
  title: string;
  description?: string;
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'list';
  customDomain?: string;
  showFooter: boolean;
}