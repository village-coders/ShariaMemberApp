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
        const all = res.data || res;

        // Get user's saved signature details from localStorage
        const storedSig = localStorage.getItem('my_signature');
        let myName = user?.full_name || '';
        if (storedSig) {
          try {
            const parsed = JSON.parse(storedSig);
            if (parsed?.name) {
              myName = parsed.name;
            }
          } catch (_) {}
        }

        const newSheets = all.filter(l => {
          // Exclude fully finalized or certificate-waiting logsheets
          const statusLower = l.status?.toLowerCase() || '';
          const isCompleted = 
            statusLower.includes('waiting for certificate') || 
            statusLower.includes('completed');

          if (isCompleted) return false;

          // Count signatures
          const totalSigned = [l.mufti_signature, l.mufti2_signature, l.manager_signature, l.ceo_signature].filter(Boolean).length;
          const isNotFullySigned = totalSigned < 4;

          // Check if the current user has signed
          const signedNames = [
            l.mufti_sign_name,
            l.mufti2_sign_name,
            l.manager_sign_name,
            l.ceo_sign_name
          ].map(n => n?.toLowerCase()?.trim());

          const hasUserSigned = signedNames.some(name => 
            name && (
              name === myName.toLowerCase().trim() || 
              name === user?.full_name?.toLowerCase()?.trim()
            )
          );

          return !hasUserSigned || isNotFullySigned;
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
      <p className="section-heading">{logsheets.length} logsheet{logsheets.length !== 1 ? 's' : ''} in progress</p>
      {logsheets.map(l => <LogsheetListItem key={l._id} logsheet={l} />)}
    </div>
  );
}