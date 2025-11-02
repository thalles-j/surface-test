import { Link } from 'react-router-dom';

import styles from './style.module.css'; 

function Page404() {
return (
    <section className={styles.errorSection}>
        <div className={styles.mainContent}>
            <h1>Algo deu errado! <span>(404)</span></h1>
            <p>Esse link não existe, volte para a</p>
                <div className={styles.backHomeLink}>
                    <p className={styles.backHomeLinkButton}>
                    <Link to="/">
                        PÁGINA INICIAL </Link>
                    </p>
                </div>        
        </div>
    </section>
    
);
}

export default Page404;