import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import QuotesApp from './quotes/QuotesApp.jsx';
import './styles/quotes.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QuotesApp />
  </StrictMode>
);
