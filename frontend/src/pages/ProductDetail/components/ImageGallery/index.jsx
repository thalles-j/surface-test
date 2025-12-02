import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import styles from './style.module.css';

export default function ImageGallery({ fotos, productName, baseUrl }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  if (!fotos || fotos.length === 0) {
    return (
      <div className={styles.imageSection}>
        <div className={styles.noImage}>Sem imagem</div>
      </div>
    );
  }

  return (
    <div className={styles.imageSection}>
      {/* Miniaturas - Desktop */}
      {fotos.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          direction="vertical"
          spaceBetween={10}
          slidesPerView={4}
          watchSlidesProgress={true}
          modules={[Thumbs]}
          className={styles.thumbnailsSwiper}
        >
          {fotos.slice(0, 4).map((foto) => (
            <SwiperSlide key={`thumb-${foto.id_foto}`} className={styles.thumbnailSlide}>
              <img 
                src={`${baseUrl}${foto.url}`} 
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
        {fotos.map((foto) => (
          <SwiperSlide key={foto.id_foto} className={styles.swiperSlide}>
            <img 
              src={`${baseUrl}${foto.url}`} 
              alt={foto.descricao || productName}
              className={styles.swiperImage}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
