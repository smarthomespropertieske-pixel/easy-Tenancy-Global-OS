// ════════════════════════════════════════════════════════════════════════
//  propertyAuditLogger.ts — Firestore Property Audit Trail Engine
//  ─────────────────────────────────────────────────────────────────────
//  • Fetches and logs property-level audit events to Firestore
//  • Provides real-time stream subscription via onSnapshot
//  • Seeds initial property compliance, lease, finance & maintenance events
// ════════════════════════════════════════════════════════════════════════

import { db, handleFirestoreError, OperationType } from './firebase'
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs
} from 'firebase/firestore'
import { DemoProperty } from './demoData'

export interface PropertyAuditEvent {
  id?: string
  uid: string
  propertyId: string
  propertyName: string
  action: string
  category: 'compliance' | 'finance' | 'lease' | 'maintenance' | 'security'
  severity: 'info' | 'warning' | 'success' | 'critical'
  details: string
  actor: string
  timestamp: string // ISO string
  createdAt: number
}

const LOCAL_STORAGE_PROPERTY_AUDITS_KEY = 'easytenancy_property_audit_events'

/**
 * Log a new property audit event to Firestore ('property_audits' collection)
 */
export async function logPropertyAuditEvent(
  event: Omit<PropertyAuditEvent, 'id' | 'timestamp' | 'createdAt'>
): Promise<void> {
  const timestamp = new Date().toISOString()
  const createdAt = Date.now()

  const docData: Omit<PropertyAuditEvent, 'id'> = {
    ...event,
    timestamp,
    createdAt
  }

  // 1. Try Firestore write
  try {
    const colRef = collection(db, 'property_audits')
    await addDoc(colRef, docData)
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'property_audits')
  }

  // 2. Local storage cache fallback
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_PROPERTY_AUDITS_KEY) || '[]'
    const existing: PropertyAuditEvent[] = JSON.parse(existingStr)
    const newLog: PropertyAuditEvent = { id: `local_${Date.now()}`, ...docData }
    const updated = [newLog, ...existing].slice(0, 100)
    localStorage.setItem(LOCAL_STORAGE_PROPERTY_AUDITS_KEY, JSON.stringify(updated))
  } catch {
    // Ignore cache error
  }
}

/**
 * Subscribe to real-time property audit events for a given user or user's properties
 */
export function subscribeToPropertyAudits(
  uid: string,
  callback: (events: PropertyAuditEvent[]) => void,
  maxResults: number = 25
): () => void {
  const activeUid = uid || 'guest_user'

  try {
    const colRef = collection(db, 'property_audits')
    // Query property_audits by uid or global fallback
    const q = query(
      colRef,
      where('uid', 'in', [activeUid, 'global_demo', 'all_users']),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const events: PropertyAuditEvent[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            uid: data.uid || activeUid,
            propertyId: data.propertyId || 'prop_default',
            propertyName: data.propertyName || 'Property Asset',
            action: data.action || 'Audit Record',
            category: data.category || 'compliance',
            severity: data.severity || 'info',
            details: data.details || '',
            actor: data.actor || 'System Audit',
            timestamp: data.timestamp || new Date().toISOString(),
            createdAt: data.createdAt || Date.now()
          }
        })

        if (events.length > 0) {
          callback(events)
        } else {
          // Fallback to local cache if query returned empty
          fetchLocalAuditFallback(activeUid, callback)
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'property_audits')
        fetchLocalAuditFallback(activeUid, callback)
      }
    )

    return unsubscribe
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'property_audits')
    fetchLocalAuditFallback(activeUid, callback)
    return () => {}
  }
}

function fetchLocalAuditFallback(
  uid: string,
  callback: (events: PropertyAuditEvent[]) => void
) {
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_PROPERTY_AUDITS_KEY) || '[]'
    const localLogs: PropertyAuditEvent[] = JSON.parse(existingStr)
    const filtered = localLogs.filter((l) => l.uid === uid || l.uid === 'guest_user' || l.uid === 'global_demo')
    callback(filtered)
  } catch {
    callback([])
  }
}

/**
 * Seed initial audit events into Firestore for user's properties if collection is empty
 */
export async function seedInitialPropertyAudits(
  uid: string,
  properties: DemoProperty[]
): Promise<void> {
  const activeUid = uid || 'guest_user'

  try {
    const colRef = collection(db, 'property_audits')
    const q = query(colRef, where('uid', '==', activeUid), limit(1))
    const snapshot = await getDocs(q)

    if (!snapshot.empty) return // Already seeded

    const now = Date.now()
    const sampleAudits: Omit<PropertyAuditEvent, 'id'>[] = properties.flatMap((p, idx) => [
      {
        uid: activeUid,
        propertyId: p.id,
        propertyName: p.name,
        action: 'EPC Compliance Verification',
        category: 'compliance',
        severity: p.status === 'critical' ? 'critical' : p.status === 'warning' ? 'warning' : 'success',
        details: `Energy Performance Certificate status validated for ${p.units} units. Compliance date: ${p.lastCompliance}.`,
        actor: 'ComplyCore AI Inspector',
        timestamp: new Date(now - (idx * 3600000 + 900000)).toISOString(),
        createdAt: now - (idx * 3600000 + 900000)
      },
      {
        uid: activeUid,
        propertyId: p.id,
        propertyName: p.name,
        action: 'Automated Rent Reconciled',
        category: 'finance',
        severity: 'success',
        details: `Monthly collection reconciled (${p.collections.toFixed(1)}% rate). Payment channel: M-Pesa / Direct Debit.`,
        actor: 'FinOps Reconciler',
        timestamp: new Date(now - (idx * 7200000 + 1800000)).toISOString(),
        createdAt: now - (idx * 7200000 + 1800000)
      },
      {
        uid: activeUid,
        propertyId: p.id,
        propertyName: p.name,
        action: 'Lease Renewal Terms Generated',
        category: 'lease',
        severity: 'info',
        details: `CPI-indexed renewal terms calculated for upcoming lease cycle.`,
        actor: 'Lease Engine',
        timestamp: new Date(now - (idx * 14400000 + 3600000)).toISOString(),
        createdAt: now - (idx * 14400000 + 3600000)
      }
    ])

    // Write batch or sequentially
    for (const audit of sampleAudits) {
      await addDoc(colRef, audit)
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'property_audits')
  }
}
