// Backend: server.js
import express from "express";
import cors from "cors";
import { db, ref, get, update } from "./firebase.js";

const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Server is running" });
});

// Get all guests endpoint
app.get("/api/guests", async (req, res) => {
  try {
    const guestRef = ref(db, "Data");
    const snapshot = await get(guestRef);

    if (!snapshot.exists()) {
      return res.status(404).json({
        status: "error",
        message: "No data found in database",
      });
    }

    const guests = [];
    snapshot.forEach((childSnapshot) => {
      guests.push({
        id: childSnapshot.key,
        ...childSnapshot.val(),
      });
    });

    res.json({ status: "success", guests });
  } catch (error) {
    console.error("Error fetching guests:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Check-in endpoint remains the same
app.post("/api/check-in", async (req, res) => {
  // ... your existing check-in code ...
});

// Modified AdminDashboard.jsx
const fetchGuests = async () => {
  try {
    const response = await fetch(
      "https://self-kiosk-backenddb-1.onrender.com/api/guests"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success" && data.guests) {
      const guestsList = data.guests.map((guest) => ({
        id: guest.id,
        serialNumber: guest.serialNumber,
        barcode: guest.barcode,
        name: guest.name,
        organization: guest.organization || "N/A",
        status: guest.status || "Pending",
      }));
      setGuests(guestsList);
    } else {
      console.log("No guests found or invalid response format");
      setGuests([]);
    }
  } catch (error) {
    console.error("Error fetching guests:", error);
    setGuests([]);
    // Optionally show an error message to the user
  }
  setLoading(false);
};

// Modified GateScanner.jsx check-in fetch
const handleScan = async (data) => {
  if (data) {
    const barcode = data.text;
    setScannedData(barcode);
    setLoading(true);
    setModalMessage("Processing...");

    try {
      const response = await fetch(
        "https://self-kiosk-backenddb-1.onrender.com/api/check-in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ barcode }),
          credentials: "include", // Add this if using cookies
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === "found") {
        const welcomeMessage = `Welcome ${result.name}`;
        setModalMessage(welcomeMessage);
        speakMessageOnce(`Welcome to Synergy Sphere ${result.name}`);
      } else {
        setModalMessage("Barcode not found. Access Denied.");
      }
    } catch (error) {
      console.error("Error verifying guest:", error);
      setModalMessage("Error verifying guest. Please try again.");
    } finally {
      setLoading(false);
      setShowScanner(false);
    }
  }
};

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
