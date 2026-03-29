import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import { getTasks, createTask, updateTask, deleteTask, markTaskComplete, markTaskIncomplete } from '../services/api';
import './Dashboard.css';

function Dashboard({ setIsAuthenticated }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim() || !dueDate) {
      setError('Please enter task title and due date');
      return;
    }

    try {
      // Convert datetime-local format to ISO format with seconds
      const dueDateISO = new Date(dueDate).toISOString();
      
      const response = await createTask({
        title: newTask,
        due_date: dueDateISO,
      });
      setTasks([...tasks, response]);
      setNewTask('');
      setDueDate('');
      setError('');
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.detail || err.message || 'Failed to create task. Check console for details.');
    }
  };

  const handleToggleTask = async (task) => {
    try {
      if (task.completed) {
        await markTaskIncomplete(task.id);
      } else {
        await markTaskComplete(task.id);
      }
      fetchTasks();
    } catch (err) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>DeadlineMate</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <main className="dashboard-content">
        <div className="task-form-container">
          <h2>Add New Task</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleAddTask} className="task-form">
            <input
              type="text"
              placeholder="Task title"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            <button type="submit">Add Task</button>
          </form>
        </div>

        <div className="tasks-container">
          <h2>Your Tasks</h2>
          {tasks.length === 0 ? (
            <p className="no-tasks">No tasks yet. Create one to get started!</p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task)}
                  />
                  <div className="task-info">
                    <span className="task-title">{task.title}</span>
                    <span className="task-due-date">
                      Due: {new Date(task.due_date).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
