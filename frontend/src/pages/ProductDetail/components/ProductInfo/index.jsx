import { useState } from 'react';
import styles from './style.module.css';

export default function ProductInfo({ 
  produto, 
  variacoes, 
  selectedSize, 
  setSelectedSize,
  handleAddToCart 
}) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const selectedVariacao = variacoes.find(v => v.tamanho === selectedSize);
  const isSoldOut = selectedSize && selectedVariacao?.estoque === 0;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className={styles.infoSection}>
      <h1 className={styles.productName}>{produto.nome_produto}</h1>
      <p className={styles.productPrice}>R$ {parseFloat(produto.preco).toFixed(2)}</p>

      {/* DROPDOWNS DE INFORMAÇÕES */}
      <div className={styles.accordions}>
        <div className={styles.accordion}>
          <button 
            className={styles.accordionHeader}
            onClick={() => toggleSection('description')}
          >
            <span>Descrição</span>
            <span className={expandedSection === 'description' ? styles.chevronUp : styles.chevronDown}>▼</span>
          </button>
          {expandedSection === 'description' && (
            <div className={styles.accordionContent}>
              <p>{produto.descricao || "Sem descrição disponível"}</p>
            </div>
          )}
        </div>

        <div className={styles.accordion}>
          <button 
            className={styles.accordionHeader}
            onClick={() => toggleSection('care')}
          >
            <span>Instruções de Lavagem</span>
            <span className={expandedSection === 'care' ? styles.chevronUp : styles.chevronDown}>▼</span>
          </button>
          {expandedSection === 'care' && (
            <div className={styles.accordionContent}>
              <ul>
                <li>Lavar à máquina com água fria</li>
                <li>Não usar alvejante</li>
                <li>Secar em temperatura baixa</li>
                <li>Passar em temperatura média</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* SELEÇÃO DE TAMANHO */}
      {variacoes.length > 0 && (
        <div className={styles.sizeSection}>
          <div className={styles.sizeHeader}>
            <span className={styles.sizeLabel}>Tamanho</span>
            <button 
              className={styles.sizeGuideBtn}
              onClick={() => setShowSizeGuide(!showSizeGuide)}
            >
              Tabela de Medidas
            </button>
          </div>
          
          <div className={styles.sizeButtons}>
            {variacoes.map((v) => {
              const outOfStock = v.estoque === 0;
              return (
                <button
                  key={v.sku}
                  className={`${styles.sizeBtn} ${selectedSize === v.tamanho ? styles.selected : ""} ${outOfStock ? styles.disabled : ""}`}
                  onClick={() => !outOfStock && setSelectedSize(v.tamanho)}
                  disabled={outOfStock}
                >
                  {v.tamanho}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TABELA DE MEDIDAS */}
      {showSizeGuide && (
        <div className={styles.sizeGuide}>
          <h3>Tabela de Medidas (cm)</h3>
          <table>
            <thead>
              <tr>
                <th>Tamanho</th>
                <th>Largura</th>
                <th>Comprimento</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>P</td><td>48</td><td>68</td></tr>
              <tr><td>M</td><td>52</td><td>71</td></tr>
              <tr><td>G</td><td>56</td><td>74</td></tr>
              <tr><td>GG</td><td>60</td><td>77</td></tr>
            </tbody>
          </table>
        </div>
      )}

      {/* BOTÕES DE AÇÃO */}
      <div className={styles.actions}>
        <button 
          className={`${styles.buyBtn} ${isSoldOut ? styles.soldOut : ""}`}
          onClick={handleAddToCart}
          disabled={!selectedSize || isSoldOut}
        >
          {!selectedSize ? "SELECIONE UM TAMANHO" : isSoldOut ? "ESGOTADO" : "COMPRAR"}
        </button>
        
        <button className={styles.cartBtn} onClick={handleAddToCart} disabled={!selectedSize || isSoldOut}>
          🛒 ADICIONAR AO CARRINHO
        </button>
      </div>
    </div>
  );
}
