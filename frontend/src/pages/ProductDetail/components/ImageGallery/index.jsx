import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import styles from './style.module.css';
import { resolveImageUrl } from '../../../../utils/resolveImageUrl';

export default function ImageGallery({ fotos, productName }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  // Fotos já vêm ordenadas pelo backend (principal primeiro)
  const sortedFotos = fotos || [];

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
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
