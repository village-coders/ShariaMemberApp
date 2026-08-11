import React, { useEffect, useState } from 'react';
import { getLogsheets } from '../api/logsheets';
import LogsheetListItem from '../components/LogsheetListItem';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';

export default function ManageLogsheets() {
  const [logsheets, setLogsheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogsheets()
      .then(res => setLogsheets(res.data || res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (logsheets.length === 0) return <EmptyState message="No logsheets found." />;

  return (
    <div>
      <p className="section-heading">{logsheets.length} total logsheet{logsheets.length !== 1 ? 's' : ''}</p>
      {logsheets.map(l => <LogsheetListItem key={l._id} logsheet={l} />)}
    </div>
  );
}