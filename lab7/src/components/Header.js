import React, { useState } from 'react';

// Function-компонент. Перший елемент сторінки: (100 mod 10) + 1 = 1.
// При кліку перемикається колір фону та тексту.
function Header(props) {
  const [active, setActive] = useState(false);

  return (
    <header>
      <h2
        className={'clickable' + (active ? ' active-style-1' : '')}
        onClick={() => setActive(!active)}
      >
        {props.name}
      </h2>
    </header>
  );
}

export default Header;
