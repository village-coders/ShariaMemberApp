import React, { useEffect, useState, useContext, useMemo } from 'react';
import { getLogsheets } from '../api/logsheets';
import LogsheetListItem from '../components/LogsheetListItem';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { AuthContext } from '../context/AuthContext';
import { Search, X } from 'lucide-react';

const PAGE_SIZE = 10;

export default function NewLogsheets() {
  const { user } = useContext(AuthContext);
  const [logsheets, setLogsheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    // Ask backend specifically for logsheets with Waiting for Signature to optimize payload size
    getLogsheets({ status: 'Waiting for Signature,waiting for signature,Waiting For Signature,waiting_for_signature,Waiting_For_Signature' })
      .then(res => {
        const all = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);

        const newSheets = all.filter(l => {
          const statusLower = (l.status || '').toLowerCase().replace(/_/g, ' ').trim();
          return statusLower.includes('waiting for signature');
        });
        setLogsheets(newSheets);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // Client-side search filtering
  const filteredLogsheets = useMemo(() => {
    if (!searchTerm.trim()) return logsheets;
    const term = searchTerm.toLowerCase().trim();
    return logsheets.filter(l => {
      const refNo = (
        l.application_number ||
        l.application_id?.application_number ||
        l.addon_application_id?.application_number ||
        l.applications?.application_number ||
        l.direct_ref ||
        l.kfc_ref ||
        l.legacy_id ||
        (l._id ? `APP-${String(l._id).slice(-6)}` : '')
      ).toLowerCase();
      const company = (l.company_name || l.client_id?.company_name || '').toLowerCase();
      const contact = (l.contact_person || l.client_id?.full_name || '').toLowerCase();
      const auditType = (l.audit_type || '').toLowerCase();
      const category = (l.product_category || '').toLowerCase();
      return refNo.includes(term) || company.includes(term) || contact.includes(term) || auditType.includes(term) || category.includes(term);
    });
  }, [logsheets, searchTerm]);

  // Reset to page 1 on search
  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // Paginated slice
  const paginatedLogsheets = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredLogsheets.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredLogsheets, currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p className="section-heading" style={{ margin: 0 }}>
          {filteredLogsheets.length} logsheet{filteredLogsheets.length !== 1 ? 's' : ''} waiting for signature
        </p>
      </div>

      {/* Search Bar */}
      {logsheets.length > 3 && (
        <div style={{
          position: 'relative',
          marginBottom: 16
        }}>
          <Search size={16} color="var(--text-3)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by ref no, company, contact, or audit type..."
            style={{
              paddingLeft: 36,
              paddingRight: searchTerm ? 36 : 14,
              borderRadius: 10,
              fontSize: 13
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-3)',
                padding: 4,
                display: 'flex'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {filteredLogsheets.length === 0 && (
        <EmptyState
          message={searchTerm ? `No waiting logsheets match "${searchTerm}".` : "No logsheets are waiting for signatures right now."}
        />
      )}

      {/* Paginated List Items */}
      {paginatedLogsheets.map(l => (
        <LogsheetListItem key={l._id} logsheet={l} />
      ))}

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredLogsheets.length}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />
    </div>
  );
}