import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Jobs from './pages/Jobs';
import Applicants from './pages/Applicants';
import Projects from './pages/Projects';
import Activities from './pages/Activities';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/applicants" element={<Applicants />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/newsroom" element={<Activities />} />
          {/* Legacy route for backward compatibility */}
          <Route path="/activities" element={<Activities />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
