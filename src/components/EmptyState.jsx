import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'Nothing here yet.' }) {
  return (
    <div className="state-container">
      <div className="state-icon">
        <Inbox size={26} />
      </div>
      <p className="state-title">All clear</p>
      <p className="state-message">{message}</p>
    </div>
  );
}