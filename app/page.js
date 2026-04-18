'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AddTaskForm from '@/components/AddTaskForm';
import BatchImport from '@/components/BatchImport';
import TaskList from '@/components/TaskList';
import WheelCanvas from '@/components/WheelCanvas';
import TimerBlock from '@/components/TimerBlock';
import CompleteModal from '@/components/CompleteModal';

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
  const [currentTaskName, setCurrentTaskName] = useState('Welcome');
  const [timerDisplay, setTimerDisplay] = useState('00:00');
  const [timerProgress, setTimerProgress] = useState(100);
  const [showRepeat, setShowRepeat] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTaskName, setModalTaskName] = useState('');
  const [showStopBtn, setShowStopBtn] = useState(false);

  const canvasRef = useRef(null);
  const currentAudioRef = useRef(null);
  const customAudioBlobRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioBufferRef = useRef(null);
  const silentSourceRef = useRef(null);
  const alarmPendingRef = useRef(false);
  const startAngleRef = useRef(0);
  const arcRef = useRef(0);
  const countdownIntervalRef = useRef(null);
  const currentActiveTaskRef = useRef(null);
  const tasksRef = useRef([]);
  const timerTotalRef = useRef(0);

  // Keep tasksRef in sync for use inside callbacks without stale closures
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
    alarmPendingRef.current = false;
    if (currentAudioRef.current) {
      try { currentAudioRef.current.stop(); } catch {}
      currentAudioRef.current = null;
    }
  }, []);

  const triggerAlarm = useCallback(() => {
    if (!audioBufferRef.current || !audioContextRef.current) return;
    alarmPendingRef.current = false;
    const ctx = audioContextRef.current;
    const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
    resume.then(() => {
      if (currentAudioRef.current) {
        try { currentAudioRef.current.stop(); } catch {}
      }
      const source = ctx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(ctx.destination);
      source.start(0);
      currentAudioRef.current = source;
    });
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = null;
    setTimerDisplay('00:00');
    setTimerProgress(100);
    setShowStopBtn(false);
    stopAudio();
  }, [stopAudio]);

  const startTimer = useCallback((seconds) => {
    clearInterval(countdownIntervalRef.current);
    timerTotalRef.current = seconds;
    const endTime = Date.now() + seconds * 1000;
    setShowStopBtn(true);

    const tick = () => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setTimerDisplay('00:00');
        setTimerProgress(0);
        setShowStopBtn(false);

        alarmPendingRef.current = true;
        triggerAlarm();
        if (currentActiveTaskRef.current?.repeatable) setShowRepeat(true);
        setModalTaskName(currentActiveTaskRef.current?.name ?? '');
        setShowModal(true);
        return;
      }
      setTimerProgress((remaining / timerTotalRef.current) * 100);
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      setTimerDisplay(
        `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      );
    };

    tick();
    countdownIntervalRef.current = setInterval(tick, 500);
  }, [triggerAlarm]);

  const handleAddTask = useCallback((name, time, repeatable) => {
    const newTasks = [...tasksRef.current, { name, time, repeatable }];
    tasksRef.current = newTasks;
    setTasks(newTasks);
    localStorage.setItem('savedTasks', JSON.stringify(newTasks));
    drawWheel(newTasks);
  }, [drawWheel]);

  const handleBatchImport = useCallback((imported) => {
    const newTasks = [...tasksRef.current, ...imported];
    tasksRef.current = newTasks;
    setTasks(newTasks);
    localStorage.setItem('savedTasks', JSON.stringify(newTasks));
    drawWheel(newTasks);
  }, [drawWheel]);

  const handleRemoveTask = useCallback((index) => {
    const newTasks = tasksRef.current.filter((_, i) => i !== index);
    tasksRef.current = newTasks;
    setTasks(newTasks);
    localStorage.setItem('savedTasks', JSON.stringify(newTasks));
    drawWheel(newTasks);
  }, [drawWheel]);

  const spinWheel = useCallback(() => {
    if (tasksRef.current.length === 0) return;
    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      const ready = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
      ready.then(() => startSilentKeepAlive(ctx));
    }
    stopAudio();
    clearInterval(countdownIntervalRef.current);
    setShowRepeat(false);
    setShowStopBtn(false);

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
        ((spinAngleStart -
          easeOut(spinTime, 0, spinAngleStart, spinTimeTotal)) *
          Math.PI) /
        180;
      drawWheel();
      setTimeout(rotate, 30);
    };
    rotate();
  }, [stopAudio, startTimer, drawWheel, startSilentKeepAlive]);

  const repeatCurrentTask = useCallback(() => {
    if (currentActiveTaskRef.current) {
      stopAudio();
      setShowRepeat(false);
      startTimer(currentActiveTaskRef.current.time * 60);
    }
  }, [stopAudio, startTimer]);

  const handleModalOk = useCallback(() => {
    setShowModal(false);
    stopAudio();
  }, [stopAudio]);

  const startSilentKeepAlive = useCallback((ctx) => {
    if (silentSourceRef.current) return;
    const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = silent;
    source.loop = true;
    source.connect(ctx.destination);
    source.start(0);
    silentSourceRef.current = source;
  }, []);

  const loadCustomAudio = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    customAudioBlobRef.current = URL.createObjectURL(file);
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const ready = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
    ready.then(() => startSilentKeepAlive(ctx));
    file.arrayBuffer().then((buf) =>
      ctx.decodeAudioData(buf).then((decoded) => {
        audioBufferRef.current = decoded;
      })
    );
  }, [startSilentKeepAlive]);

  // Load saved tasks on mount
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
  }, [drawWheel]);

  return (
    <div className="app-container">
      {/* Left: Controls */}
      <div className="controls">
        <div className="brand">
          <div className="brand-icon" />
          <h2>Task Orbit</h2>
        </div>

        <AddTaskForm onAdd={handleAddTask} />
        <BatchImport onImport={handleBatchImport} />

        <p className="section-label">Task List</p>
        <TaskList tasks={tasks} colors={COLORS} onRemove={handleRemoveTask} />

        {showRepeat && (
          <button className="action-btn btn-repeat" onClick={repeatCurrentTask}>
            Repeat Same Task
          </button>
        )}

        <div className="settings-bar">
          <label>Custom Alarm Sound</label>
          <input type="file" accept="audio/*" onChange={loadCustomAudio} />
        </div>
      </div>

      {/* Right: Wheel */}
      <div className="wheel-box">
        <div className="current-task-name">{currentTaskName}</div>
        <WheelCanvas ref={canvasRef} />
        <TimerBlock
          display={timerDisplay}
          progress={timerProgress}
          showStop={showStopBtn}
          onStop={stopTimer}
        />
        <div className="wheel-actions">
          <button className="spin-btn" onClick={spinWheel}>
            SPIN THE WHEEL
          </button>
        </div>
      </div>

      <CompleteModal
        visible={showModal}
        taskName={modalTaskName}
        onOk={handleModalOk}
      />
    </div>
  );
}
