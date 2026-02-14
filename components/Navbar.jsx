'use client';

import React from 'react';
import styles from './Navbar.module.css';

export default function Navbar({
  title,
  items = [],
  activeItem,
  onItemClick,
  actions,
}) {
  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        {title && <span className={styles.title}>{title}</span>}
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
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
