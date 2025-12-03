import React, { useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VoiceToFaceApp from './components/VoiceToFaceApp';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VoiceToFaceApp />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
