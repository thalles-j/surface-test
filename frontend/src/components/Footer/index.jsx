import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { faInstagram, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import logoWhite from "../../assets/logotipoWhite.png";
import styles from "./style.module.css";

export default function Footer() {
    return (
        <footer>
            <div className={styles.footer_section}>
                <div className={styles.footer_inner}>
                    {/* Newsletter */}
                    <div className={styles.wrap_newsletter}>
                        <div className={styles.wrap_menu}>
                            <ul className={styles.menu}>
                                <li>
                                    <Link to="/">Atendimento</Link>
                                </li>
                            </ul>
                        </div>
                        <p className={styles.title}>Newsletter</p>
                        <form
                            action="newsletter"
                            method="post"
                            className={styles.form_newsletter}
                        >
                            <div className={styles.field}>
                                <input type="email" placeholder="E-mail" required />
                                <button type="submit" className={styles.btn_form} aria-label="enviar">
                                    <FontAwesomeIcon icon={faArrowRight} width='24' height='24' />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Logo + Social */}
                    <div className={styles.wrapper_logo}>
                        <div className={styles.logo}>
                            <a href="#">
                                <img src={logoWhite} alt="logotipo branca" />
                            </a>
                        </div>
                        <div className={styles.social}>
                            <ul className={styles.menu}>
                                <li>
                                    <a href="https://www.instagram.com/surface__official/" target="_blank" rel="noreferrer">
                                <FontAwesomeIcon icon={faInstagram} /></a>
                                </li>
                                <li>
                                    <a href="https://x.com/surface__gang" target="_blank" rel="noreferrer">
                                <FontAwesomeIcon icon={faXTwitter} /></a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Atendimento */}
                    <div className={styles.wrap_atendimento}>
                        <p>
                            Rua Zé Fulasca,009
                            <br />
                            Volta Redonda - RJ
                            <br />
                            <strong>SURFACE STORE</strong>
                            <br />
                            27208-097
                        </p>
                        <p>
                            Horário de Atendimento
                            <br />
                            Terça - Sábado
                            <br />
                            11h - 20h
                        </p>
                    </div>
                </div>

                {/* Bottom */}
                <div className={styles.footer_bottom}>
                    <div className={styles.wrap_info_loja}>
                        <div className={styles.cnpj}>
                            <p>
                                Surface Company © 2025 - Todos os direitos reservados.
                                <br />
                                CNPJ: 00.000.000/0000-00
                                <br />
                                Volta Redonda - RJ.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
