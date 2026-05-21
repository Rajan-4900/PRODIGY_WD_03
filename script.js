const boardElement = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const resetBtn = document.getElementById('reset-btn');
const pvpModeBtn = document.getElementById('pvp-mode');
const pveModeBtn = document.getElementById('pve-mode');

const resultModal = document.getElementById('result-modal');
const modalMessage = document.getElementById('modal-message');
const playAgainBtn = document.getElementById('play-again-btn');

const p1Input = document.getElementById('p1-name');
const p2Input = document.getElementById('p2-name');
const historyBody = document.getElementById('history-body');
const clearHistoryBtn = document.getElementById('clear-history-btn');

const summaryModal = document.getElementById('summary-modal');
const closeSummaryBtn = document.getElementById('close-summary-btn');
const totalMatchesText = document.getElementById('total-matches');
const p1WinsText = document.getElementById('p1-wins');
const p2WinsText = document.getElementById('p2-wins');
const mvpNameText = document.getElementById('mvp-name');
const p1StatName = document.getElementById('p1-stat-name');
const p2StatName = document.getElementById('p2-stat-name');

const guideModal = document.getElementById('guide-modal');
const guideBtn = document.getElementById('guide-btn');
const closeGuideBtn = document.getElementById('close-guide-btn');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let gameMode = 'pvp'; // 'pvp' or 'pve'
let matches = JSON.parse(localStorage.getItem('ticTacToeHistory')) || [];
let aiTimeout = null;

// Session Tracking
let sessionMatches = 0;
let p1Wins = 0;
let p2Wins = 0;

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// --- Initialization ---
function init() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    clearHistoryBtn.addEventListener('click', clearHistory);

    playAgainBtn.addEventListener('click', () => {
        closeModal();
        resetGame();
    });

    closeSummaryBtn.addEventListener('click', () => {
        summaryModal.classList.remove('active');
        resetSession();
        resetGame();
    });

    pvpModeBtn.addEventListener('click', () => setGameMode('pvp'));
    pveModeBtn.addEventListener('click', () => setGameMode('pve'));

    // Name listeners for real-time status update
    p1Input.addEventListener('input', updateStatus);
    p2Input.addEventListener('input', updateStatus);

    guideBtn.addEventListener('click', () => {
        guideModal.classList.add('active');
    });

    closeGuideBtn.addEventListener('click', () => {
        guideModal.classList.remove('active');
    });

    updateStatus();
    renderHistory();
}

function getPlayerName(player) {
    if (player === 'X') {
        return p1Input.value.trim() || 'Player 1';
    } else {
        if (gameMode === 'pve') return 'AI';
        return p2Input.value.trim() || 'Player 2';
    }
}

function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (board[clickedCellIndex] !== '' || !gameActive) return;

    makeMove(clickedCellIndex, currentPlayer);

    if (gameActive && gameMode === 'pve' && currentPlayer === 'O') {
        clearTimeout(aiTimeout);
        aiTimeout = setTimeout(makeAIMove, 500);
    }
}

function makeMove(index, player) {
    board[index] = player;
    cells[index].innerText = player;
    cells[index].classList.add(player.toLowerCase(), 'taken');

    checkResult();

    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        updateStatus();
    }
}

function updateStatus() {
    const name = getPlayerName(currentPlayer);
    const colorClass = currentPlayer === 'X' ? 'status-x' : 'status-o';
    statusText.innerHTML = `<span class="${colorClass}">${name}</span>'s Turn (${currentPlayer})`;
}

function checkResult() {
    let roundWon = false;
    let winningCombination = null;

    for (let i = 0; i < winningConditions.length; i++) {
        const [a, b, c] = winningConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningCombination = winningConditions[i];
            break;
        }
    }

    if (roundWon) {
        gameActive = false;
        highlightWinner(winningCombination);
        const winnerName = getPlayerName(currentPlayer);

        // Track session wins
        if (currentPlayer === 'X') p1Wins++;
        else p2Wins++;

        saveMatch(winnerName);
        triggerWinCelebration();
        showModal(`${winnerName} Wins!`);
        return;
    }

    if (!board.includes('')) {
        gameActive = false;
        saveMatch('Draw');
        showModal("It's a Draw!");
        return;
    }
}

function saveMatch(result) {
    sessionMatches++;
    const match = {
        id: matches.length + 1,
        p1: getPlayerName('X'),
        p2: getPlayerName('O'),
        result: result,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    matches.unshift(match); // Add to beginning
    if (matches.length > 20) matches.pop(); // Keep last 20
    localStorage.setItem('ticTacToeHistory', JSON.stringify(matches));
    renderHistory();

    // Check for session end
    if (sessionMatches === 5) {
        setTimeout(showSummary, 800); // Faster delay
    }
}

function renderHistory() {
    if (matches.length === 0) {
        historyBody.innerHTML = '<tr class="empty-row"><td colspan="3">No matches played yet</td></tr>';
        return;
    }

    historyBody.innerHTML = matches.map(m => `
        <tr>
            <td>#${m.id}</td>
            <td>${m.p1} vs ${m.p2}</td>
            <td class="${m.result === 'Draw' ? 'result-draw' : 'result-win'}">${m.result}</td>
        </tr>
    `).join('');
}

function showModal(msg) {
    modalMessage.innerText = msg;
    resultModal.classList.add('active');
}

function closeModal() {
    resultModal.classList.remove('active');
}

function showSummary() {
    closeModal(); // Hide normal win modal if visible

    const p1Name = getPlayerName('X');
    const p2Name = getPlayerName('O');

    p1StatName.innerText = p1Name;
    p2StatName.innerText = p2Name;
    p1WinsText.innerText = p1Wins;
    p2WinsText.innerText = p2Wins;
    totalMatchesText.innerText = sessionMatches;

    if (p1Wins > p2Wins) {
        mvpNameText.innerText = `${p1Name}!`;
    } else if (p2Wins > p1Wins) {
        mvpNameText.innerText = `${p2Name}!`;
    } else {
        mvpNameText.innerText = "It's a Tie!";
    }

    summaryModal.classList.add('active');
}

function resetSession() {
    sessionMatches = 0;
    p1Wins = 0;
    p2Wins = 0;
}

const confirmModal = document.getElementById('confirm-modal');
const confirmYesBtn = document.getElementById('confirm-yes');
const confirmNoBtn = document.getElementById('confirm-no');

function clearHistory() {
    confirmModal.classList.add('active');
}

confirmYesBtn.addEventListener('click', () => {
    matches = [];
    localStorage.removeItem('ticTacToeHistory');
    renderHistory();
    confirmModal.classList.remove('active');
});

confirmNoBtn.addEventListener('click', () => {
    confirmModal.classList.remove('active');
});

function highlightWinner(combination) {
    combination.forEach(index => {
        cells[index].classList.add('winner');
    });
}

function setGameMode(mode) {
    gameMode = mode;
    pvpModeBtn.classList.toggle('active', mode === 'pvp');
    pveModeBtn.classList.toggle('active', mode === 'pve');

    if (mode === 'pve') {
        p2Input.value = 'AI';
        p2Input.disabled = true;
        p2Input.style.opacity = '0.5';
    } else {
        if (p2Input.value === 'AI') p2Input.value = '';
        p2Input.disabled = false;
        p2Input.style.opacity = '1';
    }

    resetGame();
}

function resetGame() {
    clearTimeout(aiTimeout);
    board = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    updateStatus();

    // Visual feedback for "New Match"
    boardElement.style.animation = 'none';
    boardElement.offsetHeight; // trigger reflow
    boardElement.style.animation = 'fadeIn 0.5s ease-out';

    cells.forEach(cell => {
        cell.innerText = '';
        cell.className = 'cell';
    });
}

// --- AI Logic (Minimax) ---
function makeAIMove() {
    if (!gameActive) return;
    const bestMove = minimax(board, 'O').index;
    makeMove(bestMove, 'O');
}

function minimax(newBoard, player) {
    const availSpots = newBoard.reduce((acc, val, idx) => (val === '' ? acc.concat(idx) : acc), []);

    if (checkWin(newBoard, 'X')) return { score: -10 };
    if (checkWin(newBoard, 'O')) return { score: 10 };
    if (availSpots.length === 0) return { score: 0 };

    const moves = [];
    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;

        if (player === 'O') {
            const result = minimax(newBoard, 'X');
            move.score = result.score;
        } else {
            const result = minimax(newBoard, 'O');
            move.score = result.score;
        }

        newBoard[availSpots[i]] = '';
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }

    return moves[bestMove];
}

function checkWin(currentBoard, player) {
    return winningConditions.some(condition => {
        return condition.every(index => currentBoard[index] === player);
    });
}

init();

function triggerWinCelebration() {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        const colors = currentPlayer === 'X' ? ['#38bdf8', '#ffffff', '#0077ff'] : ['#c084fc', '#ffffff', '#8b5cf6'];

        // Fireworks from random spots
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: colors,
            scalar: 1.2
        });
        confetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: colors,
            scalar: 1.2
        });
    }, 250);
}
