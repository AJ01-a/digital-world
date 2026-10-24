import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Fonts are bundled and served from the site itself — no third-party font
// requests, so visitors' browsers never talk to anyone but this site.
// Each package declares unicode-range subsets; browsers download only what a
// page actually uses.
import '@fontsource-variable/unbounded';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource/instrument-serif/400-italic.css';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
