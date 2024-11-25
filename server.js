import express from "express";
import cors from "cors";
import { db, ref, get, update } from "./firebase.js";

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
    const guestRef = ref(db, "data");

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

// Handle POST requests to /api/check-in
app.post("/api/check-in", async (req, res) => {
  console.log("Received request body:", req.body); // Log incoming request
  const { barcode } = req.body;

  if (!barcode) {
    console.log("No barcode provided in request");
    return res.status(400).json({
      status: "error",
      message: "Barcode is required",
    });
  }

  try {
    console.log("Attempting to connect to Firebase");

    const guestRef = ref(db, "Data");

    console.log("Fetching data from Firebase");
    const snapshot = await get(guestRef);

    if (!snapshot.exists()) {
      console.log("No data found in Firebase");
      return res.status(404).json({
        status: "error",
        message: "No data found in database",
      });
    }

    console.log("Searching for barcode:", barcode);
    let foundGuest = null;
    let guestKey = null;
    snapshot.forEach((childSnapshot) => {
      const guest = childSnapshot.val();
      console.log("Checking guest:", guest);
      if (guest.barcode === barcode) {
        foundGuest = guest;
        guestKey = childSnapshot.key;
      }
    });

    if (foundGuest) {
      console.log("Found guest:", foundGuest);

      try {
        await update(ref(db, `Data/${guestKey}`), { status: "Arrived" });
        console.log("Successfully updated guest status");

        res.json({
          status: "found",
          name: foundGuest.name,
        });
      } catch (updateError) {
        console.error("Error updating status:", updateError);
        res.status(500).json({
          status: "error",
          message: "Failed to update guest status",
        });
      }
    } else {
      console.log("Guest not found with barcode:", barcode);
      res.json({ status: "not-found" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
