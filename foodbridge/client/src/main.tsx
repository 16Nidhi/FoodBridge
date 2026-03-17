import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Apply persisted theme before loading CSS to avoid a brief flash
try {
  const _theme = localStorage.getItem('theme');
  if (_theme) document.documentElement.setAttribute('data-theme', _theme);
} catch (e) {
  // ignore when running in environments without localStorage
}
import './index.css';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Provider } from 'react-redux';
import store from './store';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </Provider>
  </React.StrictMode>
);