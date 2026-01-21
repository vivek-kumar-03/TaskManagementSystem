const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      "mongodb+srv://sachinkumar1029yadav:S2RiANpjtZBk9b7h@cluster0.hsr4tjx.mongodb.net/TaskFlow?retryWrites=true&w=majority&appName=Cluster0"
    );
    console.log("✅ Connected to TaskFlow database");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;