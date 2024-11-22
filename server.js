// server.js - Add the GET endpoint for the admin dashboard
import express from 'express';
import cors from 'cors';
import { db, ref, get, update } from './firebase.js';

const app = express();
const port = process.env.PORT || 5000; // Add this line for Render deployment

// Update CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'https://self-kiosk.vercel.app/'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Add GET endpoint for fetching all guests
app.get('/api/check-in', async (req, res) => {
  try {
    const guestRef = ref(db, 'Data');
    const snapshot = await get(guestRef);

    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'No guests found' });
    }

    const guests = [];
    snapshot.forEach((childSnapshot) => {
      guests.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });

    res.json({ guests });
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Your existing POST endpoint remains the same
app.post('/api/check-in', async (req, res) => {
  // ... your existing code ...
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});