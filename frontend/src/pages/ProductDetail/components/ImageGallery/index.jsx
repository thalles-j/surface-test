import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import styles from './style.module.css';
import { resolveImageUrl, handleImgError } from '../../../../utils/resolveImageUrl';

export default function ImageGallery({ fotos, productName }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  // Ordena as fotos: principal primeiro, depois por id
  const sortedFotos = fotos ? [...fotos].sort((a, b) => {
      if (a.principal && !b.principal) return -1;
      if (!a.principal && b.principal) return 1;
      return (a.id_foto || 0) - (b.id_foto || 0);
  }) : [];

  if (!sortedFotos || sortedFotos.length === 0) {
    return (
      <div className={styles.imageSection}>
        <div className={styles.noImage}>Sem imagem</div>
      </div>
    );
  }

  return (
    <div className={styles.imageSection}>
      {/* Miniaturas - Desktop */}
      {sortedFotos.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          direction="vertical"
          spaceBetween={10}
          slidesPerView={4}
          watchSlidesProgress={true}
          modules={[Thumbs]}
          className={styles.thumbnailsSwiper}
        >
          {sortedFotos.slice(0, 4).map((foto) => (
            <SwiperSlide key={`thumb-${foto.id_foto}`} className={styles.thumbnailSlide}>
              <img 
                src={resolveImageUrl(foto.url)} 
                alt={foto.descricao || productName}
                className={styles.thumbnailImage}
                onError={handleImgError}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Swiper Principal */}
      <Swiper
        spaceBetween={0}
        slidesPerView={1}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        pagination={{
          clickable: true,
          dynamicBullets: false,
        }}
        modules={[Pagination, Thumbs]}
        className={styles.swiperContainer}
      >
        {sortedFotos.map((foto) => (
          <SwiperSlide key={foto.id_foto} className={styles.swiperSlide}>
            <img 
              src={resolveImageUrl(foto.url)} 
              alt={foto.descricao || productName}
              className={styles.swiperImage}
              onError={handleImgError}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
