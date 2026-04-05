import React from 'react';
import { ThreeDot } from "react-loading-indicators";
import styles from './style.module.css';

export default function PageLoader() {
  return (
    <div className={styles.loader_overlay}>
      <ThreeDot color="#000000" size="medium" text="" textColor="" />
    </div>
  );
}