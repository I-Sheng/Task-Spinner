'use client';

export default function CompleteModal({ visible, taskName, onOk }) {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-icon">🎉</div>
        <h3>Task Complete!</h3>
        <p className="modal-task-name">{taskName}</p>
        <button className="modal-ok" onClick={onOk}>
          OK
        </button>
      </div>
    </div>
  );
}
