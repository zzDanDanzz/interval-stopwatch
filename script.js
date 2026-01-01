// State variables
let intervals = [];
let isRunning = false;
let currentStartTime = null;
let animationFrameId = null;
let editingIntervalId = null;

// Save state to localStorage
function saveState() {
  const state = {
    intervals,
    isRunning,
    currentStartTime,
  };
  localStorage.setItem("stopwatchState", JSON.stringify(state));
}

// Load state from localStorage
function loadState() {
  const savedState = localStorage.getItem("stopwatchState");
  if (savedState) {
    const state = JSON.parse(savedState);
    intervals = state.intervals || [];
    isRunning = state.isRunning || false;
    currentStartTime = state.currentStartTime;

    if (isRunning) {
      startBtn.textContent = "Pause";
      startBtn.classList.add("pause");
      updateDisplay(); // This starts the animation loop because updateDisplay calls requestAnimationFrame if isRunning is true
    } else {
      // Even if not running, update display to show total time
      displayEl.textContent = formatDuration(calculateTotalTime());
      if (intervals.length > 0) {
        intervalDisplayEl.textContent = formatDuration(
          intervals[intervals.length - 1].duration
        );
      } else {
        intervalDisplayEl.textContent = "00:00:00";
      }
    }

    renderIntervals();
  }
}

// DOM Elements
const displayEl = document.getElementById("display");
const intervalDisplayEl = document.getElementById("interval-display");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const intervalsBody = document.getElementById("intervals-body");

// Format milliseconds to HH:MM:SS
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (num) => num.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Format time of day (e.g., 1:31:30 PM)
function formatTimeOfDay(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Convert timestamp to HH:MM:SS (24-hour) for input type="time"
function toInputTime(timestamp) {
  const d = new Date(timestamp);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// Update timestamp with new time string (HH:MM:SS)
function fromInputTime(originalTimestamp, timeString) {
  const parts = timeString.split(":");
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const s = parts[2] ? parseInt(parts[2], 10) : 0;

  const d = new Date(originalTimestamp);
  d.setHours(h);
  d.setMinutes(m);
  d.setSeconds(s);
  return d.getTime();
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
    const currentIntervalTime = Date.now() - currentStartTime;
    intervalDisplayEl.textContent = formatDuration(currentIntervalTime);
    animationFrameId = requestAnimationFrame(updateDisplay);
  }
}

// Start Timer
function startTimer() {
  if (isRunning) return;

  isRunning = true;
  currentStartTime = Date.now();
  saveState();

  // Update UI
  startBtn.textContent = "Pause";
  startBtn.classList.add("pause");
  intervalDisplayEl.textContent = "00:00:00";

  renderIntervals(); // Re-render to disable edit buttons
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
    comment: "",
  };

  intervals.push(interval);

  isRunning = false;
  currentStartTime = null;
  cancelAnimationFrame(animationFrameId);
  saveState();

  // Update UI
  startBtn.textContent = "Start";
  startBtn.classList.remove("pause");

  // Update display one last time to ensure it shows the exact total
  displayEl.textContent = formatDuration(calculateTotalTime());
  intervalDisplayEl.textContent = formatDuration(duration);

  renderIntervals();
}

// Reset Timer
function resetTimer() {
  if (intervals.length > 0) {
    if (!confirm("Are you sure you want to reset? Data will be lost.")) {
      return;
    }
  }

  isRunning = false;
  currentStartTime = null;
  intervals = [];
  editingIntervalId = null;
  cancelAnimationFrame(animationFrameId);
  displayEl.textContent = "00:00:00";
  intervalDisplayEl.textContent = "00:00:00";

  // Clear localStorage
  localStorage.removeItem("stopwatchState");

  // Update UI
  startBtn.textContent = "Start";
  startBtn.classList.remove("pause");

  renderIntervals();
}

// Delete Interval
function deleteInterval(id) {
  intervals = intervals.filter((interval) => interval.id !== id);
  if (editingIntervalId === id) {
    editingIntervalId = null;
  }
  saveState();
  // Recalculate and update display (since total time depends on intervals)
  displayEl.textContent = formatDuration(calculateTotalTime());
  renderIntervals();
}

// Update Comment
function updateComment(id, value) {
  const interval = intervals.find((i) => i.id === id);
  if (interval) {
    interval.comment = value;
    saveState();
  }
}

// Save Edit
function saveEdit(id) {
  const startInput = document.getElementById(`start-input-${id}`);
  const endInput = document.getElementById(`end-input-${id}`);

  if (startInput && endInput) {
    const interval = intervals.find((i) => i.id === id);
    if (interval) {
      const newStartTime = fromInputTime(interval.startTime, startInput.value);
      const newEndTime = fromInputTime(interval.endTime, endInput.value);

      interval.startTime = newStartTime;
      interval.endTime = newEndTime;
      interval.duration = newEndTime - newStartTime;

      saveState();
      displayEl.textContent = formatDuration(calculateTotalTime());
    }
  }

  editingIntervalId = null;
  renderIntervals();
}

// Render Intervals Table
function renderIntervals() {
  intervalsBody.innerHTML = "";

  intervals.forEach((interval, index) => {
    const row = document.createElement("tr");
    const isEditing = interval.id === editingIntervalId;

    // Start Time
    const startCell = document.createElement("td");
    if (isEditing) {
      const input = document.createElement("input");
      input.type = "time";
      input.step = "1";
      input.value = toInputTime(interval.startTime);
      input.id = `start-input-${interval.id}`;
      startCell.appendChild(input);
    } else {
      startCell.textContent = formatTimeOfDay(new Date(interval.startTime));
    }
    row.appendChild(startCell);

    // End Time
    const endCell = document.createElement("td");
    if (isEditing) {
      const input = document.createElement("input");
      input.type = "time";
      input.step = "1";
      input.value = toInputTime(interval.endTime);
      input.id = `end-input-${interval.id}`;
      endCell.appendChild(input);
    } else {
      endCell.textContent = formatTimeOfDay(new Date(interval.endTime));
    }
    row.appendChild(endCell);

    // Duration
    const durationCell = document.createElement("td");
    durationCell.textContent = formatDuration(interval.duration);
    row.appendChild(durationCell);

    // Comment
    const commentCell = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.value = interval.comment;
    input.placeholder = "Add comment...";
    input.addEventListener("input", (e) =>
      updateComment(interval.id, e.target.value)
    );
    commentCell.appendChild(input);
    row.appendChild(commentCell);

    // Action
    const actionCell = document.createElement("td");
    actionCell.style.display = "flex";
    actionCell.style.gap = "5px";
    actionCell.style.justifyContent = "center";

    const editBtn = document.createElement("button");
    if (isEditing) {
      editBtn.textContent = "Save";
      editBtn.style.fontSize = "14px";
      editBtn.style.padding = "5px 10px";
      editBtn.addEventListener("click", () => saveEdit(interval.id));
    } else {
      editBtn.textContent = "Edit";
      editBtn.disabled = isRunning;
      editBtn.style.fontSize = "14px";
      editBtn.style.padding = "5px 10px";
      editBtn.addEventListener("click", () => {
        editingIntervalId = interval.id;
        renderIntervals();
      });
    }
    actionCell.appendChild(editBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.style.fontSize = "14px"; // Make it smaller than main controls
    deleteBtn.style.padding = "5px 10px";
    deleteBtn.addEventListener("click", () => deleteInterval(interval.id));
    // Disable delete when editing? User didn't ask, but cleaner. I'll leave enabled as per prompt "when delete button is clickable".

    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    intervalsBody.appendChild(row);
  });
}

// Event Listeners
startBtn.addEventListener("click", () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});
resetBtn.addEventListener("click", resetTimer);

// Initialize
loadState();
