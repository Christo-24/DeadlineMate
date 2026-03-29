import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/auth';
import { getTasks, createTask, updateTask, deleteTask, markTaskComplete, markTaskIncomplete } from '../services/api';
import PhoneCall from '../components/PhoneCall';
import './Dashboard.css';

function Dashboard({ setIsAuthenticated }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [overdueTask, setOverdueTask] = useState(null);
  const [dismissedTasks, setDismissedTasks] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
    // Check for overdue tasks every 10 seconds (instead of 30) for better deadline accuracy
    const interval = setInterval(() => {
      fetchTasks();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Check for overdue tasks or reminder time reached - continuously check
  useEffect(() => {
    const checkTasks = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const taskToShow = tasks.find((task) => {
        if (task.completed) return false;
        
        const dueDate = new Date(task.due_date);
        
        // Check if deadline has passed (ALWAYS show, even if dismissed as reminder)
        // Deadline overrides dismissal status
        if (dueDate < now) return true;
        
        // Check if reminder time has been reached today (only show if not dismissed)
        if (!dismissedTasks.has(task.id) && task.reminder_time) {
          // Extract HH:MM from reminder_time (handle both "HH:MM" and "HH:MM:SS" formats)
          const reminderTimeShort = task.reminder_time.substring(0, 5);
          if (currentTime >= reminderTimeShort) return true;
        }
        
        return false;
      });
      
      setOverdueTask(taskToShow || null);
    };

    // Check immediately
    checkTasks();

    // Check every 10 seconds for reminder triggers
    const interval = setInterval(checkTasks, 10000);
    
    return () => clearInterval(interval);
  }, [tasks, dismissedTasks]);

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
      const dueDateISO = new Date(dueDate).toISOString();
      
      const response = await createTask({
        title: newTask,
        due_date: dueDateISO,
        reminder_time: reminderTime,
      });
      setTasks([...tasks, response]);
      setNewTask('');
      setDueDate('');
      setDescription('');
      setReminderTime('09:00');
      setError('');
      setSuccess('Task created successfully!');
      setShowForm(false);
      setTimeout(() => setSuccess(''), 3000);
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
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        setTasks(tasks.filter(task => task.id !== id));
      } catch (err) {
        setError('Failed to delete task');
      }
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleAcceptCall = async () => {
    if (overdueTask) {
      try {
        await markTaskComplete(overdueTask.id);
        setDismissedTasks(new Set([...dismissedTasks, overdueTask.id]));
        setOverdueTask(null);
        fetchTasks();
        setSuccess('Task completed!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to complete task');
      }
    }
  };

  const handleRejectCall = () => {
    if (overdueTask) {
      setDismissedTasks(new Set([...dismissedTasks, overdueTask.id]));
      setOverdueTask(null);
    }
  };

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      {overdueTask && (
        <PhoneCall
          task={overdueTask}
          reminderTime={overdueTask.reminder_time}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>📋 DeadlineMate</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat">
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat">
            <span className="stat-number">{tasks.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>

        {success && <div className="success-message">✓ {success}</div>}
        {error && <div className="error-message">✕ {error}</div>}

        <button 
          className="add-task-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Cancel' : '+ New Task'}
        </button>

        {showForm && (
          <div className="task-form-container">
            <h2>Create New Task</h2>
            <form onSubmit={handleAddTask} className="task-form">
              <div className="form-group">
                <label htmlFor="taskTitle">Task Title *</label>
                <input
                  id="taskTitle"
                  type="text"
                  placeholder="Enter task title"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="taskDue">Due Date *</label>
                <input
                  id="taskDue"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="taskDesc">Description (optional)</label>
                <textarea
                  id="taskDesc"
                  placeholder="Add task description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reminderTime">Reminder Time</label>
                <input
                  id="reminderTime"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  required
                />
                <small>The call will trigger at this time on the deadline date</small>
              </div>

              <button type="submit" className="submit-btn">Create Task</button>
            </form>
          </div>
        )}

        <div className="tasks-container">
          <h2>Your Tasks</h2>
          {tasks.length === 0 ? (
            <p className="no-tasks">No tasks yet. Click "New Task" to get started!</p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task)}
                    />
                  </div>
                  <div className="task-content">
                    <h3 className="task-title">{task.title}</h3>
                    <span className="task-due-date">
                      📅 {new Date(task.due_date).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="delete-btn"
                    title="Delete task"
                  >
                    🗑️
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
