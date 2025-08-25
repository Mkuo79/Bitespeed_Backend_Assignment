const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false, // set true if using Azure
    trustServerCertificate: true // required for local dev
  }
};

async function connectDB() {
  try {
    const pool = await sql.connect(config);
    console.log("Connected to SQL Server");
    return pool;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
}

module.exports = { connectDB, sql };
