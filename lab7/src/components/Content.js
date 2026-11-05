import React from 'react';

// Class-компонент. Другий елемент (абзац з датою народження)
// змінює колір фону та тексту при кліку.
class Content extends React.Component {
  constructor(props) {
    super(props);
    this.state = { active: false };
    this.toggle = this.toggle.bind(this);
  }

  toggle() {
    this.setState(prev => ({ active: !prev.active }));
  }

  render() {
    const { birthInfo, education, hobbies, books, place } = this.props;

    return (
      <main>
        <p
          className={'clickable' + (this.state.active ? ' active-style-2' : '')}
          onClick={this.toggle}
        >
          {birthInfo}
        </p>
        <p>Освіта: {education}</p>

        <h3>Мої хобі:</h3>
        <ul>
          {hobbies.map(item => <li key={item}>{item}</li>)}
        </ul>

        <h3>Улюблені книги та фільми:</h3>
        <ol>
          {books.map(item => <li key={item}>{item}</li>)}
        </ol>

        <h3>Улюблене місце</h3>
        <p>{place}</p>
      </main>
    );
  }
}

export default Content;
