import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-notification toast-${t.type}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 18px',
            borderRadius: '10px',
            background: t.type === 'error' ? '#fef2f2' : t.type === 'success' ? '#f0fdf4' : '#f8fafc',
            border: `1px solid ${t.type === 'error' ? '#f87171' : t.type === 'success' ? '#4ade80' : '#cbd5e1'}`,
            color: t.type === 'error' ? '#991b1b' : t.type === 'success' ? '#166534' : '#1e293b',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            minWidth: '280px',
            maxWidth: '420px',
            fontSize: '14px',
            fontWeight: 500,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          {t.type === 'error' && <AlertCircle size={18} color="#dc2626" />}
          {t.type === 'success' && <CheckCircle2 size={18} color="#16a34a" />}
          {t.type === 'info' && <Info size={18} color="#2563eb" />}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
