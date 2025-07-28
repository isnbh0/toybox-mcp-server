import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// Import renderers
import { SVGRenderer } from './renderers/SVGRenderer';
import { MermaidRenderer } from './renderers/MermaidRenderer';
// Import the new artifact loader utility
import { getArtifact } from '../lib/artifactLoader';
import { Artifact } from '../lib/types';

interface ArtifactRunnerProps {
  standalone?: boolean;
}

export function ArtifactRunner({ standalone = false }: ArtifactRunnerProps) {
  const { artifactName } = useParams<{ artifactName: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renderedComponent, setRenderedComponent] = useState<React.ReactNode>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [artifactData, setArtifactData] = useState<Artifact | null>(null);

  useEffect(() => {
    const loadArtifact = async () => {
      if (!artifactName) {
        setError('No artifact name provided');
        setLoading(false);
        return;
      }

      try {
        // Load artifact using the static loader
        const { artifact, component } = getArtifact(artifactName);
        
        if (!artifact) {
          setError('Artifact not found');
          setLoading(false);
          return;
        }

        setArtifactData(artifact);
        
        // Render based on artifact type
        try {
          if (artifact.type === 'svg') {
            // For SVG artifacts
            setRenderedComponent(<SVGRenderer code={artifact.code} />);
          } else if (artifact.type === 'mermaid') {
            // For Mermaid artifacts
            setRenderedComponent(<MermaidRenderer code={artifact.code} />);
          } else {
            // For React artifacts - use the pre-loaded component
            if (component) {
              // If we have a component from the artifact import, use it
              const ArtifactComponent = component;
              setRenderedComponent(<ArtifactComponent />);
            } else {
              setRenderError('Failed to load component');
            }
          }
        } catch (err: unknown) {
          console.error('Error rendering artifact:', err);
          setRenderError(err instanceof Error ? err.message : 'Failed to render artifact');
        }
      } catch (err) {
        console.error('Error loading artifact:', err);
        setError('Failed to load artifact');
      } finally {
        setLoading(false);
      }
    };

    loadArtifact();
  }, [artifactName]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading artifact...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <Link
          to="/"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Return to Gallery
        </Link>
      </div>
    );
  }

  // For standalone mode, just render the component directly without the gallery wrapper
  if (standalone) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        {renderError ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4 font-semibold text-lg">Failed to render component</div>
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded font-mono text-sm overflow-auto">
              {renderError}
            </div>
          </div>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            {renderedComponent}
          </div>
        )}
      </div>
    );
  }

  // For gallery view (default), render with the full gallery wrapper
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-1">{artifactData?.title || 'Untitled Artifact'}</h1>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-0.5 rounded ${
              artifactData?.type === 'react' 
                ? 'bg-blue-100 text-blue-800' 
                : artifactData?.type === 'svg' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-purple-100 text-purple-800'
            }`}>
              {artifactData?.type === 'react' && 'React'}
              {artifactData?.type === 'svg' && 'SVG'}
              {artifactData?.type === 'mermaid' && 'Mermaid'}
            </span>
            
            {artifactData?.folder && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                📁 {artifactData.folder}
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/"
            className="border border-gray-300 hover:bg-gray-100 px-3 py-1 rounded text-sm inline-flex items-center"
          >
            <span className="mr-1">←</span> Back to Gallery
          </Link>
          {/* Add link to standalone view */}
          <Link
            to={`/standalone/${artifactName}`}
            className="border border-gray-300 hover:bg-gray-100 px-3 py-1 rounded text-sm inline-flex items-center"
            title="View this artifact standalone without gallery wrapper"
          >
            Standalone View
          </Link>
        </div>
      </div>
      
      {artifactData?.description && (
        <div className="bg-gray-50 border rounded p-4 mb-4">
          <p>{artifactData.description}</p>
        </div>
      )}
      
      {artifactData?.tags && artifactData.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {artifactData.tags.map((tag: string) => (
            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
        {renderError ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4 font-semibold text-lg">Failed to render component</div>
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded font-mono text-sm overflow-auto">
              {renderError}
            </div>
          </div>
        ) : (
          <div className="artifact-container">
            {renderedComponent}
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center">
        <Link
          to="/"
          className="text-blue-500 hover:text-blue-700"
        >
          ← Return to Portfolio Gallery
        </Link>
      </div>
    </div>
  );
}
