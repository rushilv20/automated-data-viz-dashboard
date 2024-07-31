import React from 'react';
import { createRoot } from 'react-dom/client';
import ChartComponent from './components/chartComponent';
import './styles/App.css';
import './styles/index.css';

function App() {
    return (
        <div className="App">
            <ChartComponent />
        </div>
    );
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
