import React from 'react';

export default function LoadingState() {
  return (
    <div className="state-container">
      <div className="state-icon">
        <span className="spinner spinner-dark" style={{ width: 26, height: 26, borderWidth: 3 }} />
      </div>
      <p className="state-message">Loading, please wait…</p>
    </div>
  );
}