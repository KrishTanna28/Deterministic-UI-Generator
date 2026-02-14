'use client';

import React from 'react';
import styles from './Card.module.css';

export default function Card({
  children,
  title,
  subtitle,
  padding = 'medium',
  bordered = true,
}) {
  const classNames = [
    styles.card,
    styles[padding],
    bordered ? styles.bordered : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      {title && <h3 className={styles.title}>{title}</h3>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
