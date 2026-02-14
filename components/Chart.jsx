'use client';

import React from 'react';
import styles from './Chart.module.css';

export default function Chart({
  title,
  type = 'bar',
  data = [],
  height = 200,
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={styles.container}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.chart} style={{ height: `${height}px` }}>
        {type === 'bar' && (
          <div className={styles.barChart}>
            {data.map((d, i) => (
              <div key={i} className={styles.barGroup}>
                <div
                  className={styles.bar}
                  style={{ height: `${(d.value / maxValue) * 100}%` }}
                >
                  <span className={styles.barValue}>{d.value}</span>
                </div>
                <span className={styles.barLabel}>{d.label}</span>
              </div>
            ))}
          </div>
        )}
        {type === 'line' && (
          <div className={styles.lineChart}>
            <svg width="100%" height="100%" viewBox={`0 0 ${data.length * 60} ${height}`} preserveAspectRatio="none">
              <polyline
                className={styles.line}
                points={data
                  .map(
                    (d, i) =>
                      `${i * 60 + 30},${height - (d.value / maxValue) * (height - 40) - 20}`
                  )
                  .join(' ')}
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
              />
              {data.map((d, i) => (
                <circle
                  key={i}
                  cx={i * 60 + 30}
                  cy={height - (d.value / maxValue) * (height - 40) - 20}
                  r="4"
                  fill="#6b7280"
                />
              ))}
            </svg>
            <div className={styles.lineLabels}>
              {data.map((d, i) => (
                <span key={i} className={styles.barLabel}>
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
