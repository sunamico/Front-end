import React, { useState } from 'react';

const STEP = 50;
const INITIAL_WIDTH = 300;
const MIN_WIDTH = 100;
const MAX_WIDTH = 800;

// Function-компонент: зображення та 4 кнопки керування.
// Параметри (src, alt, href, title) передаються через props.
function Image(props) {
  const [visible, setVisible] = useState(true);
  const [width, setWidth] = useState(INITIAL_WIDTH);

  const add = () => {
    if (!visible) {
      setWidth(INITIAL_WIDTH);
      setVisible(true);
    }
  };

  const increase = () => {
    if (visible && width + STEP <= MAX_WIDTH) setWidth(width + STEP);
  };

  const decrease = () => {
    if (visible && width - STEP >= MIN_WIDTH) setWidth(width - STEP);
  };

  const remove = () => setVisible(false);

  return (
    <section>
      <div className="gallery-container">
        {visible && (
          <a href={props.href} target="_blank" rel="noreferrer" title={props.title}>
            <img
              id="target-image"
              src={props.src}
              alt={props.alt}
              style={{ width: width + 'px', height: 'auto' }}
            />
          </a>
        )}
      </div>

      <div className="controls-panel">
        <button onClick={add}>Додати</button>
        <button onClick={increase}>Збільшити</button>
        <button onClick={decrease}>Зменшити</button>
        <button onClick={remove}>Видалити</button>
      </div>
    </section>
  );
}

export default Image;
