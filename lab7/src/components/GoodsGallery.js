import React from 'react';
import GoodsCard from './GoodsCard';
import photo1 from '../assets/1.jpg';
import photo2 from '../assets/2.jpg';
import photo3 from '../assets/3.jpg';
import photo4 from '../assets/4.jpg';

// Товари: фотопринти та сувеніри з краєвидами Лазещини
const goods = [
  { id: 1, image: photo1, name: 'Принт «Вечірні хмари», A3', price: 450 },
  { id: 2, image: photo2, name: 'Принт «Літня долина», A3', price: 450 },
  { id: 3, image: photo3, name: 'Принт «Хатина серед пагорбів», A3', price: 480 },
  { id: 4, image: photo4, name: 'Принт «Старі ясени», A3', price: 480 },
  { id: 5, image: photo1, name: 'Набір листівок «Карпати», 6 шт.', price: 120 },
  { id: 6, image: photo3, name: 'Настінний календар «Лазещина 2027»', price: 220 }
];

function GoodsGallery() {
  return (
    <section>
      <h2 className="goods-title">Галерея товарів</h2>
      <div className="goods-gallery">
        {goods.map(item => (
          <GoodsCard key={item.id} image={item.image} name={item.name} price={item.price} />
        ))}
      </div>
    </section>
  );
}

export default GoodsGallery;
