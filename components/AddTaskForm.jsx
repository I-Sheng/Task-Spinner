'use client';
import { useState, useRef } from 'react';

export default function AddTaskForm({ onAdd }) {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('');
  const [repeatable, setRepeatable] = useState(false);
  const nameRef = useRef(null);

  const handleAdd = () => {
    const trimmed = name.trim();
    const time = parseInt(minutes);
    if (!trimmed) { nameRef.current?.focus(); return; }
    if (!time || time < 1) return;
    onAdd(trimmed, time, repeatable);
    setName('');
    setMinutes('');
    setRepeatable(false);
    nameRef.current?.focus();
  };

  return (
    <details className="collapsible" open>
      <summary className="section-label">Add Task</summary>
      <div className="add-form">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Task name"
          autoFocus
        />
        <div className="form-row">
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Minutes"
            min="1"
          />
          <label className="repeat-label">
            <input
              type="checkbox"
              checked={repeatable}
              onChange={(e) => setRepeatable(e.target.checked)}
            />
            Repeatable
          </label>
        </div>
        <button className="action-btn btn-dark" onClick={handleAdd}>
          + Add Task
        </button>
      </div>
    </details>
  );
}
