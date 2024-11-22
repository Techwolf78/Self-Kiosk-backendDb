import express from 'express';
import cors from 'cors';
import { db, ref, get, update, query, orderByChild, equalTo } from './firebase.js';  // Added query, orderByChild, equalTo

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
    
    // Query the database for a guest with the specific barcode
    const barcodeQuery = query(guestRef, orderByChild('barcode'), equalTo(barcode));
    const snapshot = await get(barcodeQuery);
    
    // Check if any guest exists with the matching barcode
    if (!snapshot.exists()) {
      console.log('Barcode not found in the database');
      return res.json({ status: 'not-found' });
    }

    const guest = snapshot.val();
    const guestKey = Object.keys(guest)[0]; // Get the first key for the guest (Firebase object keys)

    // Update the guest's status to 'Arrived' in Firebase
    await update(ref(db, `Data/${guestKey}`), { status: 'Arrived' });
    console.log(`Status updated to "Arrived" for guest: ${guest[guestKey].name}`);

    // Send response to client
    res.json({ status: 'found', name: guest[guestKey].name });
  } catch (error) {
    console.error('Error checking in guest:', error);  // Log the error to the console
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
