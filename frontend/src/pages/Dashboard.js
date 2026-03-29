import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logout } from '../services/auth';
import { getTasks, createTask, updateTask, deleteTask, markTaskComplete, markTaskIncomplete } from '../services/api';
import PhoneCall from '../components/PhoneCall';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

function Dashboard({ setIsAuthenticated }) {
  // Get current time as default reminder
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  // Get minimum datetime (now) for date picker
  const getMinDateTime = () => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };

  // Check if selected date is valid (not in past)
  const isValidDueDate = () => {
    if (!dueDate) return true; // Empty is handled by required
    const selectedDate = new Date(dueDate);
    return selectedDate >= new Date();
  };

  // Categorize tasks into groups
  const getActiveTasks = () => {
    // Active = Tasks due today but the due time hasn't passed yet
    return tasks.filter(task => {
      if (task.completed) return false;
      const dueDate = new Date(task.due_date);
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow
      
      // Task is active if: due today AND due time hasn't passed yet
      return dueDate >= today && dueDate < tomorrow && dueDate > now;
    });
  };

  const getUnfinishedTasks = () => {
    // Unfinished = Tasks where due date/time has already passed and not completed
    return tasks.filter(task => {
      if (task.completed) return false;
      const dueDate = new Date(task.due_date);
      const now = new Date();
      
      // Task is unfinished if the due time has passed
      return dueDate <= now;
    });
  };

  const getFinishedTasks = () => {
    // Finished = Tasks marked as completed regardless of due date
    return tasks.filter(task => task.completed);
  };

  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [hasReminder, setHasReminder] = useState(false); // Toggle reminder on/off
  const [reminderType, setReminderType] = useState('absolute'); // 'absolute' or 'relative'
  const [reminderTime, setReminderTime] = useState(getCurrentTime);
  const [reminderMinutes, setReminderMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [overdueTask, setOverdueTask] = useState(null);
  const [dismissedTasks, setDismissedTasks] = useState(() => {
    const stored = localStorage.getItem('dismissedTasks');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [currentCallTaskId, setCurrentCallTaskId] = useState(null); // Track currently displayed call
  const [previousTaskStates, setPreviousTaskStates] = useState({});
  const [username, setUsername] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingDate, setEditingDate] = useState('');
  const [editingReminder, setEditingReminder] = useState('');
  const newlyCreatedTaskIds = useRef(new Set()); // Track recently created tasks to skip call notifications
  const navigate = useNavigate();

  // Get username from localStorage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Persist dismissed tasks to localStorage
  useEffect(() => {
    localStorage.setItem('dismissedTasks', JSON.stringify(Array.from(dismissedTasks)));
  }, [dismissedTasks]);

  useEffect(() => {
    fetchTasks();
    // Check for overdue tasks every 10 seconds (instead of 30) for better deadline accuracy
    const interval = setInterval(() => {
      fetchTasks();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Automatically update task categorization when due date passes
  useEffect(() => {
    const checkAndUpdateOverdueTasks = () => {
      const now = new Date(); // Get current time with hours/minutes
      let anyTasksBecameOverdue = false;

      tasks.forEach((task) => {
        if (task.completed) return;
        
        const dueDate = new Date(task.due_date);
        
        // Check if task transitioned from active to unfinished
        const wasActive = previousTaskStates[task.id] === 'active';
        const isNowUnfinished = dueDate <= now;
        
        if (wasActive && isNowUnfinished) {
          anyTasksBecameOverdue = true;
        }
      });

      // Update previous states with accurate time comparison
      const newStates = {};
      
      tasks.forEach((task) => {
        if (task.completed) {
          newStates[task.id] = 'finished';
        } else {
          const dueDate = new Date(task.due_date);
          
          if (dueDate <= now) {
            // Due time has passed
            newStates[task.id] = 'unfinished';
          } else {
            // Due time is in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (dueDate >= today && dueDate < tomorrow) {
              newStates[task.id] = 'active';
            } else {
              newStates[task.id] = 'upcoming';
            }
          }
        }
      });
      setPreviousTaskStates(newStates);
    };

    // Run check
    checkAndUpdateOverdueTasks();

    // Check every 30 seconds for date transitions
    const interval = setInterval(checkAndUpdateOverdueTasks, 30000);

    return () => clearInterval(interval);
  }, [tasks, previousTaskStates]);

  // Check for overdue tasks or reminder time reached - continuously check
  useEffect(() => {
    const checkTasks = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const taskToShow = tasks.find((task) => {
        if (task.completed) return false;
        
        // Skip if task has been dismissed - don't retrigger calls
        if (dismissedTasks.has(task.id)) return false;
        
        // Skip if task was just created (within 2 seconds)
        if (newlyCreatedTaskIds.current.has(task.id)) return false;
        
        const dueDate = new Date(task.due_date);
        
        // Only trigger calls for OVERDUE tasks (deadline has passed)
        if (dueDate < now) return true;
        
        // Check if reminder time has been reached today
        if (task.reminder_time) {
          const reminderTimeShort = task.reminder_time.substring(0, 5);
          if (currentTime >= reminderTimeShort) return true;
        }
        
        return false;
      });
      
      setOverdueTask(taskToShow || null);
      if (taskToShow) {
        setCurrentCallTaskId(taskToShow.id);
      }
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
      
      // Check for newly overdue tasks and update display
      const now = new Date();
      
      data.forEach((task) => {
        const dueDate = new Date(task.due_date);
        
        // If task is overdue (due time has passed) and incomplete, ensure it's visible in unfinished
        if (dueDate <= now && !task.completed) {
          // Task should automatically be in unfinished list
          // No backend update needed - just ensure UI reflects this
        }
      });
      
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

    // Validate that due date is not in the past
    if (!isValidDueDate()) {
      setError('Due date and time must be in the future');
      return;
    }

    try {
      const dueDateISO = new Date(dueDate).toISOString();
      
      // Calculate reminder time only if enabled
      let finalReminderTime = null;
      if (hasReminder) {
        finalReminderTime = reminderTime;
        if (reminderType === 'relative') {
          // Calculate time: current time + reminderMinutes
          const now = new Date();
          const reminderDate = new Date(now.getTime() + reminderMinutes * 60000);
          finalReminderTime = `${String(reminderDate.getHours()).padStart(2, '0')}:${String(reminderDate.getMinutes()).padStart(2, '0')}`;
        }
      }
      
      const response = await createTask({
        title: newTask,
        due_date: dueDateISO,
        reminder_time: finalReminderTime,
      });
      // Insert at beginning of list (newest first)
      setTasks([response, ...tasks]);
      
      // Mark this task as newly created so it doesn't trigger call notification
      newlyCreatedTaskIds.current.add(response.id);
      // Remove from newly created set after 2 seconds
      setTimeout(() => {
        newlyCreatedTaskIds.current.delete(response.id);
      }, 2000);
      
      setNewTask('');
      setDueDate('');
      setDescription('');
      setHasReminder(false);
      setReminderType('absolute');
      setReminderTime(getCurrentTime());
      setReminderMinutes(5);
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
        setCurrentCallTaskId(null);
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
      // Add to dismissed tasks and close the popup
      setDismissedTasks(new Set([...dismissedTasks, overdueTask.id]));
      setOverdueTask(null);
      setCurrentCallTaskId(null);
      setSuccess('Call dismissed - task remains in unfinished list');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleCloseCall = async () => {
    // Close the popup and check if it's a deadline call
    if (overdueTask) {
      try {
        const now = new Date();
        const dueDate = new Date(overdueTask.due_date);
        
        // If this was a DEADLINE call (not just a reminder), add to unfinished list
        if (dueDate < now && !overdueTask.completed) {
          // Ensure the task is marked as incomplete (not completed)
          await markTaskIncomplete(overdueTask.id);
          // Add to dismissed so call won't repeat immediately but task stays visible
          setDismissedTasks(new Set([...dismissedTasks, overdueTask.id]));
          fetchTasks();
          setSuccess('Task moved to unfinished list');
          setTimeout(() => setSuccess(''), 3000);
        }
      } catch (err) {
        console.error('Error handling close call:', err);
      } finally {
        setOverdueTask(null);
        setCurrentCallTaskId(null);
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
      if (!editingDate) {
        setError('Please select a due date');
        return;
      }

      const updatedData = {
        due_date: new Date(editingDate).toISOString()
      };
      
      if (editingReminder) {
        updatedData.reminder_time = editingReminder;
      }

      console.log('Updating task:', editingTaskId, updatedData);
      
      const response = await updateTask(editingTaskId, updatedData);
      console.log('Update response:', response);
      
      setEditingTaskId(null);
      setEditingDate('');
      setEditingReminder('');
      
      await fetchTasks();
      
      setSuccess('Task updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update task:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update task';
      setError(errorMsg);
    }
  };

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  // Animation variants
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
    <div className="dashboard">
      {overdueTask && (
        <PhoneCall
          task={overdueTask}
          reminderTime={overdueTask.reminder_time}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          onClose={handleCloseCall}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        tasks={tasks} 
        onLogout={handleLogout}
        username={username}
      />
      
      {/* Main Content */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-content">
            <div className="logo-wrapper">
              <img src="/logo.png" alt="DeadlineMate Logo" className="header-logo" />
              <h1>DeadlineMate</h1>
            </div>
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
                  min={getMinDateTime()}
                  style={{
                    borderColor: dueDate && !isValidDueDate() ? '#d32f2f' : 'inherit'
                  }}
                  required
                />
                <small>Must be today or in the future</small>
                {dueDate && !isValidDueDate() && (
                  <small style={{ color: '#d32f2f', display: 'block', marginTop: '4px' }}>
                    ⚠️ Selected date is in the past
                  </small>
                )}
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
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasReminder}
                    onChange={(e) => setHasReminder(e.target.checked)}
                  />
                  <span>Add Reminder Call</span>
                </label>
                <small>Enable to set a reminder time before the deadline</small>
              </div>

              {hasReminder && (
                <>
                  <div className="form-group">
                    <label>Reminder Type</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="reminderType"
                          value="absolute"
                          checked={reminderType === 'absolute'}
                          onChange={(e) => setReminderType(e.target.value)}
                        />
                        <span>Specific Time</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="reminderType"
                          value="relative"
                          checked={reminderType === 'relative'}
                          onChange={(e) => setReminderType(e.target.value)}
                        />
                        <span>Minutes from Now</span>
                      </label>
                    </div>
                  </div>

                  {reminderType === 'absolute' && (
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
                  )}

                  {reminderType === 'relative' && (
                    <div className="form-group">
                      <label htmlFor="reminderMinutes">Remind me in: {reminderMinutes} minute{reminderMinutes !== 1 ? 's' : ''}</label>
                      <input
                        id="reminderMinutes"
                        type="range"
                        min="1"
                        max="120"
                        value={reminderMinutes}
                        onChange={(e) => setReminderMinutes(parseInt(e.target.value))}
                      />
                      <small>From current time</small>
                    </div>
                  )}
                </>
              )}

              <button type="submit" className="submit-btn">Create Task</button>
            </form>
          </div>
        )}

        <div className="tasks-container">
          <h2>👉 Active Tasks</h2>
          {getActiveTasks().length === 0 ? (
            <p className="no-tasks">No active tasks. All caught up! 🎉</p>
          ) : (
            <motion.ul
              className="task-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {getActiveTasks().map((task) => {
                const isEditing = editingTaskId === task.id;
                return (
                  <motion.li
                    key={task.id}
                    className={`task-item ${task.completed ? 'completed' : ''}`}
                    variants={taskItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                            checked={task.completed}
                            onChange={() => handleToggleTask(task)}
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
        </div>
      </main>
      </div>
    </div>
  );
}

export default Dashboard;
