import React from 'react';

// Картка товару: фото, назва та ціна приходять через props
function GoodsCard(props) {
  return (
    <article className="goods-card">
      <img src={props.image} alt={props.name} />
      <h4>{props.name}</h4>
      <p className="price">Ціна: {props.price} грн</p>
    </article>
  );
}

export default GoodsCard;
