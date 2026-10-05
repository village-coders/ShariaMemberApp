import React, { useEffect, useState, useMemo } from 'react';
import { getLogsheets } from '../api/logsheets';
import LogsheetListItem from '../components/LogsheetListItem';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import { Search, X } from 'lucide-react';

const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Waiting Signature', value: 'waiting' },
  { label: 'Signed', value: 'signed' },
  { label: 'Completed', value: 'completed' },
];

export default function ManageLogsheets() {
  const [logsheets, setLogsheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch logsheets on mount or when status changes
  useEffect(() => {
    setLoading(true);
    let params = {};
    if (selectedStatus === 'waiting') {
      params.status = 'Waiting for Signature,waiting for signature,Waiting For Signature,waiting_for_signature,Waiting_For_Signature';
    } else if (selectedStatus === 'signed') {
      params.status = 'Signed,signed';
    } else if (selectedStatus === 'completed') {
      params.status = 'Completed,completed';
    }

    getLogsheets(params)
      .then(res => {
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        setLogsheets(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedStatus]);

  // Client-side search and status refinement
  const filteredLogsheets = useMemo(() => {
    return logsheets.filter(l => {
      // 1. Status match (if not already filtered by backend)
      if (selectedStatus !== 'all') {
        const statusLower = (l.status || '').toLowerCase().replace(/_/g, ' ').trim();
        if (selectedStatus === 'waiting' && !statusLower.includes('waiting for signature')) {
          return false;
        }
        if (selectedStatus === 'signed' && !statusLower.includes('signed')) {
          return false;
        }
        if (selectedStatus === 'completed' && !statusLower.includes('completed')) {
          return false;
        }
      }

      // 2. Search match
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const company = (l.company_name || l.client_id?.company_name || '').toLowerCase();
        const contact = (l.contact_person || l.client_id?.full_name || '').toLowerCase();
        const auditType = (l.audit_type || '').toLowerCase();
        const category = (l.product_category || '').toLowerCase();
        return company.includes(term) || contact.includes(term) || auditType.includes(term) || category.includes(term);
      }

      return true;
    });
  }, [logsheets, selectedStatus, searchTerm]);

  // Handle status tab change
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // Handle search change
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p className="section-heading" style={{ margin: 0 }}>
          {filteredLogsheets.length} total logsheet{filteredLogsheets.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        overflowX: 'auto',
        paddingBottom: 8,
        marginBottom: 12,
        WebkitOverflowScrolling: 'touch'
      }}>
        {STATUS_FILTERS.map(f => {
          const isActive = selectedStatus === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => handleStatusChange(f.value)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: isActive ? 'var(--primary-subtle)' : '#ffffff',
                color: isActive ? 'var(--primary)' : 'var(--text-2)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
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
          placeholder="Search by company, contact, or audit..."
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

      {/* Loading state */}
      {loading && <LoadingState />}

      {/* Empty State */}
      {!loading && filteredLogsheets.length === 0 && (
        <EmptyState
          message={searchTerm ? `No logsheets match "${searchTerm}".` : "No logsheets found."}
        />
      )}

      {/* Paginated List */}
      {!loading && paginatedLogsheets.map(l => (
        <LogsheetListItem key={l._id} logsheet={l} />
      ))}

      {/* Pagination component */}
      {!loading && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredLogsheets.length}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}