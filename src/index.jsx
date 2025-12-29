import { createRoot } from 'react-dom/client';
import App from './app';
import context from './context';

import './index.css';

async function renderer() {
  await context.init();
  createRoot(document.getElementById('root')).render(
    <App />
  );
}

if (import.meta.env.DEV) {
  const localSettings = window.__HTML_PAGE_DEV_CONFIG__;
  console.log('Loaded local settings:', localSettings);
  context.config = localSettings;
  renderer();
} else {
  renderer();
}
