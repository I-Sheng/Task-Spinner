'use client';

export default function TaskList({ tasks, colors, onRemove }) {
  if (tasks.length === 0) {
    return <div className="task-list-display task-list-empty">No tasks yet</div>;
  }

  return (
    <div className="task-list-display">
      {tasks.map((t, i) => (
        <div
          key={i}
          className="list-item"
          style={{ borderLeftColor: colors[i % colors.length] }}
        >
          <span>
            <strong>{t.name}</strong>
            {t.repeatable && <span className="repeat-badge">↺</span>}{' '}
            <span className="task-duration">{t.time}m</span>
          </span>
          <button className="del-x" onClick={() => onRemove(i)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
