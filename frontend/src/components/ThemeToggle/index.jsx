import { FaMoon, FaSun } from "react-icons/fa";
import useTheme from "../../hooks/useTheme";
import styles from "./style.module.css";

export default function ThemeToggle({ className = "", showLabel = true }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`${styles.switch} ${isDark ? styles.dark : ""} ${className}`.trim()}
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      onClick={toggleTheme}
      aria-label="Alternar tema"
      aria-pressed={isDark}
    >
      <span className={styles.track}>
        <span className={styles.thumb}>{isDark ? <FaSun /> : <FaMoon />}</span>
      </span>
      {showLabel && <span className={styles.label}>{isDark ? "Escuro" : "Claro"}</span>}
    </button>
  );
}

