import React from 'react';
import ReactDOM from 'react-dom/client';
import { bootstrap } from './app/bootstrap';
import './index.css';
import './styles/globals.css';

bootstrap().then(({ RootComponent }) => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RootComponent />
    </React.StrictMode>
  );
});
