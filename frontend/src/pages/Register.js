import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { register } from '../services/auth';
import './Auth.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      setError(''); // Clear any errors
      // Show success and redirect to login
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle different error types
      if (err.detail) {
        setError(err.detail);
      } else if (err.username && Array.isArray(err.username)) {
        setError(err.username[0]);
      } else if (err.email && Array.isArray(err.email)) {
        setError(err.email[0]);
      } else if (typeof err === 'string') {
        setError(err);
      } else if (err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Make sure the backend is running.');
      } else {
        setError('Registration failed. Please try again.');
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
      <div className="gradient-orb orb-1"></div>
      <div className="gradient-orb orb-2"></div>
      
      <motion.div
        className="auth-card"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
          <img src="/logo.png" alt="DeadlineMate Logo" style={{ width: '48px', height: '48px' }} />
          <motion.h1 style={{ background: 'linear-gradient(135deg, #7e22ce 0%, #2a5298 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '32px', fontWeight: '700', margin: '0' }}>
            DeadlineMate
          </motion.h1>
        </motion.div>
        <motion.h2 variants={itemVariants} style={{ color: '#7e22ce', marginBottom: '28px', fontSize: '18px', fontWeight: '600' }}>
          Create Your Account
        </motion.h2>

        {error && (
          <motion.div
            className="error-message"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            ✕ {error}
          </motion.div>
        )}

        <motion.form onSubmit={handleSubmit} variants={containerVariants}>
          <motion.div variants={itemVariants} className="form-group">
            <label htmlFor="username">👤 Username</label>
            <input
              id="username"
              type="text"
              placeholder="Choose a unique username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </motion.div>

          <motion.div variants={itemVariants} className="form-group">
            <label htmlFor="email">📧 Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </motion.div>

          <motion.div variants={itemVariants} className="form-group">
            <label htmlFor="password">🔐 Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </motion.div>

          <motion.div variants={itemVariants} className="form-group">
            <label htmlFor="confirmPassword">✓ Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </motion.div>

          <motion.button
            variants={itemVariants}
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              padding: '14px 24px',
              background: 'linear-gradient(135deg, #7e22ce 0%, #2a5298 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 24px rgba(126, 34, 206, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? '⏳ Creating Account...' : '🚀 Register'}
          </motion.button>
        </motion.form>

        <motion.p variants={itemVariants} className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

export default Register;
