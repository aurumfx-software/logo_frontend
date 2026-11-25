import React, { useMemo, useState } from 'react';
import {
  HiPlus,
  HiSearch,
  HiPencil,
  HiTrash,
  HiEye,
  HiExternalLink,
  HiCheckCircle,
  HiExclamationCircle,
  HiMinus,
} from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import {
  updateCustomerProduct,
  addStockToProduct,
  deleteCustomerProduct,
} from '../../api/productApi';
import CustomerAddProductModal from './CustomerAddProductModal';

export default function MyProductsPanel({
  products = [],
  setProducts,
  customerUser,
  onReload,
  setNoticeMsg,
  setErrorMsg,
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'IN_STOCK' | 'OUT_OF_STOCK'
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const checkIsOut = (p) =>
    !p.inStock ||
    String(p.stockStatus || p.stock_status || '').toUpperCase() === 'OUT_OF_STOCK' ||
    (p.stockQuantity !== null && p.stockQuantity !== undefined && Number(p.stockQuantity) <= 0);

  const counts = useMemo(() => {
    let inStock = 0;
    let outOfStock = 0;
    (products || []).forEach((p) => {
      if (checkIsOut(p)) outOfStock += 1;
      else inStock += 1;
    });
    return { all: products.length, inStock, outOfStock };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...(products || [])];
    if (statusFilter === 'IN_STOCK') {
      list = list.filter((p) => !checkIsOut(p));
    } else if (statusFilter === 'OUT_OF_STOCK') {
      list = list.filter((p) => checkIsOut(p));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          String(p.price || '').includes(q)
      );
    }
    return list;
  }, [products, statusFilter, searchQuery]);

  const syncProductInList = (updated) => {
    if (!updated) return;
    setProducts((prev) =>
      prev.map((item) => (String(item.id) === String(updated.id) ? { ...item, ...updated } : item))
    );
  };

  const handleAdjustStock = async (product, delta) => {
    const currentQty =
      product.stockQuantity !== null && product.stockQuantity !== undefined
        ? Number(product.stockQuantity)
        : 10;
    const newQty = Math.max(0, currentQty + delta);
    const newStatus = newQty === 0 ? 'OUT_OF_STOCK' : 'IN_STOCK';
    setActionLoadingId(product.id);
    setErrorMsg('');
    try {
      const updated = await updateCustomerProduct(product.id, {
        stock_quantity: newQty,
        stock_status: newStatus,
      });
      syncProductInList(updated);
      setNoticeMsg(
        newQty === 0
          ? `"${product.name}" marked Out of Stock.`
          : `Stock updated to ${newQty} units for "${product.name}".`
      );
    } catch (err) {
      setErrorMsg(err.message || 'Stock update failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStockStatus = async (product) => {
    const isCurrentlyOut = checkIsOut(product);
    const newStatus = isCurrentlyOut ? 'IN_STOCK' : 'OUT_OF_STOCK';
    const newQty = isCurrentlyOut
      ? product.stockQuantity && Number(product.stockQuantity) > 0
        ? Number(product.stockQuantity)
        : 10
      : 0;
    setActionLoadingId(product.id);
    setErrorMsg('');
    try {
      const updated = await updateCustomerProduct(product.id, {
        stock_status: newStatus,
        stock_quantity: newQty,
      });
      syncProductInList(updated);
      setNoticeMsg(isCurrentlyOut ? `"${product.name}" is back In Stock (${newQty} units).` : `"${product.name}" marked Out of Stock.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update stock status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDirectAddStock = async (product, addQty = 5) => {
    setActionLoadingId(product.id);
    setErrorMsg('');
    try {
      const updated = await addStockToProduct(product.id, addQty);
      syncProductInList(updated);
      setNoticeMsg(`Added +${addQty} units to "${product.name}"!`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to add stock.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleProductLive = async (product) => {
    setActionLoadingId(product.id);
    setErrorMsg('');
    try {
      const updated = await updateCustomerProduct(product.id, { is_active: !product.is_active });
      syncProductInList(updated);
      setNoticeMsg(`"${product.name}" is now ${updated.is_active ? 'Live' : 'Hidden'}.`);
    } catch (err) {
      setErrorMsg(err.message || 'Could not toggle visibility.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;
    setActionLoadingId(product.id);
    setErrorMsg('');
    try {
      await deleteCustomerProduct(product.id);
      setProducts((prev) => prev.filter((item) => String(item.id) !== String(product.id)));
      setNoticeMsg(`"${product.name}" deleted.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete product.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0f172a' }}>
            My Products ({products.length})
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
            Manage listed items, live stock units, pricing, highlights & visibility
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <HiPlus size={16} />
          Create Product
        </button>
      </div>

      {/* Filter Tabs & Search Strip (matches Mobile MyProductsModal) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All (${counts.all})` },
            { key: 'IN_STOCK', label: `In Stock (${counts.inStock})` },
            { key: 'OUT_OF_STOCK', label: `Out of Stock (${counts.outOfStock})` },
          ].map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 999,
                  border: active ? 'none' : '1px solid #e2e8f0',
                  background: active ? '#2563eb' : '#f8fafc',
                  color: active ? '#ffffff' : '#475569',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', minWidth: 230, flex: '0 1 280px' }}>
          <HiSearch size={15} color="#94a3b8" style={{ position: 'absolute', left: 10, top: 10 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, category, price..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 10px 8px 32px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 12.5,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: 14, border: '1px dashed #cbd5e1' }}>
          <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#334155' }}>
            {searchQuery || statusFilter !== 'ALL' ? 'No matching products found.' : 'No products created yet.'}
          </p>
          <p style={{ margin: 0, fontSize: 12.5, color: '#64748b' }}>
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try clearing the search query or filter.'
              : 'Click "+ Create Product" to publish items to Kerala buyers.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredProducts.map((p) => {
            const isOutOfStock = checkIsOut(p);
            const currentStock =
              p.stockQuantity !== null && p.stockQuantity !== undefined ? Number(p.stockQuantity) : 10;
            const isProcessing = actionLoadingId === p.id;
            const thumb = p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300';
            const hlCount = Array.isArray(p.highlights) ? p.highlights.length : 0;
            const detCount = Array.isArray(p.additional_details) ? p.additional_details.length : 0;

            return (
              <div
                key={p.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: 16,
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                }}
              >
                {/* Top Row: Thumbnail + Info */}
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ position: 'relative', width: 92, height: 92, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                    <img
                      src={thumb}
                      alt={p.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {isOutOfStock && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 4 }}>
                        <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, letterSpacing: 0.5 }}>OUT OF STOCK</span>
                      </div>
                    )}
                    {!isOutOfStock && !p.is_active && (
                      <div style={{ position: 'absolute', top: 4, left: 4, background: '#334155', color: '#fff', fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4 }}>
                        HIDDEN
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.category || 'General'}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${p.id}`)}
                        title="Open Public Product Page"
                        style={{ border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer', padding: 2 }}
                      >
                        <HiExternalLink size={16} />
                      </button>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>
                        ₹{Number(p.price || 0).toLocaleString('en-IN')}
                      </span>
                      {p.originalPrice > p.price && (
                        <span style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through' }}>
                          ₹{Number(p.originalPrice).toLocaleString('en-IN')}
                        </span>
                      )}
                      {p.discountPercent > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '1px 6px', borderRadius: 4 }}>
                          {p.discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Stock + Orders Summary Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: isOutOfStock ? '#fef2f2' : '#f0fdf4',
                          color: isOutOfStock ? '#dc2626' : '#15803d',
                        }}
                      >
                        {isOutOfStock ? <HiExclamationCircle size={12} /> : <HiCheckCircle size={12} />}
                        {isOutOfStock ? 'Currently Unavailable (0)' : `In Stock: ${currentStock} units`}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: 6 }}>
                        {p.ordersCount || 0} Orders
                      </span>
                      {Array.isArray(p.sub_products) && p.sub_products.length > 1 && (
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#4338ca', background: '#eef2ff', padding: '2px 8px', borderRadius: 6 }}>
                          {p.sub_products.length - 1} Sub-Product{p.sub_products.length - 1 === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metadata summary line */}
                <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, padding: '6px 10px', background: '#f8fafc', borderRadius: 8 }}>
                  <span>Sizes: {(p.sizes || ['Free Size']).join(', ')}</span>
                  <span>
                    {p.images?.length || 1} Photo{(p.images?.length || 1) > 1 ? 's' : ''}
                    {hlCount > 0 ? ` · ${hlCount} Highlights` : ''}
                    {detCount > 0 ? ` · ${detCount} Details` : ''}
                  </span>
                </div>

                {/* Stock Management Stepper Strip (matches Mobile MyProductsModal) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', marginRight: 2 }}>Stock:</span>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(p, -1)}
                      disabled={isProcessing || currentStock <= 0}
                      style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <HiMinus size={12} />
                    </button>
                    <span style={{ minWidth: 28, textAlign: 'center', fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>
                      {currentStock}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(p, 1)}
                      disabled={isProcessing}
                      style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <HiPlus size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(p, 5)}
                      disabled={isProcessing}
                      style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(p, 10)}
                      disabled={isProcessing}
                      style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1d4ed8', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      +10
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStockStatus(p)}
                    disabled={isProcessing}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: isOutOfStock ? 'none' : '1px solid #fecaca',
                      background: isOutOfStock ? '#16a34a' : '#fef2f2',
                      color: isOutOfStock ? '#ffffff' : '#dc2626',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isOutOfStock ? 'Mark In Stock' : 'Stock Out'}
                  </button>
                </div>

                {/* Add Stock CTA if 0 */}
                {(p.canAddStock || isOutOfStock || currentStock === 0) && (
                  <button
                    type="button"
                    onClick={() => handleDirectAddStock(p, 5)}
                    disabled={isProcessing}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#059669',
                      color: '#ffffff',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <HiPlus size={15} />
                    Add Stock (+5 Units)
                  </button>
                )}

                {/* Card Footer: Edit Details / Live / Delete */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(p)}
                    style={{
                      flex: 1.3,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #bfdbfe',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                    }}
                  >
                    <HiPencil size={14} />
                    Edit Product
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleProductLive(p)}
                    disabled={isProcessing}
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: p.is_active ? '#ecfdf5' : '#f8fafc',
                      color: p.is_active ? '#15803d' : '#64748b',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <HiEye size={14} />
                    {p.is_active ? 'Live' : 'Hidden'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p)}
                    disabled={isProcessing}
                    title="Delete Product"
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#fee2e2',
                      color: '#dc2626',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <HiTrash size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Full-Screen Product Modal */}
      <CustomerAddProductModal
        isOpen={isCreateOpen || Boolean(editingProduct)}
        initialProduct={editingProduct}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingProduct(null);
        }}
        customerUser={customerUser}
        onProductCreated={() => {
          setNoticeMsg('Product created successfully!');
          setIsCreateOpen(false);
          if (onReload) onReload();
        }}
        onProductUpdated={(updated) => {
          setNoticeMsg('Product updated successfully!');
          if (updated) syncProductInList(updated);
          setEditingProduct(null);
          if (onReload) onReload();
        }}
      />
    </div>
  );
}
