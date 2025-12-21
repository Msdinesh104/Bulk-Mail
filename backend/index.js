require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const sgMail = require("@sendgrid/mail");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// ---------- Validate environment ----------
if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_FROM) {
  console.error("❌ SendGrid API key or sender email not defined in .env!");
  process.exit(1);
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI not defined in .env!");
  process.exit(1);
}

// ---------- Connect to MongoDB ----------
const connectWithRetry = async (retries = 5, delay = 3000) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(" DB connected successfully!");
  } catch (err) {
    console.error(" DB connection failed:", err.message);
    if (retries > 0) {
      console.log(`🔁 Retrying in ${delay / 1000}s... (${retries} attempts left)`);
      setTimeout(() => connectWithRetry(retries - 1, delay), delay);
    } else {
      console.error(" All retries exhausted. Could not connect to DB.");
      process.exit(1);
    }
  }
};
connectWithRetry();

// ---------- Health Check ----------
app.get("/health", (req, res) => {
  res.send({ status: "OK", db: mongoose.connection.readyState });
});

// ---------- Send Bulk Emails ----------
app.post("/sendmail", async (req, res) => {
  try {
    let { msg, emailList } = req.body;

    if (!msg || msg.trim().length === 0) {
      return res.status(400).send({ success: false, error: "Message content is empty" });
    }

    if (!emailList || !emailList.length) {
      return res.status(400).send({ success: false, error: "Email list is empty" });
    }

    // Ensure emailList is an array
    if (!Array.isArray(emailList)) {
      emailList = emailList.split(",").map(e => e.trim());
    }

    const results = [];

    for (const email of emailList) {
      try {
        await sgMail.send({
          to: email,
          from: process.env.EMAIL_FROM, // verified sender
          subject: "BulkMail Message",
          text: msg,
        });
        console.log(` Email sent to: ${email}`);
        results.push({ email, status: "sent" });
      } catch (err) {
        const errorMsg = err.response?.body || err.message;
        console.error(`Failed to send email to: ${email}`, errorMsg);
        results.push({ email, status: "failed", error: errorMsg });
      }
    }

    res.send({ success: true, results });

  } catch (error) {
    console.error("SendMail error:", error.message);
    res.status(500).send({ success: false, error: error.message });
  }
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
