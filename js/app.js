let words = [];
let currentWord = null;
let correctAnswers = 0;
let incorrectAnswers = 0;
let gameMode = null;

// Initialize the game
async function initGame() {
    try {
        const response = await fetch('words.json');
        const data = await response.json();
        words = data.words;
        
        // Get game mode from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        gameMode = urlParams.get('mode');
        
        if (gameMode) {
            showNextQuestion();
            updateStats();
        }
    } catch (error) {
        console.error('Error loading words:', error);
    }
}

// Show next question
function showNextQuestion() {
    // Get random word
    currentWord = words[Math.floor(Math.random() * words.length)];
    
    // Get question and options based on game mode
    let question, options;
    
    switch (gameMode) {
        case 'pl-to-ru':
            question = currentWord.pl;
            options = getRandomOptions(currentWord.ru, 'ru');
            break;
        case 'ru-to-pl':
            question = currentWord.ru;
            options = getRandomOptions(currentWord.pl, 'pl');
            break;
        case 'pl-to-image':
            question = currentWord.pl;
            options = getRandomImageOptions(currentWord.image);
            break;
        default:
            return;
    }
    
    // Update UI
    document.querySelector('.question').textContent = question;
    const optionsContainer = document.querySelector('.options-grid');
    optionsContainer.innerHTML = '';
    
    if (gameMode === 'pl-to-image') {
        options.forEach(option => {
            const img = document.createElement('img');
            img.src = option;
            img.alt = 'Option';
            img.className = 'image-option';
            img.onclick = () => checkAnswer(option);
            optionsContainer.appendChild(img);
        });
    } else {
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'option-button';
            button.onclick = () => checkAnswer(option);
            optionsContainer.appendChild(button);
        });
    }
    
    // Clear hint if exists
    const hint = document.querySelector('.hint');
    if (hint) hint.remove();
}

// Get random options for text-based questions
function getRandomOptions(correctAnswer, language) {
    const options = [correctAnswer];
    const otherWords = words.filter(word => word[language] !== correctAnswer);
    
    while (options.length < 4) {
        const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
        const option = randomWord[language];
        if (!options.includes(option)) {
            options.push(option);
        }
    }
    
    return shuffleArray(options);
}

// Get random options for image-based questions
function getRandomImageOptions(correctImage) {
    const options = [correctImage];
    const otherWords = words.filter(word => word.image !== correctImage);
    
    while (options.length < 4) {
        const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
        const option = randomWord.image;
        if (!options.includes(option)) {
            options.push(option);
        }
    }
    
    return shuffleArray(options);
}

// Check answer
function checkAnswer(selectedAnswer) {
    const correctAnswer = gameMode === 'pl-to-ru' ? currentWord.ru :
                         gameMode === 'ru-to-pl' ? currentWord.pl :
                         currentWord.image;
    
    if (selectedAnswer === correctAnswer) {
        correctAnswers++;
        showNextQuestion();
    } else {
        incorrectAnswers++;
        showHint();
    }
    
    updateStats();
}

// Show hint
function showHint() {
    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = `Правильный ответ: ${gameMode === 'pl-to-ru' ? currentWord.ru :
                                              gameMode === 'ru-to-pl' ? currentWord.pl :
                                              'Попробуйте еще раз'}`;
    document.querySelector('.game-container').appendChild(hint);
}

// Update statistics
function updateStats() {
    document.querySelector('.correct-answers').textContent = correctAnswers;
    document.querySelector('.incorrect-answers').textContent = incorrectAnswers;
}

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame); 