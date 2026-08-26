import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { QueryProvider } from './lib/query-client';
import { ErrorBoundary } from './components/feedback/ErrorBoundary';
import './index.css';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <App />
      </QueryProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
