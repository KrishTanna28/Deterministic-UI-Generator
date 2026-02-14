'use client';

import React from 'react';
import styles from './Sidebar.module.css';

export default function Sidebar({
  children,
  title,
  items = [],
  activeItem,
  onItemClick,
  collapsed = false,
}) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {title && <div className={styles.title}>{title}</div>}
      {items.length > 0 && (
        <nav className={styles.nav}>
          {items.map((item, i) => (
            <button
              key={i}
              className={`${styles.navItem} ${
                activeItem === item ? styles.active : ''
              }`}
              onClick={() => onItemClick && onItemClick(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      )}
      {children && <div className={styles.content}>{children}</div>}
    </aside>
  );
}
