'use client';

import React from 'react';
import styles from './Input.module.css';

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
  error,
  fullWidth = false,
}) {
  const wrapperClass = [styles.wrapper, fullWidth ? styles.fullWidth : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
