'use client';
import { useState } from 'react';

export default function BatchImport({ onImport }) {
  const [text, setText] = useState('');

  const handleImport = () => {
    const imported = [];
    text.trim().split('\n').forEach((line) => {
      const parts = line.split(',');
      if (parts.length < 2) return;
      const name = parts[0].trim();
      const time = parseInt(parts[1].trim());
      if (!name || !time || time < 1) return;
      const repeatable = parts[2]?.trim().toLowerCase() === 'true';
      imported.push({ name, time, repeatable });
    });
    if (imported.length > 0) {
      onImport(imported);
      setText('');
    }
  };

  return (
    <details className="collapsible">
      <summary className="section-label">Batch Import</summary>
      <div className="batch-area">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Task name, minutes\nRead emails, 15\nDeep work, 45\nExercise, 30'}
        />
        <button className="action-btn btn-secondary" onClick={handleImport}>
          Import All
        </button>
      </div>
    </details>
  );
}
