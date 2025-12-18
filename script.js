
// State variables
let intervals = [];
let isRunning = false;
let currentStartTime = null;
let animationFrameId = null;

// DOM Elements
const displayEl = document.getElementById('display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const intervalsBody = document.getElementById('intervals-body');

// Format milliseconds to HH:MM:SS
function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => num.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Format time of day (e.g., 1:31:30 PM)
function formatTimeOfDay(date) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

// Calculate total time
function calculateTotalTime() {
    let total = intervals.reduce((acc, curr) => acc + curr.duration, 0);
    if (isRunning && currentStartTime) {
        total += Date.now() - currentStartTime;
    }
    return total;
}

// Update display
function updateDisplay() {
    const totalTime = calculateTotalTime();
    displayEl.textContent = formatDuration(totalTime);
    if (isRunning) {
        animationFrameId = requestAnimationFrame(updateDisplay);
    }
}

// Start Timer
function startTimer() {
    if (isRunning) return;

    isRunning = true;
    currentStartTime = Date.now();

    // Update UI
    startBtn.textContent = 'Pause';
    startBtn.classList.add('pause');

    updateDisplay();
}

// Pause Timer
function pauseTimer() {
    if (!isRunning) return;

    const now = Date.now();
    const duration = now - currentStartTime;

    const interval = {
        id: Date.now(), // simple unique id
        startTime: currentStartTime,
        endTime: now,
        duration: duration,
        comment: ''
    };

    intervals.push(interval);

    isRunning = false;
    currentStartTime = null;
    cancelAnimationFrame(animationFrameId);

    // Update UI
    startBtn.textContent = 'Start';
    startBtn.classList.remove('pause');

    // Update display one last time to ensure it shows the exact total
    displayEl.textContent = formatDuration(calculateTotalTime());

    renderIntervals();
}

// Reset Timer
function resetTimer() {
    isRunning = false;
    currentStartTime = null;
    intervals = [];
    cancelAnimationFrame(animationFrameId);
    displayEl.textContent = "00:00:00";

    // Update UI
    startBtn.textContent = 'Start';
    startBtn.classList.remove('pause');

    renderIntervals();
}

// Delete Interval
function deleteInterval(id) {
    intervals = intervals.filter(interval => interval.id !== id);
    // Recalculate and update display (since total time depends on intervals)
    displayEl.textContent = formatDuration(calculateTotalTime());
    renderIntervals();
}

// Update Comment
function updateComment(id, value) {
    const interval = intervals.find(i => i.id === id);
    if (interval) {
        interval.comment = value;
    }
}

// Render Intervals Table
function renderIntervals() {
    intervalsBody.innerHTML = '';

    // Iterate in order (oldest first) as requested implicitly by "list... one entry added... another entry added"
    // Usually lists are top to bottom.
    intervals.forEach((interval, index) => {
        const row = document.createElement('tr');

        const startCell = document.createElement('td');
        startCell.textContent = formatTimeOfDay(new Date(interval.startTime));
        row.appendChild(startCell);

        const endCell = document.createElement('td');
        endCell.textContent = formatTimeOfDay(new Date(interval.endTime));
        row.appendChild(endCell);

        const durationCell = document.createElement('td');
        durationCell.textContent = formatDuration(interval.duration);
        row.appendChild(durationCell);

        const commentCell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.value = interval.comment;
        input.placeholder = 'Add comment...';
        input.addEventListener('input', (e) => updateComment(interval.id, e.target.value));
        commentCell.appendChild(input);
        row.appendChild(commentCell);

        const actionCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.fontSize = '14px'; // Make it smaller than main controls
        deleteBtn.style.padding = '5px 10px';
        deleteBtn.addEventListener('click', () => deleteInterval(interval.id));
        actionCell.appendChild(deleteBtn);
        row.appendChild(actionCell);

        intervalsBody.appendChild(row);
    });
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});
resetBtn.addEventListener('click', resetTimer);
