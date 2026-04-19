import React from 'react';
import { ThreeDot } from "react-loading-indicators";
import styles from './style.module.css';

export default function PageLoader() {
  return (
    <div className={styles.loader_overlay}>
      <ThreeDot color="var(--app-text)" size="medium" text="" textColor="" />
    </div>
  );
}
