import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaBullhorn, FaBriefcase, FaUsers, FaProjectDiagram, FaBars, FaTimes, FaNewspaper } from 'react-icons/fa';
import logo from '../assets/logo3.png';
import './Sidebar.css';

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (window.innerWidth <= 991.98) {
      setExpanded(false);
    }
  };

  return (
    <div className={`sidebar ${expanded ? 'expanded' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={logo} alt="RBC Logo" className="sidebar-logo" />
          <h3>Admin</h3>
        </div>
        <button className="toggle-button" onClick={toggleSidebar}>
          {expanded ? <FaTimes /> : <FaBars />}
        </button>
      </div>
      <div className="nav-menu">
        <NavLink 
          to="/dashboard" 
          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
          onClick={handleLinkClick}
        >
          <FaTachometerAlt className="nav-icon" />
          <span className="nav-text">Dashboard</span>
        </NavLink>
        <NavLink 
          to="/announcements" 
          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
          onClick={handleLinkClick}
        >
          <FaBullhorn className="nav-icon" />
          <span className="nav-text">Announcements</span>
        </NavLink>
        <NavLink 
          to="/jobs" 
          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
          onClick={handleLinkClick}
        >
          <FaBriefcase className="nav-icon" />
          <span className="nav-text">Jobs</span>
        </NavLink>
        <NavLink 
          to="/applicants" 
          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
          onClick={handleLinkClick}
        >
          <FaUsers className="nav-icon" />
          <span className="nav-text">Applicants</span>
        </NavLink>
        <NavLink 
          to="/projects" 
          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
          onClick={handleLinkClick}
        >
          <FaProjectDiagram className="nav-icon" />
          <span className="nav-text">Projects</span>
        </NavLink>
        <NavLink 
          to="/activities" 
          className={({isActive}) => isActive ? 'nav-item active' : 'nav-item'}
          onClick={handleLinkClick}
        >
          <FaNewspaper className="nav-icon" />
          <span className="nav-text">Press Activities</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar; 