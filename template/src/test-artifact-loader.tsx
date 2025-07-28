import React, { useState } from 'react';
import { loadArtifacts, getArtifact } from './lib/artifactLoader';

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * This component is just for testing the artifact loader.
 * It's not meant to be used in production.
 */
const TestArtifactLoader: React.FC = () => {
  // Load all artifacts
  const artifacts = loadArtifacts();
  console.log('All artifacts:', artifacts);
  const [selectedArtifact, setSelectedArtifact] = useState<{
    artifact: ReturnType<typeof getArtifact>['artifact'];
    component: ReturnType<typeof getArtifact>['component'];
  } | null>(null);

  // Error state to catch rendering errors
  const [renderError, setRenderError] = useState<string | null>(null);

  const handleSelectArtifact = (artifactId: string) => {
    try {
      const { artifact, component } = getArtifact(artifactId);
      console.log(`Artifact ${artifactId}:`, artifact);
      setSelectedArtifact({ artifact, component });
      setRenderError(null);
    } catch (error) {
      console.error(`Error loading artifact ${artifactId}:`, error);
      setRenderError(`Failed to load artifact: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Artifact Loader Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">All Artifacts Metadata ({artifacts.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {artifacts.map((artifact) => (
            <div 
              key={artifact.id}
              className="border rounded-md p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleSelectArtifact(artifact.id)}
            >
              <h3 className="font-bold text-lg">{artifact.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{artifact.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {artifact.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-500">
                <div>Type: {artifact.type}</div>
                {artifact.folder && <div>Folder: {artifact.folder}</div>}
                <div>Updated: {new Date(artifact.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {renderError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-bold">Error:</p>
          <p>{renderError}</p>
        </div>
      )}
      
      {selectedArtifact && selectedArtifact.artifact && (
        <div className="mb-8 border-t pt-4">
          <h2 className="text-xl font-semibold mb-4">
            Selected Artifact: {selectedArtifact.artifact.title}
          </h2>
          
          <div className="bg-gray-100 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{selectedArtifact.artifact.title}</h3>
                <p className="text-gray-600">{selectedArtifact.artifact.description}</p>
              </div>
              <button 
                onClick={() => setSelectedArtifact(null)}
                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs"
              >
                Close
              </button>
            </div>
            
            <div className="border p-4 rounded bg-white mt-4">
              {/* Safe rendering with error boundary */}
              {React.createElement(
                'div',
                null,
                React.createElement(
                  React.Suspense,
                  { fallback: <div>Loading component...</div> },
                  React.createElement(ErrorBoundary, {
                    fallback: <div className="text-red-500 p-4">
                      Failed to render this component. It may require additional UI components or dependencies.
                    </div>,
                    children: 
                      // Try to render Button with sample props
                      selectedArtifact.artifact.id === 'Button' && selectedArtifact.component ? 
                        React.createElement(selectedArtifact.component, { 
                          label: "Click Me", 
                          primary: true 
                        }) : 
                        // Other components might need different props
                        selectedArtifact.component ? React.createElement(selectedArtifact.component) : null
                  })
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple error boundary component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    console.error("Error rendering component:", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default TestArtifactLoader; 
