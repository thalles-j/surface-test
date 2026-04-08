import { useState } from "react";
import styles from "./style.module.css";

export default function ProductInfo({
  produto,
  variacoes,
  selectedSize,
  setSelectedSize,
  handleAddToCart,
  isSelectedSizeSoldOut,
  onRestockRequest,
  onGuestRestockSubmit,
  restockLoading,
  hasRequestedRestock,
  signed,
  showGuestEmailInput,
  guestEmail,
  setGuestEmail,
}) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className={styles.infoSection}>
      <h1 className={styles.productName}>{produto.nome_produto}</h1>
      <p className={styles.productPrice}>R$ {parseFloat(produto.preco).toFixed(2)}</p>

      <div className={styles.accordions}>
        <div className={styles.accordion}>
          <button className={styles.accordionHeader} onClick={() => toggleSection("description")}>
            <span>Descricao</span>
            <span className={expandedSection === "description" ? styles.chevronUp : styles.chevronDown}>
              v
            </span>
          </button>
          {expandedSection === "description" && (
            <div className={styles.accordionContent}>
              <p>{produto.descricao || "Sem descricao disponivel"}</p>
            </div>
          )}
        </div>

        <div className={styles.accordion}>
          <button className={styles.accordionHeader} onClick={() => toggleSection("care")}>
            <span>Instrucoes de Lavagem</span>
            <span className={expandedSection === "care" ? styles.chevronUp : styles.chevronDown}>
              v
            </span>
          </button>
          {expandedSection === "care" && (
            <div className={styles.accordionContent}>
              <ul>
                <li>Lavar a maquina com agua fria</li>
                <li>Nao usar alvejante</li>
                <li>Secar em temperatura baixa</li>
                <li>Passar em temperatura media</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {variacoes.length > 0 && (
        <div className={styles.sizeSection}>
          <div className={styles.sizeHeader}>
            <span className={styles.sizeLabel}>Tamanho</span>
            <button className={styles.sizeGuideBtn} onClick={() => setShowSizeGuide(!showSizeGuide)}>
              Tabela de Medidas
            </button>
          </div>

          <div className={styles.sizeButtons}>
            {variacoes.map((v) => {
              const outOfStock = Number(v.estoque || 0) <= 0;
              return (
                <button
                  key={v.sku || v.tamanho}
                  className={`${styles.sizeBtn} ${selectedSize === v.tamanho ? styles.selected : ""} ${
                    outOfStock ? styles.soldOutOption : ""
                  }`}
                  onClick={() => setSelectedSize(v.tamanho)}
                >
                  {v.tamanho}
                </button>
              );
            })}
          </div>
        </div>
      )}

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

      <div className={styles.actions}>
        {isSelectedSizeSoldOut ? (
          <>
            <button
              className={`${styles.buyBtn} ${styles.notifyBtn}`}
              onClick={onRestockRequest}
              disabled={restockLoading || hasRequestedRestock}
            >
              {restockLoading
                ? "ENVIANDO..."
                : hasRequestedRestock
                ? "AVISO REGISTRADO"
                : "AVISE-ME"}
            </button>

            {!signed && showGuestEmailInput && !hasRequestedRestock && (
              <div className={styles.restockEmailBox}>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Digite seu email"
                  className={styles.restockEmailInput}
                />
                <button
                  className={styles.restockEmailSubmit}
                  onClick={onGuestRestockSubmit}
                  disabled={restockLoading}
                >
                  Confirmar
                </button>
              </div>
            )}

            <p className={styles.restockHint}>
              Avisaremos quando este tamanho voltar ao estoque.
            </p>
          </>
        ) : (
          <>
            <button
              className={styles.buyBtn}
              onClick={handleAddToCart}
              disabled={!selectedSize}
            >
              {!selectedSize ? "SELECIONE UM TAMANHO" : "COMPRAR"}
            </button>

            <button className={styles.cartBtn} onClick={handleAddToCart} disabled={!selectedSize}>
              ADICIONAR AO CARRINHO
            </button>
          </>
        )}
      </div>
    </div>
  );
}


