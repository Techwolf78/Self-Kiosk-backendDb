import express from "express";
import cors from "cors";
import { db, ref, get } from "./firebase.js"; // Firebase imports

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// Basic health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Server is running" });
});

// Handle GET requests to /api/check-in
app.get("/api/check-in", async (req, res) => {
  try {
    console.log("Fetching guests data from Firebase...");

    // Reference to the guest data in Firebase
    const guestRef = ref(db, "Data");

    // Fetch data from Firebase
    const snapshot = await get(guestRef);

    if (!snapshot.exists()) {
      console.log("No data found in Firebase");
      return res.status(404).json({
        status: "error",
        message: "No data found in database",
      });
    }

    // Prepare guest data for response
    const guests = [];
    snapshot.forEach((childSnapshot) => {
      const guest = childSnapshot.val();
      guests.push({
        id: childSnapshot.key, // Firebase key as the ID
        serialNumber: guest.serialNumber,
        barcode: guest.barcode,
        name: guest.name,
        organization: guest.organization || "N/A", // Default if not present
        status: guest.status || "Pending", // Default if not present
      });
    });

    // Return the fetched guest data
    res.json({ guests });
  } catch (error) {
    console.error("Error fetching guest data:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
