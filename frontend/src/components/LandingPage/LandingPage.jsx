import React from "react";
import styles from "../LandingPage/LandingPage.module.css";

export default function LandingPage() {
  return (
    <section className={styles.landingSection}>
      <div className={styles.content}>
        <p className={styles.text}>
          𝕺𝖓 𝖙𝖍𝖊 𝖘𝖚𝖗𝖋𝖆𝖈𝖊 𝖘𝖎𝖓𝖈𝖊 𝖇𝖊𝖋𝖔𝖗𝖊
        </p>
        <button className={styles.btn_shop}>SHOP</button>
      </div>
    </section>
  );
}
