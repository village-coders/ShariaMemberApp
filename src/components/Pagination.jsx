import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  if (totalItems <= pageSize && currentPage === 1) {
    return null;
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to show (smart window around current page)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, start + maxVisible - 1);

      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div style={{
      marginTop: 20,
      marginBottom: 20,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12
    }}>
      {/* Items count summary */}
      <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
        Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong>
      </span>

      {/* Navigation Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        {/* Prev button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: '#ffffff',
            color: currentPage <= 1 ? 'var(--text-3)' : 'var(--text-1)',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.4 : 1,
            transition: 'all 0.15s ease'
          }}
          aria-label="Previous Page"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Page pills */}
        {pages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              style={{
                minWidth: 36,
                height: 36,
                padding: '0 8px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: '#ffffff',
                color: 'var(--text-2)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              1
            </button>
            {pages[0] > 2 && (
              <span style={{ color: 'var(--text-3)', fontSize: 12, padding: '0 2px' }}>…</span>
            )}
          </>
        )}

        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              style={{
                minWidth: 36,
                height: 36,
                padding: '0 8px',
                borderRadius: 8,
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: isActive ? 'var(--primary)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-2)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {p}
            </button>
          );
        })}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span style={{ color: 'var(--text-3)', fontSize: 12, padding: '0 2px' }}>…</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              style={{
                minWidth: 36,
                height: 36,
                padding: '0 8px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: '#ffffff',
                color: 'var(--text-2)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: '#ffffff',
            color: currentPage >= totalPages ? 'var(--text-3)' : 'var(--text-1)',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            transition: 'all 0.15s ease'
          }}
          aria-label="Next Page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
