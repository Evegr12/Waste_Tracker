// src/App.js
import React from 'react';
import './App.css';
import ProgressBar from './ProgressBar';

function App() {
  return (
    <div className="App">
      <header>
        <div className="logo">
          <a href="/inicioRestaurante">
            <img src="logoWT.png" alt="Waste Tracker" />
          </a>
          <h1>Waste Tracker</h1>
        </div>
      </header>

      <div className="history">
      <ProgressBar />
        <h2>Historial de residuos vertidos</h2>
      </div>

      <footer>
        <nav className="footer-nav">
          <a href="/inicioRestaurante">
            <img src="home-icon.png" alt="Inicio" />
          </a>
        </nav>
      </footer>
    </div>
  );
}

export default App;
