// ════════════════════════════════════════════════════════════════════════
//  UserProfile.tsx — Authenticated User Profile Component
//  ─────────────────────────────────────────────────────────────────────
//  • Retrieves and displays authenticated user details from Firebase Auth
//  • Features avatar photo URL with fallback initials, display name, email,
//    role, and auth provider badge
//  • Integrates with UserContext (onAuthStateChanged) for real-time auth state
// ════════════════════════════════════════════════════════════════════════

import React from 'react'
import { UserProfileView, UserProfileViewProps } from './UserProfileView'
import EditProfileModal from './EditProfileModal'

export type UserProfileProps = UserProfileViewProps

export { EditProfileModal }

/**
 * UserProfile component retrieves authenticated user details from Firebase Auth
 * and renders a high-precision, responsive profile display.
 */
export function UserProfile(props: UserProfileProps) {
  return <UserProfileView {...props} />
}

export default UserProfile
