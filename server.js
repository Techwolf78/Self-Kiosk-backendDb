import express from 'express';
import cors from 'cors';
import { db, ref, get, update } from './firebase.js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Add a basic health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.post('/api/check-in', async (req, res) => {
  console.log('Received request body:', req.body); // Log incoming request

  const { barcode } = req.body;
  
  if (!barcode) {
    console.log('No barcode provided in request');
    return res.status(400).json({ 
      status: 'error', 
      message: 'Barcode is required' 
    });
  }

  try {
    console.log('Attempting to connect to Firebase');
    const guestRef = ref(db, 'Data');
    
    console.log('Fetching data from Firebase');
    const snapshot = await get(guestRef);
    
    if (!snapshot.exists()) {
      console.log('No data found in Firebase');
      return res.status(404).json({ 
        status: 'error', 
        message: 'No data found in database' 
      });
    }

    console.log('Searching for barcode:', barcode);
    let foundGuest = null;
    let guestKey = null;

    snapshot.forEach((childSnapshot) => {
      const guest = childSnapshot.val();
      console.log('Checking guest:', guest);
      if (guest.barcode === barcode) {
        foundGuest = guest;
        guestKey = childSnapshot.key;
      }
    });

    if (foundGuest) {
      console.log('Found guest:', foundGuest);
      
      try {
        await update(ref(db, `Data/${guestKey}`), { status: 'Arrived' });
        console.log('Successfully updated guest status');
        
        res.json({ 
          status: 'found', 
          name: foundGuest.name 
        });
      } catch (updateError) {
        console.error('Error updating status:', updateError);
        res.status(500).json({ 
          status: 'error', 
          message: 'Failed to update guest status' 
        });
      }
    } else {
      console.log('Guest not found with barcode:', barcode);
      res.json({ status: 'not-found' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});