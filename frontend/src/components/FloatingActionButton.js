import React from 'react';
import { motion } from 'framer-motion';
import './FloatingActionButton.css';

function FloatingActionButton({ onClick, isOpen }) {
  return (
    <motion.button
      className="fab"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        animate={{ rotate: isOpen ? 45 : 0 }}
        transition={{ duration: 0.3 }}
      >
        ➕
      </motion.div>
    </motion.button>
  );
}

export default FloatingActionButton;
