'use client';

export default function TimerBlock({ display, progress, showStop, onStop }) {
  const barColor = progress < 20 ? 'var(--secondary)' : 'var(--primary)';

  return (
    <div className="timer-block">
      <div className="timer-display">{display}</div>
      <div className="timer-bar-wrap">
        <div
          className="timer-bar"
          style={{ width: `${progress}%`, background: barColor }}
        />
      </div>
      {showStop && (
        <button className="stop-btn" onClick={onStop}>
          STOP
        </button>
      )}
    </div>
  );
}
