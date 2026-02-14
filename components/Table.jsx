'use client';

import React from 'react';
import styles from './Table.module.css';

export default function Table({
  title,
  columns = [],
  rows = [],
  striped = true,
}) {
  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={styles.th}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={striped && ri % 2 === 1 ? styles.striped : ''}
              >
                {row.map((cell, ci) => (
                  <td key={ci} className={styles.td}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
