import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

import { ArtifactGallery } from './components/ArtifactGallery';
import { ArtifactRunner } from './components/ArtifactRunner';
import { ErrorPage } from './components/ErrorPage';


// Create router with our routes
const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <ArtifactGallery />,
      errorElement: <ErrorPage />,
    },
    {
      path: '/a/:artifactName',
      element: <ArtifactRunner />,
      errorElement: <ErrorPage />,
    },
    {
      path: '/standalone/:artifactName',
      element: <ArtifactRunner standalone={true} />,
      errorElement: <ErrorPage />,
    },
    {
      // Catch-all redirect for any other routes
      path: '*',
      element: <ErrorPage />,
    },
  ],
  {
    // Use the correct base URL for GitHub Pages deployment
    basename: import.meta.env.BASE_URL,
  }
);

// Add a 404.html page for GitHub Pages to handle direct URL access
// GitHub Pages uses this pattern to handle direct navigation to routes
if (import.meta.env.PROD) {
  const script = document.createElement('script');
  script.innerHTML = `
    // Single Page Apps for GitHub Pages
    // This script checks to see if a redirect is needed
    // If the user went directly to a page other than the homepage
    (function(l) {
      if (l.search[1] === '/') {
        var decoded = l.search.slice(1).split('&').map(function(s) { 
          return s.replace(/~and~/g, '&')
        }).join('?');
        window.history.replaceState(null, null,
          l.pathname.slice(0, -1) + decoded + l.hash
        );
      }
    }(window.location))
  `;
  document.head.appendChild(script);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
