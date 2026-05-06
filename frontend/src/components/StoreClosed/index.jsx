import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import styles from './style.module.css';

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!targetDate) return;

    const calc = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calc();
    intervalRef.current = setInterval(calc, 1000);
    return () => clearInterval(intervalRef.current);
  }, [targetDate]);

  return timeLeft;
}

export default function StoreClosed({ onEarlyAccess }) {
  const [launchInfo, setLaunchInfo] = useState(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error | checking
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/admin/early-access/launch-info').then(res => {
      setLaunchInfo(res.data);
    }).catch(() => {});
  }, []);

  const countdown = useCountdown(launchInfo?.data_abertura);
  const hasCountdown = launchInfo?.data_abertura && new Date(launchInfo.data_abertura) > new Date();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) { setMessage('Digite um email válido'); setStatus('error'); return; }

    setStatus('loading');
    try {
      const res = await api.post('/admin/early-access/subscribe', { email });
      if (res.data?.already) {
        setMessage('Esse email já está na lista!');
      } else {
        setMessage('Inscrição realizada! Você será avisado.');
      }
      setStatus('success');
    } catch {
      setMessage('Erro ao inscrever. Tente novamente.');
      setStatus('error');
    }
  };

  const handleCheckAccess = async () => {
    if (!email || !email.includes('@')) { setMessage('Digite seu email primeiro'); setStatus('error'); return; }

    setStatus('checking');
    try {
      const res = await api.get(`/admin/early-access/check?email=${encodeURIComponent(email)}`);
      if (res.data?.hasAccess) {
        setMessage('Acesso liberado! Redirecionando...');
        setStatus('success');
        if (onEarlyAccess) onEarlyAccess(email);
      } else {
        setMessage('Seu acesso ainda não foi liberado. Aguarde!');
        setStatus('error');
      }
    } catch {
      setMessage('Erro ao verificar. Tente novamente.');
      setStatus('error');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <h1 className={styles.brand}>{launchInfo?.nome_loja || 'SURFACE'}</h1>
        </div>

        <p className={styles.subtitle}>ALGO GRANDE ESTÁ VINDO</p>

        {/* COUNTDOWN */}
        {hasCountdown && (
          <div className={styles.countdown}>
            <div className={styles.timeBlock}>
              <span className={styles.timeValue}>{String(countdown.days).padStart(2, '0')}</span>
              <span className={styles.timeLabel}>DIAS</span>
            </div>
            <span className={styles.timeSeparator}>:</span>
            <div className={styles.timeBlock}>
              <span className={styles.timeValue}>{String(countdown.hours).padStart(2, '0')}</span>
              <span className={styles.timeLabel}>HORAS</span>
            </div>
            <span className={styles.timeSeparator}>:</span>
            <div className={styles.timeBlock}>
              <span className={styles.timeValue}>{String(countdown.minutes).padStart(2, '0')}</span>
              <span className={styles.timeLabel}>MIN</span>
            </div>
            <span className={styles.timeSeparator}>:</span>
            <div className={styles.timeBlock}>
              <span className={styles.timeValue}>{String(countdown.seconds).padStart(2, '0')}</span>
              <span className={styles.timeLabel}>SEG</span>
            </div>
          </div>
        )}

        {/* EMAIL FORM */}
        <div className={styles.emailSection}>
          <p className={styles.emailPrompt}>
            {launchInfo?.early_access_ativo
              ? 'Cadastre seu email para acesso antecipado'
              : 'Seja o primeiro a saber quando abrirmos'}
          </p>
          <form onSubmit={handleSubscribe} className={styles.emailForm}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setStatus('idle'); setMessage(''); }}
              placeholder="seu@email.com"
              className={styles.emailInput}
            />
            <button type="submit" disabled={status === 'loading' || status === 'checking'}
              className={styles.emailBtn}>
              {status === 'loading' ? '...' : 'INSCREVER'}
            </button>
          </form>

          {launchInfo?.early_access_ativo && (
            <button onClick={handleCheckAccess} className={styles.checkBtn}
              disabled={status === 'checking'}>
              {status === 'checking' ? 'Verificando...' : 'Já tenho acesso antecipado →'}
            </button>
          )}

          {message && (
            <p className={`${styles.message} ${status === 'error' ? styles.messageError : styles.messageSuccess}`}>
              {message}
            </p>
          )}
        </div>

        {/* SOCIAL */}
        {launchInfo?.instagram && (
          <a href={`https://instagram.com/${launchInfo.instagram.replace('@', '')}`}
            target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
            @{launchInfo.instagram.replace('@', '')}
          </a>
        )}
      </div>
    </div>
  );
}
