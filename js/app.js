let words = [];
let currentWord = null;
let correctAnswers = 0;
let incorrectAnswers = 0;
let gameMode = null;

// Initialize the game
async function initGame() {
    try {
        console.log('Starting to load words...');
        const response = await fetch('./words.json?' + new Date().getTime(), {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data || !Array.isArray(data.words)) {
            throw new Error('Invalid data format: words array not found');
        }
        
        words = data.words;
        console.log('Words loaded successfully. Total words:', words.length);
        console.log('First few words:', words.slice(0, 5));
        
        const urlParams = new URLSearchParams(window.location.search);
        gameMode = urlParams.get('mode');
        
        if (!gameMode) {
            console.error('No game mode specified');
            return;
        }
        
        if (words.length === 0) {
            console.error('No words available');
            return;
        }
        
        showNextQuestion();
        updateStats();
    } catch (error) {
        console.error('Error loading words:', error);
        document.querySelector('.game-container').innerHTML = `
            <div class="error-message">
                Error loading the game. Please try refreshing the page.
            </div>
        `;
    }
}

// Show next question
function showNextQuestion() {
    if (!Array.isArray(words) || words.length === 0) {
        console.error('No words available for questions');
        return;
    }

    if (!gameMode) {
        console.error('No game mode specified');
        return;
    }

    // Filter words based on game mode
    let availableWords = words;
    if (gameMode.includes('-new')) {
        availableWords = words.filter(word => word.isNew);
        if (availableWords.length === 0) {
            document.querySelector('.game-container').innerHTML = `
                <div class="message">
                    No new words available. Add some new words to practice!
                    <br><br>
                    <a href="index.html" class="back-button">Back to menu</a>
                </div>
            `;
            return;
        }
    }

    currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    let question, options;
    
    switch (gameMode) {
        case 'pl-to-ru':
        case 'pl-to-ru-new':
            question = currentWord.pl;
            options = getRandomOptions(currentWord.ru, 'ru');
            break;
        case 'ru-to-pl':
        case 'ru-to-pl-new':
            question = currentWord.ru;
            options = getRandomOptions(currentWord.pl, 'pl');
            break;
        case 'pl-to-image':
            question = currentWord.pl;
            options = getRandomImageOptions(currentWord.image);
            break;
        case 'pl-to-ru-input':
        case 'pl-to-ru-input-new':
            question = currentWord.pl;
            options = null;
            break;
        case 'ru-to-pl-input':
        case 'ru-to-pl-input-new':
            question = currentWord.ru;
            options = null;
            break;
        default:
            console.error('Invalid game mode:', gameMode);
            return;
    }
    
    const questionElement = document.querySelector('.question');
    const optionsContainer = document.querySelector('.options-grid');
    
    if (!questionElement || !optionsContainer) {
        console.error('Required DOM elements not found');
        return;
    }
    
    questionElement.textContent = question;
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
    } else if (gameMode === 'pl-to-ru-input' || gameMode === 'ru-to-pl-input' || 
               gameMode === 'pl-to-ru-input-new' || gameMode === 'ru-to-pl-input-new') {
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'answer-input';
        input.placeholder = (gameMode === 'pl-to-ru-input' || gameMode === 'pl-to-ru-input-new') ? 
            'Enter Russian translation' : 'Enter Polish translation';
        
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Check';
        submitButton.className = 'submit-button';
        submitButton.onclick = () => {
            const userAnswer = input.value.trim().toLowerCase();
            const correctAnswer = (gameMode === 'pl-to-ru-input' || gameMode === 'pl-to-ru-input-new') ? 
                currentWord.ru.toLowerCase() : currentWord.pl.toLowerCase();
            checkAnswer(userAnswer, correctAnswer);
        };
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitButton.click();
            }
        });
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(submitButton);
        optionsContainer.appendChild(inputContainer);
        input.focus();
    } else {
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.className = 'option-button';
            button.onclick = () => checkAnswer(option);
            optionsContainer.appendChild(button);
        });
    }
    
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
function checkAnswer(selectedAnswer, correctAnswer = null) {
    const expectedAnswer = correctAnswer || (
        gameMode === 'pl-to-ru' || gameMode === 'pl-to-ru-new' ? currentWord.ru :
        gameMode === 'ru-to-pl' || gameMode === 'ru-to-pl-new' ? currentWord.pl :
        currentWord.image
    );
    
    if (selectedAnswer.toLowerCase() === expectedAnswer.toLowerCase()) {
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
    hint.textContent = `Correct answer: ${
        gameMode === 'pl-to-ru' || gameMode === 'pl-to-ru-new' || 
        gameMode === 'pl-to-ru-input' || gameMode === 'pl-to-ru-input-new' ? currentWord.ru :
        gameMode === 'ru-to-pl' || gameMode === 'ru-to-pl-new' || 
        gameMode === 'ru-to-pl-input' || gameMode === 'ru-to-pl-input-new' ? currentWord.pl :
        'Try again'
    }`;
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