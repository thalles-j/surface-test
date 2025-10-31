import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from './style.module.css';

export default function Login() {
    
  return (
    <section>
      <main className={styles.loginMain}>
      <div className={styles.loginHeader}>
        <h1 className={styles.loginTitle}>Conecte-se aqui</h1>
      </div>
      <div className={styles.loginBody}>
        <div className={styles.box_login}>
          <h4 className={styles.title_form}>Faça Login</h4>
            <form action="/entrar" className={styles.form}>

              <div className={styles.field}>
                <label htmlFor="login-email">Email</label>
                <input type="email" name="email" id="login-email" placeholder="Digite aqui"/>
              </div>

              <div className={styles.field}>
                <label htmlFor="login-senha">Senha</label>
                <input type="password" name="senha" id="login-senha" placeholder="Digite aqui"/>
              </div>
              <div className={`${styles.field} ${styles.field_forget_password}`}>
                <a href="#" className={styles.forget_password}>Esqueci minha senha</a>
              </div>
              <div className={`${styles.field} ${styles.fieldsubmit}`}>
                <button className={styles.btn_submit} type="submit">Entrar</button>
              </div>
            </form>
          </div>
        <div className={styles.box_register}>

        </div>
      </div>
    </main>
    </section>
    
  );
}