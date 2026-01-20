// AdminResultsHistory.js - Admin view for all quiz results
// Uses Flask-injected authentication variables for admin verification

// Import markdown utility
import MarkdownToHTMLString from './MarkDownUtils.js';

// DOM elements
let statusContainer;
let quizList;
let emptyBox;
let refreshBtn;
let backBtn;

// Cache for user data to avoid repeated API calls
const userCache = new Map();

/**
 * Initialize the page
 */
async function init() {
    // Check authentication and admin role (using bridged variables from Flask)
    if (!isAuthed || userRole !== 'ADMIN') {
        alert('Access denied. This page is only accessible to administrators.');
        window.location.href = '/';
        return;
    }

    // Get DOM elements
    statusContainer = document.getElementById('statusContainer');
    quizList = document.getElementById('quizList');
    emptyBox = document.getElementById('empty');
    refreshBtn = document.getElementById('refreshBtn');
    backBtn = document.getElementById('backBtn');

    // Attach event listeners
    refreshBtn.addEventListener('click', () => loadScores());
    backBtn.addEventListener('click', () => window.location.href = '/');

    // Load scores
    await loadScores();
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-message ${type}`;
    statusDiv.textContent = message;

    statusContainer.innerHTML = '';
    statusContainer.appendChild(statusDiv);

    if (type === 'success') {
        setTimeout(() => statusDiv.remove(), 5000);
    }
}

/**
 * Helper to format epoch ms -> readable string
 */
function formatDatetime(epochMs) {
    try {
        const d = new Date(Number(epochMs));
        if (Number.isNaN(d.getTime())) return String(epochMs);
        return d.toLocaleString();
    } catch (e) {
        return String(epochMs);
    }
}

/**
 * Fetch user data by ID (with caching)
 */
async function getUserData(userId) {
    if (userCache.has(userId)) {
        return userCache.get(userId);
    }

    try {
        const response = await fetch(`/API/User/${userId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
                userCache.set(userId, data.user);
                return data.user;
            }
        }

        // Return placeholder if fetch fails
        return { UserName: `User #${userId}`, ID: userId };
    } catch (error) {
        console.error('Error fetching user data:', error);
        return { UserName: `User #${userId}`, ID: userId };
    }
}

/**
 * Load all scores from API
 */
async function loadScores() {
    showStatus('Loading all quiz results...', 'info');
    quizList.innerHTML = '';
    emptyBox.style.display = 'none';

    try {
        const response = await fetch('/API/AllScores', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 403) {
                showStatus('Access denied. Admin privileges required.', 'error');
                return;
            }
            throw new Error(`Failed to load scores: ${response.status}`);
        }

        let json;
        try {
            json = await response.json();
        } catch (err) {
            showStatus('Server returned non-JSON response.', 'error');
            return;
        }

        const scores = Array.isArray(json.scores) ? json.scores : (json.scores ? [json.scores] : []);

        if (!scores || scores.length === 0) {
            showStatus('No quiz scores found.', 'info');
            emptyBox.style.display = 'block';
            return;
        }

        // Sort by CompletionDatetime descending (newest first)
        scores.sort((a, b) => Number(b.CompletionDatetime || 0) - Number(a.CompletionDatetime || 0));

        showStatus(`Loaded ${scores.length} quiz result${scores.length > 1 ? 's' : ''}.`, 'success');

        // Render each score
        for (const quiz of scores) {
            await renderQuizRow(quiz);
        }
    } catch (error) {
        console.error('Error loading scores:', error);
        showStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Safely parse QuizInfo JSON
 */
function safeParseQuizInfo(quizInfo) {
    if (!quizInfo) return [];
    if (typeof quizInfo !== 'string') return quizInfo;

    try {
        let parsed = JSON.parse(quizInfo);
        let attempts = 0;
        while (typeof parsed === 'string' && attempts < 3) {
            parsed = JSON.parse(parsed);
            attempts++;
        }
        if (Array.isArray(parsed)) return parsed;
        return parsed;
    } catch (err) {
        console.warn('Failed to parse QuizInfo JSON:', err);
        try {
            const cleaned = quizInfo.replace(/\\"/g, '"');
            return JSON.parse(cleaned);
        } catch (e2) {
            console.warn('Second parse attempt failed:', e2);
            return [];
        }
    }
}

/**
 * Render a quiz row
 */
async function renderQuizRow(quiz) {
    const row = document.createElement('div');
    row.className = 'quiz-row';

    const meta = document.createElement('div');
    meta.className = 'quiz-meta';

    // Fetch user data
    const userData = await getUserData(quiz.UserID);

    // User info
    const userDiv = document.createElement('div');
    userDiv.className = 'user';
    userDiv.textContent = userData.UserName || `User #${quiz.UserID}`;

    // When
    const when = document.createElement('div');
    when.className = 'when';
    when.textContent = formatDatetime(quiz.CompletionDatetime || quiz.StartDatetime || Date.now());

    // Level
    const level = document.createElement('div');
    level.className = 'level';
    level.textContent = 'Level ' + (quiz.LevelID ?? '-');

    // Score
    const score = document.createElement('div');
    score.className = 'score';
    score.textContent = `${quiz.QuizMark ?? 0} / ${quiz.TotalQuizMark ?? '-'}`;

    meta.appendChild(userDiv);
    meta.appendChild(when);
    meta.appendChild(level);

    const controls = document.createElement('div');
    controls.className = 'controls';

    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'View Result';
    viewBtn.title = 'Show details for this quiz';

    controls.appendChild(viewBtn);

    // Wrap summary elements in a container for the first row
    const summary = document.createElement('div');
    summary.className = 'quiz-summary';
    summary.appendChild(meta);
    summary.appendChild(score);
    summary.appendChild(controls);

    row.appendChild(summary);

    // Details container
    const details = document.createElement('div');
    details.className = 'details';

    // Parse quiz info into questions array
    const questions = safeParseQuizInfo(quiz.QuizInfo) || [];

    if (questions.length === 0) {
        const noq = document.createElement('div');
        noq.className = 'empty';
        noq.textContent = 'No question data available for this quiz.';
        details.appendChild(noq);
    } else {
        questions.forEach((qObj, idx) => {
            const qwrap = document.createElement('div');
            qwrap.className = 'question';

            const qTitle = document.createElement('div');
            qTitle.className = 'q-title';
            // Render question title as markdown
            const questionText = qObj.Question ?? qObj.question ?? 'Untitled question';
            try {
                qTitle.innerHTML = `Q${idx + 1}. ` + MarkdownToHTMLString(questionText);
            } catch (err) {
                console.warn('Markdown rendering failed for question title:', err);
                qTitle.textContent = `Q${idx + 1}. ${questionText}`;
            }

            const optWrap = document.createElement('div');
            optWrap.className = 'options';

            const answers = qObj.Answers || qObj.answers || [];
            const userAnswerIndex = (typeof qObj.UserAnswer === 'number') ? qObj.UserAnswer : (typeof qObj.UserAnswer === 'string' ? Number(qObj.UserAnswer) : null);
            const correctIndex = (typeof qObj.CorrectAnswerIndex === 'number') ? qObj.CorrectAnswerIndex : (typeof qObj.CorrectAnswerIndex === 'string' ? Number(qObj.CorrectAnswerIndex) : null);

            answers.forEach((optText, optIdx) => {
                const opt = document.createElement('div');
                opt.className = 'option';
                opt.textContent = optText;

                // Mark correct
                if (correctIndex !== null && optIdx === correctIndex) {
                    opt.classList.add('correct');
                    opt.title = 'Correct answer';
                }

                // Mark user answer
                if (userAnswerIndex !== null && optIdx === userAnswerIndex) {
                    opt.classList.add('user');
                    const badge = document.createElement('span');
                    badge.style.float = 'right';
                    badge.style.opacity = 0.9;
                    badge.style.fontSize = '0.85rem';
                    badge.textContent = (optIdx === correctIndex) ? 'User answer (✔)' : 'User answer (✖)';
                    opt.appendChild(badge);
                }

                optWrap.appendChild(opt);
            });

            qwrap.appendChild(qTitle);
            qwrap.appendChild(optWrap);

            // Explanation - render markdown if present
            if (qObj.AnswerExplanation) {
                const expl = document.createElement('div');
                expl.className = 'explanation';

                try {
                    const html = MarkdownToHTMLString(qObj.AnswerExplanation);
                    expl.innerHTML = html;
                } catch (err) {
                    console.warn('Markdown convert failed:', err);
                    expl.textContent = qObj.AnswerExplanation;
                }

                qwrap.appendChild(expl);
            }

            details.appendChild(qwrap);
        });
    }

    // Wire up toggle
    viewBtn.onclick = () => {
        const visible = details.style.display === 'block';
        details.style.display = visible ? 'none' : 'block';
        viewBtn.textContent = visible ? 'View Result' : 'Hide Result';
    };

    // Append details (starts hidden)
    row.appendChild(details);
    quizList.appendChild(row);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
