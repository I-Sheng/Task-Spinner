# Task Orbit

A single-file productivity app that randomly selects your next task by spinning a wheel, then counts down a timer for that task.

## Getting Started

Open `index.html` in any modern browser — no install or server required.

## Adding Tasks

Use the form in the left panel to add tasks one at a time:

1. Enter a **task name**.
2. Enter the **duration in minutes**.
3. Check **Repeatable** if you want a "Repeat Same Task" button to appear after the timer ends.
4. Click **+ Add Task** (or press Enter) — the task appears in the list and the wheel updates instantly.

Tasks are saved automatically in `localStorage` and restored on your next visit.

## Spinning the Wheel

Click **SPIN THE WHEEL**. The wheel decelerates and lands on a random task. The task name appears at the top and the countdown timer starts automatically.

## Timer

- Displays remaining time as `MM:SS`.
- Keeps accurate time even when the browser tab is in the background.
- When time runs out, an alarm plays (if one is uploaded) and an alert appears.

## Repeat a Task

If a task is marked `O`, a green **Repeat Same Task** button appears after it completes. Click it to restart the same timer without re-spinning.

## Custom Alarm Sound

In the **Upload Alarm** section at the bottom-left, choose any audio file from your device. It will play when the timer reaches zero.

## Managing the Task List

The task list is always visible below the add form:
- Each task shows its color-coded stripe matching its wheel segment.
- Click **✕** next to any task to remove it — the wheel updates immediately.
