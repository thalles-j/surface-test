import { Link } from 'react-router-dom';

import styles from './style.module.css'; 

function Page404() {
return (
    <section className={styles.errorSection}>
        <div className={styles.mainContent}>
            <h1>Algo deu errado! <span>(404)</span></h1>
            <p>Esse link não existe, volte para a</p>
            <div className={styles.backHomeLink}>
                <Link to="/" className={styles.backHomeLinkButton}>
                    PÁGINA INICIAL
                </Link>
            </div>        
        </div>
    </section>
    
);
}

export default Page404;