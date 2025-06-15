let words = [];
let currentWord = null;
let correctAnswers = 0;
let incorrectAnswers = 0;
let gameMode = null;
let wordQueue = [];
let answeredWords = new Map(); // Map to track word status and when they can be reintroduced
let totalWords = 0; // Total words available for current game mode
let answeredWordsCount = 0; // Count of words that have been answered

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

        // Initialize word queue based on game mode
        initializeWordQueue();
        
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

// Initialize word queue based on game mode
function initializeWordQueue() {
    let availableWords = words;
    if (gameMode.includes('-new')) {
        availableWords = words.filter(word => word.isNew === true);
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
    
    // Shuffle the words and create initial queue
    wordQueue = shuffleArray([...availableWords]);
    answeredWords.clear();
    totalWords = availableWords.length;
    answeredWordsCount = 0;
    
    // Add progress counter to the page
    const statsContainer = document.querySelector('.stats');
    if (statsContainer) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'stat';
        progressDiv.innerHTML = `
            Progress: <span class="answered-count">0</span> / <span class="total-words">${totalWords}</span> words
        `;
        statsContainer.appendChild(progressDiv);
    }
}

// Get next word from queue
function getNextWord() {
    // Check if we need to reintroduce any words
    const now = Date.now();
    for (const [word, data] of answeredWords.entries()) {
        if (!data.correct && now - data.timestamp >= 30000) { // Reintroduce after 30 seconds
            wordQueue.push(word);
            answeredWords.delete(word);
        }
    }

    // If queue is empty, refill it with all words except the last used one
    if (wordQueue.length === 0) {
        const allWords = words.filter(word => {
            if (gameMode.includes('-new')) {
                return word.isNew === true && word !== currentWord;
            }
            return word !== currentWord;
        });
        wordQueue = shuffleArray([...allWords]);
    }

    return wordQueue.shift();
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

    currentWord = getNextWord();
    if (!currentWord) {
        console.error('Failed to get next word');
        return;
    }

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
    
    const isCorrect = selectedAnswer.toLowerCase() === expectedAnswer.toLowerCase();
    
    // Track the word's status
    if (!answeredWords.has(currentWord)) {
        answeredWordsCount++;
        updateProgress();
    }
    
    answeredWords.set(currentWord, {
        correct: isCorrect,
        timestamp: Date.now()
    });
    
    if (isCorrect) {
        correctAnswers++;
        if (answeredWordsCount >= totalWords) {
            showGameCompletion();
        } else {
            showNextQuestion();
        }
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

// Update progress counter
function updateProgress() {
    const answeredCount = document.querySelector('.answered-count');
    if (answeredCount) {
        answeredCount.textContent = answeredWordsCount;
    }
}

// Show game completion screen
function showGameCompletion() {
    const gameContainer = document.querySelector('.game-container');
    const accuracy = totalWords > 0 ? Math.round((correctAnswers / totalWords) * 100) : 0;
    
    gameContainer.innerHTML = `
        <h1>Task Completed!</h1>
        <div class="completion-stats">
            <div class="stat">Total Words: ${totalWords}</div>
            <div class="stat">Correct Answers: ${correctAnswers}</div>
            <div class="stat">Incorrect Answers: ${incorrectAnswers}</div>
            <div class="stat">Accuracy: ${accuracy}%</div>
        </div>
        <div class="dictionary-section">
            <a href="index.html" class="back-button">Back to menu</a>
        </div>
    `;
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