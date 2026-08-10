// ════════════════════════════════════════════════════════════════════════
//  activityLogger.ts — Firebase Firestore User Activity Logging Engine
//  ─────────────────────────────────────────────────────────────────────
//  • Logs user actions ('Logged in', 'Profile updated', etc.) to Firestore
//  • Provides real-time activity stream subscription via onSnapshot
//  • Handles guest / local fallback when offline
// ════════════════════════════════════════════════════════════════════════

import { db } from './firebase'
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs
} from 'firebase/firestore'

export interface ActivityLog {
  id: string
  uid: string
  action: string
  category: 'auth' | 'profile' | 'system' | 'action'
  details?: string
  timestamp: string // ISO string timestamp
  createdAt?: number
}

// Local storage key fallback for guest mode
const LOCAL_STORAGE_LOGS_KEY = 'easytenancy_guest_activity_logs'

/**
 * Log a user action to Firestore (subcollection: users/{uid}/activities)
 */
export async function logUserActivity(
  uid: string,
  action: string,
  category: ActivityLog['category'] = 'action',
  details?: string
): Promise<void> {
  if (!uid) return

  const timestamp = new Date().toISOString()
  const logData = {
    uid,
    action,
    category,
    details: details || '',
    timestamp,
    createdAt: Date.now()
  }

  // 1. Try Firestore logging first
  try {
    const activitiesRef = collection(db, 'users', uid, 'activities')
    await addDoc(activitiesRef, logData)
  } catch (err) {
    console.warn('Firestore activity log write failed, falling back to local cache:', err)
  }

  // 2. Also record in local storage cache for immediate local availability
  try {
    const existingStr = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY) || '[]'
    const existing: ActivityLog[] = JSON.parse(existingStr)
    const newLog: ActivityLog = { id: `local_${Date.now()}`, ...logData }
    const updated = [newLog, ...existing].slice(0, 50)
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(updated))
  } catch (e) {
    // Ignore localStorage quota errors
  }
}

/**
 * Subscribe to real-time user activity logs from Firestore
 */
export function subscribeToUserActivities(
  uid: string,
  callback: (logs: ActivityLog[]) => void,
  maxResults: number = 20
): () => void {
  if (!uid) {
    // Return cached guest logs
    try {
      const existingStr = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY) || '[]'
      callback(JSON.parse(existingStr))
    } catch {
      callback([])
    }
    return () => {}
  }

  try {
    const activitiesRef = collection(db, 'users', uid, 'activities')
    const q = query(activitiesRef, orderBy('createdAt', 'desc'), limit(maxResults))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreLogs: ActivityLog[] = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            uid: data.uid || uid,
            action: data.action || 'User action',
            category: data.category || 'action',
            details: data.details || '',
            timestamp: data.timestamp || new Date().toISOString(),
            createdAt: data.createdAt || Date.now()
          }
        })

        // Merge with local logs if snapshot is empty or to ensure complete history
        if (firestoreLogs.length > 0) {
          callback(firestoreLogs)
        } else {
          // Fallback to local cache if no remote logs yet
          try {
            const existingStr = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY) || '[]'
            const localLogs: ActivityLog[] = JSON.parse(existingStr)
            callback(localLogs.filter(l => l.uid === uid))
          } catch {
            callback([])
          }
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot error for activity logs:', error)
        // Fallback to local storage
        try {
          const existingStr = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY) || '[]'
          const localLogs: ActivityLog[] = JSON.parse(existingStr)
          callback(localLogs.filter(l => l.uid === uid))
        } catch {
          callback([])
        }
      }
    )

    return unsubscribe
  } catch (err) {
    console.error('Failed to establish Firestore activity log listener:', err)
    callback([])
    return () => {}
  }
}
