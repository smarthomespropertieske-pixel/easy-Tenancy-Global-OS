import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Read Firebase applet configuration
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ Error: firebase-applet-config.json not found at', configPath);
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
console.log('🔥 Initializing Firebase connection with Project ID:', firebaseConfig.projectId);
console.log('📍 Firestore Database ID:', firebaseConfig.firestoreDatabaseId || '(default)');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Initial Seed Data for 'properties' collection
const initialProperties = [
  {
    id: 'prop-sovereign-one',
    title: 'The Sovereign Tower - Penthouse A',
    location: 'London, Mayfair',
    price: 14500000,
    yieldRate: 6.8,
    occupancy: 98.4,
    status: 'ACTIVE_YIELD',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-sovereign-two',
    title: 'Silicon Harbour Innovation Hub',
    location: 'Singapore, Marina Bay',
    price: 28900000,
    yieldRate: 8.2,
    occupancy: 100.0,
    status: 'ACTIVE_YIELD',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prop-sovereign-three',
    title: 'Equinox Apex Logistics Park',
    location: 'Zurich, Logistics Corridor',
    price: 42000000,
    yieldRate: 7.4,
    occupancy: 95.2,
    status: 'OPTIMIZING',
    createdAt: new Date().toISOString()
  }
];

// Initial Seed Data for 'users' collection (System / Demo account)
const initialUsers = [
  {
    uid: 'system-admin-001',
    email: 'admin@easytenancy.global',
    displayName: 'Sovereign Administrator',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    lastLogin: new Date().toISOString()
  }
];

async function initializeFirestore() {
  try {
    console.log('\n⚡ 1. Verifying Firestore Database Connection...');
    const testQuery = query(collection(db, 'properties'), limit(1));
    await getDocs(testQuery);
    console.log('✅ Connection verified successfully!');

    console.log('\n🏢 2. Seeding/Verifying "properties" collection...');
    for (const prop of initialProperties) {
      const propRef = doc(db, 'properties', prop.id);
      const snapshot = await getDoc(propRef);
      if (!snapshot.exists()) {
        await setDoc(propRef, prop);
        console.log(`   + Created initial property document: ${prop.title} (${prop.id})`);
      } else {
        console.log(`   • Existing property document verified: ${prop.title} (${prop.id})`);
      }
    }

    console.log('\n👤 3. Seeding/Verifying "users" collection...');
    for (const user of initialUsers) {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        await setDoc(userRef, user);
        console.log(`   + Created initial user document: ${user.displayName} (${user.uid})`);
      } else {
        console.log(`   • Existing user document verified: ${user.displayName} (${user.uid})`);
      }
    }

    console.log('\n🔒 4. Checking Firestore Security Rules configuration...');
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    if (fs.existsSync(rulesPath)) {
      const rules = fs.readFileSync(rulesPath, 'utf-8');
      if (rules.includes('match /properties/{propertyId}') && rules.includes('match /users/{userId}')) {
        console.log('✅ Security rules match "properties" and "users" collection specs.');
      } else {
        console.warn('⚠️ Warning: firestore.rules may need update to explicitly cover "properties" and "users"');
      }
    }

    console.log('\n✨ Automated Firestore Database Initialization Completed Successfully!');
  } catch (err) {
    console.error('❌ Error during Firestore initialization:', err);
    process.exit(1);
  }
}

initializeFirestore();
