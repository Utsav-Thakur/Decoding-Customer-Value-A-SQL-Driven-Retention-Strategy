import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Search, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function CustomerDirectory() {
  const { customers, isLoading } = useData();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All');
  const [subFilter, setSubFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [sortBy, setSortBy] = useState('customer_id');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  // Expanded customer rows state
  const [expandedId, setExpandedId] = useState(null);

  // Sorting columns configuration
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filtered and sorted data
  const processedCustomers = useMemo(() => {
    if (!customers) return [];

    let result = [...customers];

    // Search query match
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      result = result.filter(c => 
        String(c.customer_id).includes(q) ||
        (c.item_purchased && c.item_purchased.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.color && c.color.toLowerCase().includes(q))
      );
    }

    // Tier filter
    if (tierFilter !== 'All') {
      result = result.filter(c => c.value_tier === tierFilter);
    }

    // Subscription status filter
    if (subFilter !== 'All') {
      result = result.filter(c => c.subscription_status === subFilter);
    }

    // Churn Risk filter
    if (riskFilter !== 'All') {
      const wantRisk = riskFilter === 'Yes';
      result = result.filter(c => {
        const isRisk = c.churn_risk === true || c.churn_risk === 1;
        return isRisk === wantRisk;
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, search, tierFilter, subFilter, riskFilter, sortBy, sortOrder]);

  // Paginated chunk
  const paginatedCustomers = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return processedCustomers.slice(startIdx, startIdx + rowsPerPage);
  }, [processedCustomers, currentPage]);

  const totalPages = Math.ceil(processedCustomers.length / rowsPerPage) || 1;

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Platinum': return <span className="badge-platinum">Platinum</span>;
      case 'Gold': return <span className="badge-gold">Gold</span>;
      case 'Silver': return <span className="badge-silver">Silver</span>;
      default: return <span className="badge-bronze">Bronze</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full fade-up">
        <div className="skeleton" style={{ height: '40px', width: '250px' }} />
        <div className="skeleton" style={{ height: '50px' }} />
        <div className="skeleton" style={{ height: '400px' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 fade-up w-full">
      {/* Header */}
      <div>
        <h1 className="heading-serif mb-2" style={{ fontSize: '32px', margin: 0, color: 'var(--burgundy)' }}>
          Customer Database
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
          Inspect individual shopper metrics, custom formulas, and risk parameters
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="premium-card p-4 flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-2 flex-grow" style={{ background: 'var(--bg-2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Search by ID, item, location, category..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                fontSize: '13px',
                color: 'var(--text-primary)',
                width: '100%'
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} color="var(--text-secondary)" />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginRight: '8px' }}>
              Filters:
            </span>
          </div>

          {/* Tier Dropdown */}
          <div className="flex flex-col">
            <select
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value); setCurrentPage(1); }}
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '13px', width: '130px', cursor: 'pointer' }}
            >
              <option value="All">All Tiers</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Bronze">Bronze</option>
            </select>
          </div>

          {/* Sub Dropdown */}
          <div className="flex flex-col">
            <select
              value={subFilter}
              onChange={(e) => { setSubFilter(e.target.value); setCurrentPage(1); }}
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '13px', width: '130px', cursor: 'pointer' }}
            >
              <option value="All">All Subs</option>
              <option value="Yes">Subscribed</option>
              <option value="No">Not Subscribed</option>
            </select>
          </div>

          {/* Risk Dropdown */}
          <div className="flex flex-col">
            <select
              value={riskFilter}
              onChange={(e) => { setRiskFilter(e.target.value); setCurrentPage(1); }}
              className="form-input"
              style={{ padding: '8px 12px', fontSize: '13px', width: '130px', cursor: 'pointer' }}
            >
              <option value="All">All Risks</option>
              <option value="Yes">Churn Risk</option>
              <option value="No">Healthy</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>Showing <strong>{processedCustomers.length.toLocaleString()}</strong> results match your filters</span>
          {processedCustomers.length > 0 && (
            <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          )}
        </div>
      </div>

      {/* Database Table */}
      <div className="premium-card overflow-hidden">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', userSelect: 'none' }}>
              <th onClick={() => handleSort('customer_id')} style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--burgundy)' }}>
                Customer ID {sortBy === 'customer_id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('age')} style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--burgundy)' }}>
                Age / Gender {sortBy === 'age' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('value_tier')} style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--burgundy)' }}>
                Value Tier {sortBy === 'value_tier' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('location')} style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--burgundy)' }}>
                Location {sortBy === 'location' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('item_purchased')} style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--burgundy)' }}>
                Purchase {sortBy === 'item_purchased' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('purchase_amount')} style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--burgundy)', textAlign: 'right' }}>
                Spend {sortBy === 'purchase_amount' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('previous_purchases')} style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--burgundy)', textAlign: 'right' }}>
                Prev Orders {sortBy === 'previous_purchases' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th onClick={() => handleSort('loyalty_score')} style={{ padding: '12px 16px', cursor: 'pointer', color: 'var(--burgundy)', textAlign: 'right' }}>
                Loyalty Score {sortBy === 'loyalty_score' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }} className="heading-serif">
                  No customers found matching the search parameters.
                </td>
              </tr>
            ) : (
              paginatedCustomers.map((c) => {
                const isExpanded = expandedId === c.customer_id;
                const hasChurnRisk = c.churn_risk === true || c.churn_risk === 1;
                return (
                  <React.Fragment key={c.customer_id}>
                    <tr 
                      onClick={() => toggleExpand(c.customer_id)}
                      className="cursor-pointer"
                      style={{ 
                        borderBottom: '1px solid var(--border)',
                        background: isExpanded ? 'var(--card-warm)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = '#faf7f2'; }}
                      onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '14px 16px', fontWeight: '600' }}>#{c.customer_id}</td>
                      <td style={{ padding: '14px 16px' }}>{c.age} y/o • {c.gender}</td>
                      <td style={{ padding: '14px 16px' }}>{getTierBadge(c.value_tier)}</td>
                      <td style={{ padding: '14px 16px' }}>{c.location}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '500' }}>{c.item_purchased}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.category}</div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>
                        ${c.purchase_amount}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>{c.previous_purchases}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div className="flex items-center justify-end gap-2">
                          <span style={{ fontWeight: '600', color: 'var(--burgundy)' }}>
                            {(c.loyalty_score || 0).toFixed(2)}
                          </span>
                          <div style={{ width: '40px', height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (c.loyalty_score || 0) * 100)}%`, height: '100%', background: 'var(--burgundy)' }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {isExpanded ? <ChevronUp size={16} color="var(--burgundy)" /> : <ChevronDown size={16} color="var(--text-secondary)" />}
                      </td>
                    </tr>

                    {/* Expandable Details Area */}
                    {isExpanded && (
                      <tr style={{ background: '#fffdfb' }}>
                        <td colSpan={9} style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                          <div className="grid grid-cols-4 gap-6">
                            {/* Stats block */}
                            <div className="flex flex-col gap-2">
                              <span className="form-label" style={{ fontSize: '10px' }}>Purchase Attributes</span>
                              <div style={{ fontSize: '13px' }}>
                                <strong>Size/Color:</strong> {c.size} / {c.color}<br />
                                <strong>Shipping:</strong> {c.shipping_type}<br />
                                <strong>Payment:</strong> {c.payment_method}<br />
                                <strong>Frequency:</strong> {c.frequency_of_purchases} (Score: {c.frequency_score})
                              </div>
                            </div>

                            {/* Scores block */}
                            <div className="flex flex-col gap-2">
                              <span className="form-label" style={{ fontSize: '10px' }}>Formulas & Metrics</span>
                              <div style={{ fontSize: '13px' }}>
                                <strong>Promo Dependency:</strong> {(c.promo_dependency_score || 0).toFixed(2)}<br />
                                <strong>Spend Efficiency:</strong> ${(c.spend_efficiency || 0).toFixed(2)}<br />
                                <strong>Loyalty V1 Score:</strong> {(c.loyalty_v1 || 0).toFixed(3)}<br />
                                <strong>Loyalty V2 Score:</strong> {(c.loyalty_v2 || 0).toFixed(3)}
                              </div>
                            </div>

                            {/* Segments flags */}
                            <div className="flex flex-col gap-2">
                              <span className="form-label" style={{ fontSize: '10px' }}>Segment Badges</span>
                              <div className="flex flex-wrap gap-2">
                                {c.subscriber === 1 && <span className="badge-loyal">Subscribed</span>}
                                {c.satisfaction_flag ? <span className="badge-loyal" style={{ background: '#d4edda', color: '#2d6a4f' }}>Satisfied Rating</span> : <span className="badge-risk">Rating &lt; 4.0</span>}
                                {c.high_value_no_promo && <span className="badge-platinum" style={{ borderStyle: 'dashed' }}>High Value No Promo</span>}
                                {c.promo_trap && <span className="badge-promo">Promo Trap</span>}
                                {hasChurnRisk && <span className="badge-risk" style={{ fontWeight: '600' }}>Churn Risk</span>}
                              </div>
                            </div>

                            {/* Cognitive summary */}
                            <div className="flex flex-col gap-2">
                              <span className="form-label" style={{ fontSize: '10px' }}>Strategic Recommendation</span>
                              <div 
                                className="p-3" 
                                style={{ 
                                  background: hasChurnRisk ? '#fdf5f6' : 'var(--bg-2)', 
                                  borderRadius: '8px', 
                                  fontSize: '11px',
                                  lineHeight: '1.4',
                                  borderLeft: `3px solid ${hasChurnRisk ? 'var(--danger)' : 'var(--gold)'}`
                                }}
                              >
                                {hasChurnRisk ? (
                                  <span style={{ color: 'var(--danger)' }}>
                                    <strong>Alert:</strong> Shopper exhibits low rating and discount reliance. Restructure engagement to prevent churn.
                                  </span>
                                ) : c.high_value_no_promo ? (
                                  <span style={{ color: 'var(--burgundy)' }}>
                                    <strong>Loyalty Play:</strong> High tier buyer shopping at full price. Offer exclusive previews and free shipping.
                                  </span>
                                ) : c.promo_trap ? (
                                  <span style={{ color: 'var(--warning)' }}>
                                    <strong>Promo Play:</strong> Trapped in discount reliance. Transition order behaviors with early size releases instead of coupons.
                                  </span>
                                ) : (
                                  <span style={{ color: 'var(--text-secondary)' }}>
                                    <strong>Nurture Play:</strong> Standard premium shopper. Maintain regular brand campaigns.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div 
          className="flex justify-between items-center p-4" 
          style={{ 
            background: 'var(--bg-2)', 
            borderTop: '1px solid var(--border)',
            fontSize: '13px'
          }}
        >
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              First
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Previous
            </button>
          </div>

          <div style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Next
            </button>
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              Last
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
