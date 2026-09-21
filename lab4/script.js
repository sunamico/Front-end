// =================================================================
// ЗАВДАННЯ 1: Зміна кольорів елементів при кліці
// =================================================================

// 1. Пошук першого елемента (h2) за допомогою getElementById
const firstElement = document.getElementById('element-1');

// 2. Пошук наступного (другого) елемента (p) за допомогою querySelector
const secondElement = document.querySelector('#element-2');

firstElement.addEventListener('click', function () {
    this.classList.toggle('active-style-1');
});

secondElement.addEventListener('click', function () {
    this.classList.toggle('active-style-2');
});


// =================================================================
// ЗАВДАННЯ 2: Управління зображенням (Додати, Збільшити, Зменшити, Видалити)
// =================================================================

const imageContainer = document.getElementById('image-container');
const btnAdd = document.getElementById('btn-add');
const btnIncrease = document.getElementById('btn-increase');
const btnDecrease = document.getElementById('btn-decrease');
const btnDelete = document.getElementById('btn-delete');

// Константи для параметрів зображення
const STEP = 50; 
const INITIAL_WIDTH = 300;
const MIN_WIDTH = 100;
const MAX_WIDTH = 800;

function getTargetImage() {
    return document.getElementById('target-image');
}

// 1. Кнопка "Додати"
btnAdd.addEventListener('click', function () {
    let img = getTargetImage();
    
    // Якщо зображення видалено — створюємо його заново
    if (!img) {
        const link = document.createElement('a');
        link.id = 'image-link';
        link.href = 'https://uk.wikipedia.org/wiki/Лазещина';
        link.target = '_blank';
        link.title = 'Перейти на інформаційну сторінку Лазещини';

        img = document.createElement('img');
        img.id = 'target-image';
        img.src = '1.jpeg';
        img.alt = 'Краєвид Лазещини';
        img.style.width = INITIAL_WIDTH + 'px';
        img.style.height = 'auto';

        link.appendChild(img);
        imageContainer.appendChild(link);
    }
});

// 2. Кнопка "Збільшити"
btnIncrease.addEventListener('click', function () {
    const img = getTargetImage();
    if (img) {
        let currentWidth = parseInt(img.style.width) || img.clientWidth;
        if (currentWidth + STEP <= MAX_WIDTH) {
            img.style.width = (currentWidth + STEP) + 'px';
        }
    }
});

// 3. Кнопка "Зменшити"
btnDecrease.addEventListener('click', function () {
    const img = getTargetImage();
    if (img) {
        let currentWidth = parseInt(img.style.width) || img.clientWidth;
        if (currentWidth - STEP >= MIN_WIDTH) {
            img.style.width = (currentWidth - STEP) + 'px';
        }
    }
});

// 4. Кнопка "Видалити"
btnDelete.addEventListener('click', function () {
    const img = getTargetImage();
    if (img) {
        const link = document.getElementById('image-link');
        if (link) {
            link.remove();
        } else {
            img.remove();
        }
    }
});