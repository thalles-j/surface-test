import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <section className={styles.secaoLanding}>
      <div className={styles.conteudo}>
        <p className={styles.texto}>
          𝕺𝖓 𝖙𝖍𝖊 𝖘𝖚𝖗𝖋𝖆𝖈𝖊 𝖘𝖎𝖓𝖈𝖊 𝖇𝖊𝖋𝖔𝖗𝖊
        </p>
        <button
          className={styles.botaoShop}
          onClick={() => navigate("/shop")}
        >
          SHOP
        </button>
      </div>
    </section>
  );
}
