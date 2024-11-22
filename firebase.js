// backend/firebase.js

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, update, onValue } from 'firebase/database';  // Added onValue to the imports

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCln-9sgIMTiqxZzEtnYqKJu5sYBNpqaXg",
  authDomain: "guestlist-158e7.firebaseapp.com",
  databaseURL: "https://guestlist-158e7-default-rtdb.firebaseio.com",
  projectId: "guestlist-158e7",
  storageBucket: "guestlist-158e7.firebasestorage.app",
  messagingSenderId: "265509884217",
  appId: "1:265509884217:web:56fb52bb42c3e5c66918e8",
  measurementId: "G-QGB40X0C12"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Realtime Database reference
const db = getDatabase(app);

export { db, ref, get, set, update, onValue };  // Added onValue to exports