import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Home from './pages/Home';
import Medals from './pages/Medals';
import Events from './pages/Events';
import MedalEvent from './pages/MedalEvent';
import Schedule from './pages/Schedule';
import Live from './pages/Live';
import {
  AdminLayout,
  AdminDashboard,
  AdminOlympics,
  AdminSettings,
  AdminCountries,
  AdminSports,
  AdminEvents,
  AdminRounds,
  AdminMatches,
  AdminMedals,
} from './pages/admin';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/medals" element={<Medals />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<MedalEvent />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/live" element={<Live />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="olympics" element={<AdminOlympics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="countries" element={<AdminCountries />} />
            <Route path="sports" element={<AdminSports />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="rounds" element={<AdminRounds />} />
            <Route path="matches" element={<AdminMatches />} />
            <Route path="medals" element={<AdminMedals />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default App;
