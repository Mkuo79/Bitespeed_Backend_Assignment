const { connectDB, sql } = require("../../db");

async function insertContact({ phoneNumber, email, linkedId, linkPrecedence }) {
  const pool = await connectDB();

  const result = await pool.request()
    .input("phoneNumber", sql.VarChar, phoneNumber)
    .input("email", sql.VarChar, email)
    .input("linkedId", sql.Int, linkedId || null)
    .input("linkPrecedence", sql.VarChar, linkPrecedence)
    .query(`
      INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
      OUTPUT INSERTED.*
      VALUES (@phoneNumber, @email, @linkedId, @linkPrecedence, GETUTCDATE(), GETUTCDATE())
    `);

  return result.recordset[0];
}

async function fetchContacts() {
  const pool = await connectDB();

  const result = await pool.request()
    .query("SELECT * FROM Contact WHERE deletedAt IS NULL ORDER BY createdAt DESC");

  return result.recordset;
}

module.exports = { insertContact, fetchContacts };
