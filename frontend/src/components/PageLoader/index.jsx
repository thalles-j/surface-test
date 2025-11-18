import React from 'react';
import styles from './style.module.css';

export default function PageLoader() {
  return (
    <div className={styles.loader_overlay}>
      <div className={styles.loader_content}>
        <p className={styles.loader_text}>Carregando...</p>
        <div className={styles.dots_container}>
          <span className={styles.dot}>.</span>
          <span className={styles.dot}>.</span>
          <span className={styles.dot}>.</span>
        </div>
      </div>
    </div>
  );
}