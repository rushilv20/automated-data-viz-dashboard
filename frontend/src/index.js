import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Ensure the path is correct
import './styles/index.css';

const root = createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
