import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { login } from '../services/auth';
import './Auth.css';

function Login({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    
    setLoading(true);

    try {
      await login(username, password);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.detail) {
        setError(err.detail);
      } else if (typeof err === 'string') {
        setError(err);
      } else if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Make sure the backend is running.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div className="auth-header" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div className="logo-icon" variants={itemVariants}>
            <img src="/logo.png" alt="DeadlineMate Logo" style={{ width: '60px', height: '60px' }} />
          </motion.div>
          <motion.h1 className="auth-title" variants={itemVariants}>
            DeadlineMate
          </motion.h1>
          <motion.p className="auth-subtitle" variants={itemVariants}>
            Never miss your deadlines
          </motion.p>
        </motion.div>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            ⚠️ {error}
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          className="auth-form"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
            />
          </motion.div>

          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </motion.div>

          <motion.button
            type="submit"
            disabled={loading}
            className="submit-button"
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >
                  ⏳
                </motion.span>
                {' '}Logging in...
              </>
            ) : (
              '🔓 Login'
            )}
          </motion.button>
        </motion.form>

        <motion.div className="auth-footer" variants={itemVariants} initial="hidden" animate="visible">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one now
            </Link>
          </p>
        </motion.div>
      </motion.div>

      {/* Decorative elements */}
      <motion.div className="gradient-orb orb-1" animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity }} />
      <motion.div className="gradient-orb orb-2" animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity }} />
    </div>
  );
}

export default Login;
