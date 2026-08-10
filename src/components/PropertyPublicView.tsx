import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDemoTenant, DEMO_TENANTS, type DemoProperty } from '../lib/demoData';
import { SEO } from './SEO';

export default function PropertyPublicView() {
  const { tenantId = 'demo-001', propId } = useParams();
  const navigate = useNavigate();

  const tenant = getDemoTenant(tenantId) || DEMO_TENANTS['demo-001'];
  const property: DemoProperty =
    tenant.properties.find((p) => p.id === propId) || tenant.properties[0];

  const [applied, setApplied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    moveInDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070a11',
      color: '#f1f5f9',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      paddingBottom: 60,
    }}>
      <SEO
        title={`${property.name} — Public Tenant Portal`}
        description={`Mobile-optimized tenant passport and viewing portal for ${property.name}.`}
      />

      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderBottom: '1px solid rgba(57,191,246,0.2)',
        padding: '20px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 4px 12px rgba(56,189,248,0.3)',
            }}>
              🏢
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                easyTenancy Mobile Passport
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>
                {property.name}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/app/demo')}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ← Portal
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px' }}>
        
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(30,41,59,0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div>
              <span style={{
                background: 'rgba(16,185,129,0.15)',
                color: '#10b981',
                border: '1px solid rgba(16,185,129,0.3)',
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 20,
                display: 'inline-block',
                marginBottom: 8,
              }}>
                ✓ Certified Verified Property
              </span>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#ffffff' }}>
                {property.name}
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
                Property ID: {property.id} · Managed by {tenant.name} ({tenant.country})
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginTop: 16,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 12,
            padding: 12,
            border: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Total Units</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{property.units}</div>
            </div>
            <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Occupancy</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', marginTop: 2 }}>{property.occupancy}%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Collections</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa', marginTop: 2 }}>{property.collections}%</div>
            </div>
          </div>
        </motion.div>

        {/* Property Features & Compliance Specs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'rgba(30,41,59,0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span> Property Compliance & Key Metrics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>Last Compliance Audit</div>
              <div style={{ color: '#f1f5f9', fontWeight: 600, marginTop: 2 }}>{property.lastCompliance}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>Safety Rating</div>
              <div style={{ color: '#10b981', fontWeight: 700, marginTop: 2 }}>Grade A (HHSRS Passed)</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>Energy Rating (EPC)</div>
              <div style={{ color: '#38bdf8', fontWeight: 700, marginTop: 2 }}>EPC Band B (Net Zero Ready)</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: 11 }}>Maintenance Status</div>
              <div style={{ color: '#a78bfa', fontWeight: 600, marginTop: 2 }}>0 Critical Tickets</div>
            </div>
          </div>
        </motion.div>

        {/* Public Tenant Application / Viewing Inquiry Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'rgba(30,41,59,0.85)',
            border: '1px solid rgba(56,189,248,0.3)',
            borderRadius: 18,
            padding: 22,
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          }}
        >
          <h3 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📝</span> Direct Tenant Application / Viewing Request
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: 12, color: '#94a3b8' }}>
            Submit your details directly to {tenant.name}'s property management team.
          </p>

          {applied ? (
            <div style={{
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid rgba(16,185,129,0.3)',
              borderRadius: 12,
              padding: 16,
              textAlign: 'center',
              color: '#34d399',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Application Received!</div>
              <div style={{ fontSize: 12, marginTop: 4, color: '#cbd5e1' }}>
                Thank you, {formData.name || 'Applicant'}. The leasing manager for {property.name} will contact you shortly at {formData.email || 'your email'}.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#f1f5f9',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="sarah@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#f1f5f9',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Phone Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="+44 7700 900077"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#f1f5f9',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Preferred Move-in Date</label>
                <input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#f1f5f9',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>Notes or Questions</label>
                <textarea
                  rows={3}
                  placeholder="Inquiring about 2-bedroom units or parking availability..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#f1f5f9',
                    fontSize: 13,
                    boxSizing: 'border-box',
                    resize: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  marginTop: 6,
                  padding: '12px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(56,189,248,0.35)',
                }}
              >
                Submit Application Inquiry
              </button>
            </form>
          )}
        </motion.div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 11, color: '#64748b' }}>
          easyTenancy™ Mobile QR Passport System · Powered by Novita AI & Cloudflare Edge
        </div>
      </div>
    </div>
  );
}
