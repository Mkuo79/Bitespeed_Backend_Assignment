const { connectDB, sql } = require("../../db");

async function deleteCustomer({ email, phoneNumber }) {

  const pool = await connectDB();

  const result = await pool.request()
    .input("email", sql.VarChar, email || null)
    .input("phoneNumber", sql.VarChar, phoneNumber || null)
    .query(`
      UPDATE Contact
      SET deletedAt = GETUTCDATE(), updatedAt = GETUTCDATE()
      WHERE (email = @email AND phoneNumber = @phoneNumber)
    `);

  return result.rowsAffected[0]; // 0 = not found, 1+ = deleted
}
module.exports = { deleteCustomer };