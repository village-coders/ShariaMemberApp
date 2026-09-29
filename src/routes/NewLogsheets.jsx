import React, { useEffect, useState, useContext } from 'react';
import { getLogsheets } from '../api/logsheets';
import LogsheetListItem from '../components/LogsheetListItem';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { AuthContext } from '../context/AuthContext';

export default function NewLogsheets() {
  const { user } = useContext(AuthContext);
  const [logsheets, setLogsheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLogsheets()
      .then(res => {
        const all = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

        const newSheets = all.filter(l => {
          const statusLower = (l.status || '').toLowerCase().replace(/_/g, ' ').trim();
          return statusLower === 'waiting for signature' || statusLower.includes('waiting for signature');
        });
        setLogsheets(newSheets);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <LoadingState />;
  if (logsheets.length === 0) return <EmptyState message="No logsheets are waiting for signatures right now." />;

  return (
    <div>
      <p className="section-heading">{logsheets.length} logsheet{logsheets.length !== 1 ? 's' : ''} waiting for signature</p>
      {logsheets.map(l => <LogsheetListItem key={l._id} logsheet={l} />)}
    </div>
  );
}