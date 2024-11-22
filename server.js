import express from 'express';
import cors from 'cors';
import { db, ref, get, update } from './firebase.js';  // Added update for updating Firebase

// Initialize Express app
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint to check in a guest using a barcode
app.post('/api/check-in', async (req, res) => {
  const { barcode } = req.body;

  try {
    console.log('Received barcode:', barcode);  // Log the incoming barcode for debugging
    
    // Correct usage of ref() to get the reference
    const guestRef = ref(db, 'Data');  // Reference to the 'Data' node in Firebase
    const snapshot = await get(guestRef);
    
    // Check if data exists
    if (!snapshot.exists()) {
      console.log('No data found in Firebase Realtime Database');
      return res.status(404).json({ status: 'error', message: 'No data found in the database' });
    }

    // Loop through the snapshot to check for the barcode match
    let foundGuest = null;
    let guestKey = null;  // We will store the key for the guest to update their status

    snapshot.forEach((childSnapshot) => {
      const guest = childSnapshot.val();
      if (guest.barcode === barcode) {
        foundGuest = guest;
        guestKey = childSnapshot.key;  // Get the guest's key (e.g., 'guest_1')
      }
    });

    if (foundGuest) {
      // Log the guest found and their key
      console.log('Found guest with key:', guestKey);  // This will print the correct guest key

      // Update the guest's status to 'Arrived' in Firebase
      await update(ref(db, `Data/${guestKey}`), { status: 'Arrived' });
      console.log(`Status updated to "Arrived" for guest: ${foundGuest.name}`);

      // Send response to client
      res.json({ status: 'found', name: foundGuest.name });
    } else {
      // If barcode doesn't match any guest
      console.log('Barcode not found in the database');
      res.json({ status: 'not-found' });
    }
  } catch (error) {
    console.error('Error checking in guest:', error);  // Log the error to the console
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
