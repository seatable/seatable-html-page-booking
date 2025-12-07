import { createRoot } from 'react-dom/client';
import App from './app';
import { AppProvider } from './hooks/app';
import context from './context';

import './index.css';

async function renderer() {
  await context.init();
  createRoot(document.getElementById('root')).render(
    <AppProvider>
      <App />
    </AppProvider>
  );
}

if (import.meta.env.DEV) {
  import('./setting.local').then((module) => {
    const localSettings = Object.values(module)[0];
    console.log('Loaded local settings:', localSettings);
    context.config = localSettings;
    renderer();
  });
} else {
  renderer();
}
