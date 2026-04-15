'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = [
  '#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#2dd4bf', '#fbbf24', '#a855f7',
];

function easeOut(t, b, c, d) {
  const ts = (t /= d) * t;
  const tc = ts * t;
  return b + c * (tc + -3 * ts + 3 * t);
}

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [taskMinutes, setTaskMinutes] = useState('');
  const [taskRepeatable, setTaskRepeatable] = useState(false);
  const [currentTaskName, setCurrentTaskName] = useState('Welcome');
  const [timerDisplay, setTimerDisplay] = useState('00:00');
  const [showRepeat, setShowRepeat] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const canvasRef = useRef(null);
  const taskNameInputRef = useRef(null);
  const currentAudioRef = useRef(null);
  const customAudioBlobRef = useRef(null);
  const startAngleRef = useRef(0);
  const arcRef = useRef(0);
  const countdownIntervalRef = useRef(null);
  const currentActiveTaskRef = useRef(null);
  // Mirror of tasks state for use inside callbacks without stale closures
  const tasksRef = useRef([]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const drawWheel = useCallback((taskList) => {
    const list = taskList ?? tasksRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (list.length === 0) {
      ctx.clearRect(0, 0, 400, 400);
      return;
    }

    arcRef.current = Math.PI / (list.length / 2);
    ctx.clearRect(0, 0, 400, 400);

    list.forEach((task, i) => {
      const angle = startAngleRef.current + i * arcRef.current;
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.beginPath();
      ctx.moveTo(200, 200);
      ctx.arc(200, 200, 190, angle, angle + arcRef.current, false);
      ctx.fill();
      ctx.save();
      ctx.fillStyle = 'white';
      ctx.translate(
        200 + Math.cos(angle + arcRef.current / 2) * 135,
        200 + Math.sin(angle + arcRef.current / 2) * 135,
      );
      ctx.rotate(angle + arcRef.current / 2 + Math.PI / 2);
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(task.name.substring(0, 14), 0, 0);
      ctx.restore();
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
  }, []);

  // Clicking OK on the "Task Complete!" modal stops the music
  const handleModalOk = useCallback(() => {
    stopAudio();
    setShowModal(false);
  }, [stopAudio]);

  const startTimer = useCallback((seconds) => {
    clearInterval(countdownIntervalRef.current);
    const endTime = Date.now() + seconds * 1000;

    const tick = () => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        setTimerDisplay('00:00');
        if (customAudioBlobRef.current) {
          currentAudioRef.current = new Audio(customAudioBlobRef.current);
          currentAudioRef.current.play();
        }
        if (currentActiveTaskRef.current?.repeatable) {
          setShowRepeat(true);
        }
        setShowModal(true);
        return;
      }
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      setTimerDisplay(
        `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      );
    };

    tick();
    countdownIntervalRef.current = setInterval(tick, 500);
  }, []);

  const addTask = useCallback(() => {
    const name = taskName.trim();
    const time = parseInt(taskMinutes);
    if (!name) { taskNameInputRef.current?.focus(); return; }
    if (!time || time < 1) return;

    const newTasks = [...tasksRef.current, { name, time, repeatable: taskRepeatable }];
    tasksRef.current = newTasks;
    setTasks(newTasks);
    setTaskName('');
    setTaskMinutes('');
    setTaskRepeatable(false);
    localStorage.setItem('savedTasks', JSON.stringify(newTasks));
    drawWheel(newTasks);
    setTimeout(() => taskNameInputRef.current?.focus(), 0);
  }, [taskName, taskMinutes, taskRepeatable, drawWheel]);

  const removeTask = useCallback((index) => {
    const newTasks = tasksRef.current.filter((_, i) => i !== index);
    tasksRef.current = newTasks;
    setTasks(newTasks);
    localStorage.setItem('savedTasks', JSON.stringify(newTasks));
    drawWheel(newTasks);
  }, [drawWheel]);

  const spinWheel = useCallback(() => {
    if (tasksRef.current.length === 0) return;
    stopAudio();
    clearInterval(countdownIntervalRef.current);
    setShowRepeat(false);

    const spinAngleStart = Math.random() * 10 + 10;
    let spinTime = 0;
    const spinTimeTotal = Math.random() * 3 + 3000;

    const rotate = () => {
      spinTime += 30;
      if (spinTime >= spinTimeTotal) {
        const degrees = (startAngleRef.current * 180) / Math.PI + 90;
        const index =
          Math.floor(
            (360 - (degrees % 360)) / ((arcRef.current * 180) / Math.PI),
          ) % tasksRef.current.length;
        currentActiveTaskRef.current = tasksRef.current[index];
        setCurrentTaskName(currentActiveTaskRef.current.name);
        startTimer(currentActiveTaskRef.current.time * 60);
        return;
      }
      startAngleRef.current +=
        ((spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal)) *
          Math.PI) /
        180;
      drawWheel();
      setTimeout(rotate, 30);
    };
    rotate();
  }, [stopAudio, startTimer, drawWheel]);

  const repeatCurrentTask = useCallback(() => {
    if (currentActiveTaskRef.current) {
      stopAudio();
      setShowRepeat(false);
      startTimer(currentActiveTaskRef.current.time * 60);
    }
  }, [stopAudio, startTimer]);

  const loadCustomAudio = useCallback((e) => {
    const file = e.target.files[0];
    if (file) customAudioBlobRef.current = URL.createObjectURL(file);
  }, []);

  // Load saved tasks on mount and focus the input
  useEffect(() => {
    const saved = localStorage.getItem('savedTasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        tasksRef.current = parsed;
        setTasks(parsed);
        drawWheel(parsed);
      } catch {
        localStorage.removeItem('savedTasks');
      }
    }
    taskNameInputRef.current?.focus();
  }, [drawWheel]);

  return (
    <div className="app-container">
      {/* Left: Controls */}
      <div className="controls">
        <div className="brand">
          <div className="brand-icon" />
          <h2>Task Orbit</h2>
        </div>

        <div className="add-form">
          <input
            ref={taskNameInputRef}
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Task name"
          />
          <div className="form-row">
            <input
              type="number"
              value={taskMinutes}
              onChange={(e) => setTaskMinutes(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Minutes"
              min="1"
            />
            <label className="repeat-label">
              <input
                type="checkbox"
                checked={taskRepeatable}
                onChange={(e) => setTaskRepeatable(e.target.checked)}
              />
              Repeatable
            </label>
          </div>
          <button className="action-btn btn-dark" onClick={addTask}>
            + Add Task
          </button>
        </div>

        <div className="task-list-display">
          {tasks.map((t, i) => (
            <div
              key={i}
              className="list-item"
              style={{ borderLeftColor: COLORS[i % COLORS.length] }}
            >
              <span>
                <strong>{t.name}</strong> ({t.time}m)
              </span>
              <button className="del-x" onClick={() => removeTask(i)}>
                ✕
              </button>
            </div>
          ))}
        </div>

        {showRepeat && (
          <button className="action-btn btn-repeat" onClick={repeatCurrentTask}>
            Repeat Same Task
          </button>
        )}

        <div className="settings-bar">
          <strong>Upload Alarm:</strong>
          <br />
          <input
            type="file"
            accept="audio/*"
            onChange={loadCustomAudio}
            style={{ marginTop: 5, fontSize: '0.75rem' }}
          />
        </div>
      </div>

      {/* Right: Wheel */}
      <div className="wheel-box">
        <div id="current-task-name">{currentTaskName}</div>
        <div id="wheel-wrapper">
          <div className="pointer" />
          <canvas ref={canvasRef} width={400} height={400} />
        </div>
        <button id="spin-btn" onClick={spinWheel}>
          SPIN THE WHEEL
        </button>
        <div id="timer-display">{timerDisplay}</div>
      </div>

      {/* Task Complete modal — OK button stops the alarm */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>Task Complete!</p>
            <button className="modal-ok" onClick={handleModalOk}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
