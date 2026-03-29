import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTasks, markTaskIncomplete, deleteTask } from '../services/api';
import Sidebar from '../components/Sidebar';
import './TasksPage.css';

function FinishedTasks({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      // Filter finished tasks (completed)
      const finished = data.filter(task => task.completed);
      setTasks(finished);
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await markTaskIncomplete(task.id);
      fetchTasks();
      setSuccess('Task marked as incomplete!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        setTasks(tasks.filter(task => task.id !== id));
        setSuccess('Task deleted!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  };

  const taskItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="tasks-page">
      <Sidebar 
        tasks={tasks}
        onLogout={handleLogout}
        username={username}
      />

      <div className="tasks-main">
        <header className="tasks-header">
          <div className="header-content">
            <h1>✅ Finished Tasks</h1>
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              ← Back to Dashboard
            </button>
          </div>
        </header>

        <main className="tasks-content">
          {error && <div className="error-message">✕ {error}</div>}
          {success && <div className="success-message">✓ {success}</div>}

          <div className="tasks-info">
            <p className="task-count">Total Finished: <span>{tasks.length}</span></p>
          </div>

          {tasks.length === 0 ? (
            <p className="no-tasks">No finished tasks yet. Keep working! 💪</p>
          ) : (
            <motion.ul
              className="task-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {tasks.map((task) => (
                <motion.li
                  key={task.id}
                  className="task-item completed"
                  variants={taskItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => handleToggleTask(task)}
                      title="Mark as incomplete"
                    />
                  </div>
                  <div className="task-content">
                    <h3 className="task-title">{task.title}</h3>
                    <span className="task-due-date">
                      📅 {new Date(task.due_date).toLocaleString()}
                    </span>
                  </div>
                  <motion.button
                    onClick={() => handleDeleteTask(task.id)}
                    className="delete-btn"
                    title="Delete task"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    🗑️
                  </motion.button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </main>
      </div>
    </div>
  );
}

export default FinishedTasks;
