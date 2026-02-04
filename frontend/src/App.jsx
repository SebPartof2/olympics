import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Home from './pages/Home';
import Medals from './pages/Medals';
import Schedule from './pages/Schedule';
import Live from './pages/Live';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/medals" element={<Medals />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/live" element={<Live />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
