import React, { useState } from 'react';
import { HiChevronRight, HiX, HiSearch } from 'react-icons/hi';

export default function ZeashellCategoryRow({
  categories = [],
  activeCategory = 'all',
  onSelectCategory,
  allCategories = [],
}) {
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalSearch, setModalSearch] = useState('');

  // Top 12 popular categories for the row grid
  const displayedCategories = React.useMemo(() => {
    if (categories.length > 0) return categories.slice(0, 12);
    return [];
  }, [categories]);

  // Full category search filter inside the modal
  const modalFilteredCategories = React.useMemo(() => {
    const list = allCategories.length > 0 ? allCategories : categories;
    if (!modalSearch.trim()) return list;
    const q = modalSearch.toLowerCase().trim();
    return list.filter((cat) => {
      const name = cat.name || cat.title || cat.category_name || '';
      return name.toLowerCase().includes(q);
    });
  }, [allCategories, categories, modalSearch]);

  return (
    <>
      <section className="zeas-blue-category-section" aria-label="Browse by Category">
        <div className="zeas-blue-category-header">
          <h2 className="zeas-blue-section-title">
            <span>Popular Categories in Kerala</span>
          </h2>
          <button
            type="button"
            className="zeas-blue-view-all-btn zeas-blue-see-all-link"
            onClick={() => setShowAllModal(true)}
          >
            All Categories <HiChevronRight size={18} />
          </button>
        </div>

        {/* OLX / Zeashell Style Category Grid */}
        <div className="zeas-blue-category-grid-olx" role="list">
          {displayedCategories.map((cat, idx) => {
            const catName = cat.name || cat.title || cat.category_name;
            const isActive =
              activeCategory !== 'all' &&
              activeCategory.toLowerCase() === (catName || '').toLowerCase();

            return (
              <button
                key={cat.id || idx}
                type="button"
                className={`zeas-blue-category-card ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCategory && onSelectCategory(catName)}
                role="listitem"
                aria-label={catName}
              >
                <div className="zeas-blue-category-icon-box">
                  {cat.icon_url ? (
                    <img
                      src={cat.icon_url}
                      alt={catName}
                      style={{ width: 28, height: 28, objectFit: 'contain' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{cat.icon || '🏪'}</span>
                  )}
                </div>
                <span className="zeas-blue-category-name">{catName}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* All Categories Modal (with Search for all 333 categories) */}
      {showAllModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowAllModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 780,
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="All Categories"
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  All Kerala Categories ({modalFilteredCategories.length})
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
                  Explore verified business categories in Kerala
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                }}
              >
                <HiX size={20} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div style={{ padding: '14px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10,
                  padding: '8px 14px',
                }}
              >
                <HiSearch size={18} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Search among all categories..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: 14,
                    color: '#0f172a',
                  }}
                  autoFocus
                />
                {modalSearch && (
                  <button
                    onClick={() => setModalSearch('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    <HiX size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Categories Grid */}
            <div
              style={{
                padding: '20px 24px',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                gap: 12,
              }}
            >
              {modalFilteredCategories.map((cat, idx) => {
                const rawName = cat.name || cat.title || cat.category_name || '';
                // Ensure name is not a URL
                const catName = rawName.startsWith('http') ? 'Category' : rawName;
                if (!catName || catName === 'Category') return null;

                const isSelected =
                  activeCategory !== 'all' &&
                  activeCategory.toLowerCase() === catName.toLowerCase();

                const iconUrl = cat.icon_url || (typeof cat.icon === 'string' && cat.icon.startsWith('http') ? cat.icon : '');
                const emojiIcon = !iconUrl && typeof cat.icon === 'string' && cat.icon.length <= 4 ? cat.icon : '🏷️';

                return (
                  <button
                    key={cat.id || idx}
                    type="button"
                    onClick={() => {
                      onSelectCategory && onSelectCategory(catName);
                      setShowAllModal(false);
                    }}
                    style={{
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      border: isSelected ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt=""
                        style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{emojiIcon}</span>
                    )}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? '#2563eb' : '#1e293b',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {catName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
