import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Calendar.css';
import { api } from '../services/api';

function Calendar({ tasks: propTasks }) {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1); // Always start at day 1 of the month
  });
  const [selectedDate, setSelectedDate] = useState(null);
  const [tasks, setTasks] = useState(propTasks || []);
  const [loading, setLoading] = useState(!propTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch tasks from API if not provided as props
  useEffect(() => {
    if (!propTasks) {
      const fetchTasks = async () => {
        try {
          const response = await api.get('/deadline/tasks/');
          setTasks(response.data);
        } catch (error) {
          console.error('Error fetching tasks:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchTasks();
    }
  }, [propTasks]);

  // Get all tasks for a specific date
  const getTasksForDate = (date) => {
    return tasks.filter((task) => {
      if (task.completed) return false;
      const taskDate = new Date(task.due_date);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const year = prev.getFullYear();
      const month = prev.getMonth();
      let newYear = year;
      let newMonth = month - 1;
      
      if (newMonth < 0) {
        newMonth = 11;
        newYear = year - 1;
      }
      
      return new Date(newYear, newMonth, 1);
    });
    setSelectedDate(null);
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(prev => {
      const year = prev.getFullYear();
      const month = prev.getMonth();
      let newYear = year;
      let newMonth = month + 1;
      
      if (newMonth > 11) {
        newMonth = 0;
        newYear = year + 1;
      }
      
      return new Date(newYear, newMonth, 1);
    });
    setSelectedDate(null);
  }, []);

  // Memoized month calculations
  const { daysInMonth, firstDay, monthName, monthData } = useMemo(() => {
    try {
      if (!currentMonth || isNaN(currentMonth.getTime())) {
        console.error('Invalid currentMonth date object:', currentMonth);
        return {
          daysInMonth: 0,
          firstDay: 0,
          monthName: '',
          monthData: { valid: false }
        };
      }

      // Get days in month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      // Validate month is in valid range (0-11)
      if (month < 0 || month > 11 || !Number.isInteger(month)) {
        console.error('Invalid month value:', month);
        return {
          daysInMonth: 0,
          firstDay: 0,
          monthName: '',
          monthData: { valid: false }
        };
      }
      
      const days = new Date(year, month + 1, 0).getDate();
      
      // Get first day of month (0 = Sunday, 6 = Saturday)
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      
      // Format month name
      const name = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      console.log('Month calculation valid:', { year, month, days, firstDayOfMonth, name });
      
      return {
        daysInMonth: days,
        firstDay: firstDayOfMonth,
        monthName: name,
        monthData: { valid: true, year, month }
      };
    } catch (error) {
      console.error('Error calculating month data:', error, 'currentMonth:', currentMonth);
      return {
        daysInMonth: 0,
        firstDay: 0,
        monthName: '',
        monthData: { valid: false }
      };
    }
  }, [currentMonth]);

  // Memoized calendar days array
  const calendarDays = useMemo(() => {
    try {
      if (!Number.isInteger(daysInMonth) || !Number.isInteger(firstDay)) {
        console.error('Invalid days/firstDay values:', { daysInMonth, firstDay });
        return [];
      }
      
      if (daysInMonth <= 0 || daysInMonth > 31) {
        console.error('Days in month out of valid range:', daysInMonth);
        return [];
      }
      
      if (firstDay < 0 || firstDay > 6) {
        console.error('First day out of valid range:', firstDay);
        return [];
      }
      
      const days = [];
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      console.log('Calendar days generated:', { totalCells: days.length, emptyDays: firstDay, activeDays: daysInMonth });
      return days;
    } catch (error) {
      console.error('Error generating calendar days:', error);
      return [];
    }
  }, [daysInMonth, firstDay]);

  // Get tasks for selected date
  // Get tasks for selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return getTasksForDate(selectedDate);
  }, [selectedDate, tasks]);

  // Memoized due dates in month
  const dueDates = useMemo(() => {
    const dates = new Set();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    tasks.forEach((task) => {
      if (!task.completed) {
        const taskDate = new Date(task.due_date);
        if (taskDate >= monthStart && taskDate <= monthEnd) {
          dates.add(taskDate.getDate());
        }
      }
    });

    return dates;
  }, [currentMonth, tasks]);

  return (
    <div className="calendar-page">
      {/* Header */}
      <header className="calendar-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
        <h1>📅 Calendar</h1>
        <div></div>
      </header>

      {loading ? (
        <div className="loading-message">Loading calendar...</div>
      ) : (
        <main className="calendar-main">
          <div className="calendar-container">
          <div className="calendar-box">
            <div className="calendar-nav">
              <div className="calendar-nav-btns">
                <button type="button" className="calendar-nav-btn" onClick={handlePrevMonth}>
                  ◀
                </button>
                <button type="button" className="calendar-nav-btn" onClick={handleNextMonth}>
                  ▶
                </button>
              </div>
              <h2 className="calendar-title">
                {monthName && monthName.length > 0 
                  ? monthName 
                  : monthData?.valid 
                  ? `${currentMonth.toLocaleString('default', { month: 'long' })} ${currentMonth.getFullYear()}`
                  : 'Invalid Month'}
              </h2>
            </div>

            {/* Day names */}
            <div className="calendar-weekdays">
              <div>Sunday</div>
              <div>Monday</div>
              <div>Tuesday</div>
              <div>Wednesday</div>
              <div>Thursday</div>
              <div>Friday</div>
              <div>Saturday</div>
            </div>

            {/* Calendar grid */}
            <div className="calendar-grid">
              {calendarDays && Array.isArray(calendarDays) && calendarDays.length > 0 ? (
                calendarDays.map((day, index) => {
                  const isSelected = selectedDate && day === selectedDate.getDate();
                  const hasTasks = day && dueDates.has(day);
                  const isToday = day && new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();

                  return (
                    <div
                      key={`${currentMonth.getFullYear()}-${currentMonth.getMonth()}-${day || 'empty-' + index}`}
                      className={`calendar-cell ${day ? 'active' : 'empty'} ${isSelected ? 'selected' : ''} ${hasTasks ? 'has-tasks' : ''} ${isToday ? 'today' : ''}`}
                      onClick={() => {
                        if (day) {
                          setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                          setIsModalOpen(true);
                        }
                      }}
                    >
                      {day && (
                        <>
                          <span className="day-number">{day}</span>
                          {hasTasks && <span className="task-indicator">●</span>}
                        </>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#ff8a8a', fontSize: '14px' }}>
                  <div>Error rendering calendar</div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    daysInMonth: {daysInMonth}, firstDay: {firstDay}
                  </div>
                  <button 
                    onClick={() => window.location.reload()} 
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      background: '#7e22ce',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Refresh Page
                  </button>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot today-dot"></span> Today
              </div>
              <div className="legend-item">
                <span className="legend-dot task-dot"></span> Has Tasks
              </div>
              <div className="legend-item">
                <span className="legend-dot selected-dot"></span> Selected
              </div>
            </div>
          </div>
          </div>

          {/* Tasks Modal Popup */}
          {isModalOpen && selectedDate && (
            <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
              <div className="task-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Tasks for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                  <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
                </div>
                <div className="modal-content">
                  <div className="tasks-list">
                    {selectedDateTasks.length > 0 ? (
                      selectedDateTasks.map((task) => (
                        <div key={task.id} className="task-card">
                          <div className="task-card-header">
                            <h4 className="task-card-title">{task.title}</h4>
                            <span className="task-time">
                              🕒 {new Date(task.due_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {task.reminder_time && (
                            <div className="task-reminder-info">
                              🔔 Reminder: {task.reminder_time}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-tasks-message">
                        <div className="empty-icon">📭</div>
                        <p>No tasks scheduled for this date</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

export default Calendar;
