import dns from "dns";
import mongoose from "mongoose";

// Ensure DNS servers resolve MongoDB SRV records reliably on all environments
try {
  dns.setServers(["1.1.1.1", "8.8.8.8"]);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection && mongoose.connection.readyState !== 0) {
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    cachedConnection = conn;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
    throw error;
  }
};

export default connectDB;

