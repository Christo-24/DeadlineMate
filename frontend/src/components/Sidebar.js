import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Sidebar.css';

function Sidebar({ tasks, onLogout, username }) {
  const navigate = useNavigate();

  // Categorize tasks
  const getPendingTasks = () => {
    return tasks.filter(task => !task.completed);
  };

  const getFinishedTasks = () => {
    return tasks.filter(task => task.completed);
  };

  const pendingTasks = getPendingTasks();
  const finishedTasks = getFinishedTasks();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="sidebar">
      {/* Welcome Section */}
      <div className="sidebar-welcome">
        <h2 className="welcome-title">Welcome, <span className="welcome-username">{username || 'User'}</span></h2>
      </div>

      {/* Unsubmitted Tasks Section */}
      <motion.div className="sidebar-section" variants={containerVariants} initial="hidden" animate="visible">
        <button 
          className="section-header collapsible-button" 
          onClick={() => navigate('/unsubmitted')}
          title="View all unsubmitted tasks"
        >
          <span className="section-icon">📋</span>
          Unsubmitted ({pendingTasks.length})
          <span className="external-link">→</span>
        </button>
      </motion.div>

      {/* Finished Tasks Section */}
      <motion.div className="sidebar-section" variants={containerVariants} initial="hidden" animate="visible">
        <button 
          className="section-header collapsible-button" 
          onClick={() => navigate('/finished')}
          title="View all finished tasks"
        >
          <span className="section-icon">✅</span>
          Finished ({finishedTasks.length})
          <span className="external-link">→</span>
        </button>
      </motion.div>

      {/* Quick Links */}
      <div className="sidebar-links">
        <button className="sidebar-link dashboard-link" onClick={() => navigate('/dashboard')}>
          📊 Dashboard
        </button>
        <button className="sidebar-link calendar-link" onClick={() => navigate('/calendar')}>
          📅 Calendar
        </button>
      </div>

      {/* Logout Button */}
      <button className="sidebar-logout-btn" onClick={onLogout}>
        🚪 Logout
      </button>
    </div>
  );
}

export default Sidebar;
