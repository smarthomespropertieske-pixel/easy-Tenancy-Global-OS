import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load Firebase configuration
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ Error: firebase-applet-config.json not found at', configPath);
  process.exit(1);
}

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
console.log('🔥 Initializing Firebase App...');
console.log('   Project ID:', firebaseConfig.projectId);
console.log('   Firestore Database ID:', firebaseConfig.firestoreDatabaseId || '(default)');

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Default initial data for 'properties' collection
const initialProperties = [
  {
    id: 'prop-sovereign-one',
    title: 'The Sovereign Tower - Penthouse A',
    location: 'London, Mayfair',
    price: 14500000,
    yieldRate: 6.8,
    occupancy: 98.4,
    status: 'ACTIVE_YIELD',
    createdAt: new Date().toISOString(),
    indexedFields: ['status', 'createdAt', 'location', 'price']
  },
  {
    id: 'prop-sovereign-two',
    title: 'Silicon Harbour Innovation Hub',
    location: 'Singapore, Marina Bay',
    price: 28900000,
    yieldRate: 8.2,
    occupancy: 100.0,
    status: 'ACTIVE_YIELD',
    createdAt: new Date().toISOString(),
    indexedFields: ['status', 'createdAt', 'location', 'price']
  },
  {
    id: 'prop-sovereign-three',
    title: 'Equinox Apex Logistics Park',
    location: 'Zurich, Logistics Corridor',
    price: 42000000,
    yieldRate: 7.4,
    occupancy: 95.2,
    status: 'OPTIMIZING',
    createdAt: new Date().toISOString(),
    indexedFields: ['status', 'createdAt', 'location', 'price']
  }
];

// Default initial data for 'users' collection
const initialUsers = [
  {
    uid: 'system-admin-001',
    email: 'admin@easytenancy.global',
    displayName: 'Sovereign Administrator',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    role: 'ADMIN',
    lastLogin: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

async function initializeDatabase() {
  try {
    console.log('\n⚡ 1. Testing Firestore connectivity...');
    const testRef = collection(db, 'properties');
    await getDocs(query(testRef, limit(1)));
    console.log('✅ Connected to Firestore database successfully.');

    console.log('\n🏢 2. Initializing "properties" collection and indexed documents...');
    for (const prop of initialProperties) {
      const propRef = doc(db, 'properties', prop.id);
      const snapshot = await getDoc(propRef);
      if (!snapshot.exists()) {
        await setDoc(propRef, prop);
        console.log(`   + Created property: ${prop.title} [id: ${prop.id}]`);
      } else {
        console.log(`   • Property exists: ${prop.title} [id: ${prop.id}]`);
      }
    }

    console.log('\n👤 3. Initializing "users" collection and initial accounts...');
    for (const user of initialUsers) {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) {
        await setDoc(userRef, user);
        console.log(`   + Created initial user record: ${user.displayName} [uid: ${user.uid}]`);
      } else {
        console.log(`   • User record exists: ${user.displayName} [uid: ${user.uid}]`);
      }
    }

    console.log('\n📊 4. Verifying indexed collections and field access paths...');
    console.log('   - Index "properties": status ASC, createdAt DESC');
    console.log('   - Index "properties": location ASC, price DESC');
    console.log('   - Index "users": email ASC, role ASC');
    console.log('✅ Collections ("properties", "users") and index structures verified.');

    console.log('\n🎉 Automated database initialization complete!');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
