import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getTasks, markTaskComplete, deleteTask, updateTask } from '../services/api';
import Sidebar from '../components/Sidebar';
import './TasksPage.css';

function UnsubmittedTasks({ setIsAuthenticated }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [username, setUsername] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingDate, setEditingDate] = useState('');
  const [editingReminder, setEditingReminder] = useState('');

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
      // Filter unsubmitted tasks (incomplete)
      const unsubmitted = data.filter(task => !task.completed);
      setTasks(unsubmitted);
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      await markTaskComplete(task.id);
      fetchTasks();
      setSuccess('Task marked as complete!');
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

  const handleEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditingDate(task.due_date.slice(0, 16));
    setEditingReminder(task.reminder_time || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTaskId) return;
    try {
      const updatedData = {};
      if (editingDate) {
        updatedData.due_date = new Date(editingDate).toISOString();
      }
      if (editingReminder) {
        updatedData.reminder_time = editingReminder;
      }
      await updateTask(editingTaskId, updatedData);
      setEditingTaskId(null);
      fetchTasks();
      setSuccess('Task updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message || 'Failed to update task');
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

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
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
            <h1>📋 Unsubmitted Tasks</h1>
            <button onClick={() => navigate('/dashboard')} className="back-btn">
              ← Back to Dashboard
            </button>
          </div>
        </header>

        <main className="tasks-content">
          {error && <div className="error-message">✕ {error}</div>}
          {success && <div className="success-message">✓ {success}</div>}

          <div className="tasks-info">
            <p className="task-count">Total Unsubmitted: <span>{tasks.length}</span></p>
          </div>

          {tasks.length === 0 ? (
            <p className="no-tasks">No unsubmitted tasks yet! 🎉</p>
          ) : (
            <motion.ul
              className="task-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {tasks.map((task) => {
                const isEditing = editingTaskId === task.id;
                return (
                  <motion.li
                    key={task.id}
                    className="task-item"
                    variants={taskItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ scale: 1.02 }}
                  >
                    {isEditing ? (
                      <div className="task-edit-form">
                        <div className="edit-form-group">
                          <label>Due Date & Time:</label>
                          <input
                            type="datetime-local"
                            value={editingDate}
                            onChange={(e) => setEditingDate(e.target.value)}
                          />
                        </div>
                        <div className="edit-form-group">
                          <label>Reminder Time:</label>
                          <input
                            type="time"
                            value={editingReminder}
                            onChange={(e) => setEditingReminder(e.target.value)}
                          />
                        </div>
                        <div className="edit-form-actions">
                          <button onClick={handleSaveEdit} className="save-edit-btn">✓ Save</button>
                          <button onClick={() => setEditingTaskId(null)} className="cancel-edit-btn">✕ Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="task-checkbox">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleTask(task)}
                            title="Mark as complete"
                          />
                        </div>
                        <div className="task-content">
                          <h3 className="task-title">{task.title}</h3>
                          <span className="task-due-date">
                            📅 {new Date(task.due_date).toLocaleString()}
                          </span>
                          {task.reminder_time && (
                            <span className="task-reminder">🔔 {task.reminder_time}</span>
                          )}
                        </div>
                        <motion.button
                          onClick={() => handleEditTask(task)}
                          className="edit-btn"
                          title="Edit task"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          ✏️
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteTask(task.id)}
                          className="delete-btn"
                          title="Delete task"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          🗑️
                        </motion.button>
                      </>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </main>
      </div>
    </div>
  );
}

export default UnsubmittedTasks;
