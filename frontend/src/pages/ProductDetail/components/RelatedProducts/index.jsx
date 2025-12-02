import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './style.module.css';

// Card com hover para trocar para a segunda imagem (mesmo comportamento da página Shop)
function RelatedProductCard({ produto, baseUrl, createSlug }) {
  const [isHovered, setIsHovered] = useState(false);

  const fotoPrincipal = produto.fotos?.[0]?.url
    ? `${baseUrl}${produto.fotos[0].url}`
    : null;
  const fotoSecundaria = produto.fotos?.[1]?.url
    ? `${baseUrl}${produto.fotos[1].url}`
    : null;

  const imagemAtual = isHovered && fotoSecundaria ? fotoSecundaria : fotoPrincipal;

  return (
    <div
      className={styles.card}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        to={`/produto/${createSlug(produto.nome_produto)}`}
        onClick={() => window.scrollTo(0, 0)}
      >
        {imagemAtual ? (
          <img
            src={imagemAtual}
            alt={produto.nome_produto}
            className={styles.produtoImage}
            style={{ transition: 'opacity 0.2s ease-in-out' }}
          />
        ) : (
          <div className={styles.produtoPlaceholder}>Sem imagem</div>
        )}

        <div className={styles.produtoInfo}>
          <span className={styles.produtoTag}>
            {produto.id_categoria === 1
              ? 'Exclusivo'
              : produto.id_categoria === 2
              ? 'Times'
              : 'Geral'}
          </span>
          <h3 className={styles.produtoNome}>{produto.nome_produto}</h3>
          <p className={styles.produtoPreco}>
            R$ {parseFloat(produto.preco).toFixed(2)}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function RelatedProducts({ products, baseUrl, createSlug }) {
  if (products.length === 0) return null;

  return (
    <section className={styles.relatedSection}>
      <h2>VOCÊ TAMBÉM PODE GOSTAR</h2>
      <div className={styles.relatedGrid}>
        {products.map((p) => (
          <RelatedProductCard
            key={p.id_produto}
            produto={p}
            baseUrl={baseUrl}
            createSlug={createSlug}
          />
        ))}
      </div>
    </section>
  );
}
