import { useState, useEffect } from 'react';
import { listCustomizationOptions, createCustomizationOption, updateCustomizationOption, deleteCustomizationOption } from '../data/customization';

export default function CustomizationPage() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ category: '', option_name: '', estimate: 0, display_order: 0, visible: true });
  const [error, setError] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    setLoading(true);
    const data = await listCustomizationOptions();
    setOptions(data);
    setLoading(false);
  }

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.category || !formData.option_name) {
      setError('Category and option name are required');
      return;
    }

    const result = await createCustomizationOption(formData);
    if (result.success) {
      setFormData({ category: '', option_name: '', estimate: 0, display_order: 0, visible: true });
      await loadOptions();
    } else {
      setError(result.error);
    }
  };

  const handleEdit = (option) => {
    setEditingId(option.id);
    setFormData({
      category: option.category,
      option_name: option.option_name,
      estimate: option.estimate,
      display_order: option.display_order,
      visible: option.visible
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await updateCustomizationOption(editingId, formData);
    if (result.success) {
      setEditingId(null);
      setFormData({ category: '', option_name: '', estimate: 0, display_order: 0, visible: true });
      await loadOptions();
    } else {
      setError(result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this option?')) return;
    
    const result = await deleteCustomizationOption(id);
    if (result.success) {
      await loadOptions();
    } else {
      setError(result.error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ category: '', option_name: '', estimate: 0, display_order: 0, visible: true });
    setError('');
  };

  // Group options by category
  const grouped = options.reduce((acc, opt) => {
    if (!acc[opt.category]) acc[opt.category] = [];
    acc[opt.category].push(opt);
    return acc;
  }, {});

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Customization Options</h1>
        <p style={{ color: '#666', margin: 0 }}>Manage options for the storefront gift builder</p>
      </header>

      {error && (
        <div style={{ 
          padding: '12px 16px', 
          backgroundColor: '#fee2e2', 
          color: '#991b1b', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      <div style={{ 
        backgroundColor: '#fff', 
        padding: '20px', 
        borderRadius: '12px', 
        border: '1px solid #e5e7eb', 
        marginBottom: '30px' 
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>
          {editingId ? 'Edit Option' : 'Add New Option'}
        </h2>
        <form onSubmit={editingId ? handleUpdate : handleAdd}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Category *
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Choose a base, Add gifts"
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Option Name *
              </label>
              <input
                type="text"
                value={formData.option_name}
                onChange={e => setFormData({ ...formData, option_name: e.target.value })}
                placeholder="e.g., Luxury box, Perfume"
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Estimate (GHS)
              </label>
              <input
                type="number"
                value={formData.estimate}
                onChange={e => setFormData({ ...formData, estimate: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                min="0"
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={e => setFormData({ ...formData, visible: e.target.checked })}
              />
              Visible in storefront
            </label>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                backgroundColor: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#fff',
                  color: '#1a1a1a',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Options List */}
      <div>
        {Object.entries(grouped).map(([category, categoryOptions]) => (
          <div key={category} style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#1a1a1a' }}>
              {category}
            </h3>
            <div style={{ 
              backgroundColor: '#fff', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb', 
              overflow: 'hidden' 
            }}>
              {categoryOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: opt.visible ? '#1a1a1a' : '#9ca3af' }}>
                      {opt.option_name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                      GHS {opt.estimate} · Order: {opt.display_order}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      backgroundColor: opt.visible ? '#dcfce7' : '#f3f4f6',
                      color: opt.visible ? '#166534' : '#6b7280'
                    }}>
                      {opt.visible ? 'Visible' : 'Hidden'}
                    </span>
                    <button
                      onClick={() => handleEdit(opt)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#f3f4f6',
                        color: '#1a1a1a',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(opt.id)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
