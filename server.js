import express from "express";
import cors from "cors";
import { db, ref, get, update } from "./firebase.js";
import axios from "axios";  // Import axios for making HTTP requests

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all origins by setting the origin to '*'
app.use(cors({ origin: "*" })); // This allows all domains to access your server

app.use(express.json());

// Your Telegram Bot API token and Chat ID
const TELEGRAM_BOT_TOKEN = '7510065834:AAHKW9tb-lvJSPg6-5KKXesoThBExvSzQeg';  // Your bot token
const TELEGRAM_CHAT_ID = '-1002269343860';  // Replace with your chat ID

// Function to send message to Telegram bot
const sendTelegramNotification = async (message) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const params = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,  // The message you want to send
  };

  try {
    await axios.post(url, params);
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
  }
};

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
        arrivalTime: guest.arrivalTime || "N/A", // Include arrivalTime here
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

      // New code to update arrival time and status without removing other data
      try {
        const currentTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

        // Update the guest with arrival time, status, and any other data you want to keep
        await update(ref(db, `Data/${guestKey}`), {
          status: "Arrived", 
          notificationSent: true,  // Keeps this flag to prevent re-notification
          arrivalTime: currentTime  // Adding the arrival time field
        });
        console.log("Successfully updated guest status and arrival time");

        // Send notification to Telegram bot
        const message = `Guest ${foundGuest.name} has arrived at ${currentTime}. Status: Arrived`;
        await sendTelegramNotification(message);  // Send the Telegram message

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