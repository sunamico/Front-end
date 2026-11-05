import React from 'react';
import Header from './components/Header';
import Content from './components/Content';
import Image from './components/Image';
import GoodsGallery from './components/GoodsGallery';
import photo from './assets/1.jpg';

function App() {
  return (
    <div>
      {/* Завдання 1: лаб. робота №4 на React */}
      <Header name="Савченко Руслана Володимирівна" />
      <Content
        birthInfo="Дата народження: 08.11.2007. Місце народження: смт. Талалаївка, Чернігівська область."
        education="Талалаївський ліцей (середня освіта), НТУУ «КПІ ім. Ігоря Сікорського» (вища освіта)."
        hobbies={['Тренажерний зал', 'Читання', 'Перегляд фільмів', 'Малювання']}
        books={[
          '«451° за Фаренгейтом» Рей Бредбері',
          '«Зомбі на ім\'я Шон» Едгар Райт',
          '«Мандрівний замок» Міязакі Хаяо, Ghibli'
        ]}
        place="Лазещина — моє найулюбленіше село за його неймовірні гірські краєвиди, затишну атмосферу та неповторну природу Карпат."
      />
      <Image
        src={photo}
        alt="Краєвид Лазещини"
        href="https://uk.wikipedia.org/wiki/Лазещина"
        title="Перейти на інформаційну сторінку Лазещини"
      />

      {/* Завдання 2: галерея товарів */}
      <GoodsGallery />
    </div>
  );
}

export default App;
