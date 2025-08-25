const { connectDB, sql } = require("../../db");

function cleanEmail(email) {
  if (!email || typeof email !== "string") return null;
  return email.trim().toLowerCase();
}

function cleanPhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  return phone
    .replace(/\D/g, "") 
    .replace(/^0+/, ""); 
}

exports.identifyCustomer = async ({email, phoneNumber}) => {
  const pool = await connectDB();

  //cleaning inputs here 
  email = cleanEmail(email);
  phoneNumber = cleanPhone(phoneNumber);
    // console.log(email, "email");
    // console.log(phoneNumber, "phoneNumber");

  // Firstly we try to find record and see if a match exist by email or phone number 
  let result = await pool.request()
    .input("email", sql.VarChar, email || null)
    .input("phoneNumber", sql.VarChar, phoneNumber || null)
    .query(`
      SELECT * FROM Contact
      WHERE deletedAt IS NULL
        AND ((@email IS NOT NULL AND email = @email)
          OR (@phoneNumber IS NOT NULL AND phoneNumber = @phoneNumber))
    `);

  let contacts = result.recordset;
    //console.log(contacts, "Contacts");

  // If no record is found, it's time to create a new primary!
  if (contacts.length === 0) {
    const insert = await pool.request()
      .input("email", sql.VarChar, email || null)
      .input("phoneNumber", sql.VarChar, phoneNumber || null)
      .input("linkPrecedence", sql.VarChar, "primary")
      .query(`
        INSERT INTO Contact (phoneNumber, email, linkPrecedence, createdAt, updatedAt)
        OUTPUT INSERTED.*
        VALUES (@phoneNumber, @email, @linkPrecedence, GETUTCDATE(), GETUTCDATE())
      `);
        console.log("New primary");
    const newContact = insert.recordset[0];
    return formatIdentity(newContact.Id, [newContact]);
  }

  // We would be pulling all the records here, the entire cluster
  const allIds = contacts
  .map(c => c.Id) 
  .concat(contacts.map(c => c.LinkedId).filter(Boolean));
  if (allIds.length > 0) {
  const clusterResult = await pool.request().query(`
    SELECT * FROM Contact
    WHERE deletedAt IS NULL
      AND (id IN (${allIds.join(",")}) OR linkedId IN (${allIds.join(",")}))
  `);
  contacts = clusterResult.recordset;
  }

  //Now we would be finding all the primaries 
  let primaries = contacts.filter(c => c.LinkPrecedence === "primary");

  // If multiple primaries exits, we would merge them
  if (primaries.length > 1) {
    const oldestPrimary = primaries.reduce((oldest, c) =>
      new Date(c.CreatedAt) < new Date(oldest.CreatedAt) ? c : oldest, primaries[0]
    );

    const others = primaries.filter(p => p.Id !== oldestPrimary.Id);

    for (const other of others) {
     
      await pool.request()
        .input("Id", sql.Int, other.Id)
        .input("linkedId", sql.Int, oldestPrimary.Id)
        .query(`
          UPDATE Contact
          SET linkPrecedence = 'secondary', linkedId = @linkedId, updatedAt = GETUTCDATE()
          WHERE id = @id
        `);

      // Relinking here 
      await pool.request()
        .input("oldPrimary", sql.Int, other.Id)
        .input("newPrimary", sql.Int, oldestPrimary.Id)
        .query(`
          UPDATE Contact
          SET linkedId = @newPrimary, updatedAt = GETUTCDATE()
          WHERE linkedId = @oldPrimary
        `);
    }

   // Cluster after merging is done 
    const mergedCluster = await pool.request().query(`
      SELECT * FROM Contact
      WHERE deletedAt IS NULL
        AND (id = ${oldestPrimary.Id} OR linkedId = ${oldestPrimary.Id})
    `);

    contacts = mergedCluster.recordset;
  }

  // Inserting secondary here 
  const alreadyExists = contacts.some(c =>
  (email && phoneNumber && c.Email === email && c.PhoneNumber === phoneNumber) ||
  (email && !phoneNumber && c.Email === email) ||
  (!email && phoneNumber && c.PhoneNumber === phoneNumber)
);
  console.log(alreadyExists, "alreadyExists");
  let primary = contacts.find(c => c.LinkPrecedence === "primary");
  console.log(primary, "Primary");
  if (!alreadyExists && (email || phoneNumber)) {
    const insert = await pool.request()
      .input("email", sql.VarChar, email || null)
      .input("phoneNumber", sql.VarChar, phoneNumber || null)
      .input("linkedId", sql.Int, primary.Id)
      .input("linkPrecedence", sql.VarChar, "secondary")
      .query(`
        INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
        OUTPUT INSERTED.*
        VALUES (@phoneNumber, @email, @linkedId, @linkPrecedence, GETUTCDATE(), GETUTCDATE())
      `);

    contacts.push(insert.recordset[0]);
  }

  // Building unified record for response here 
  return formatIdentity(primary.Id, contacts);
};

function formatIdentity(primaryId, contacts) {
  const emails = [...new Set(contacts.map(c => cleanEmail(c.Email)).filter(Boolean))];
  const phones = [...new Set(contacts.map(c => cleanPhone(c.PhoneNumber)).filter(Boolean))];
  const secondaryIds = contacts.filter(c => c.LinkPrecedence === "secondary").map(c => c.Id);

  return {
    contact: {
      primaryContactId: primaryId,
      emails,
      phoneNumbers: phones,
      secondaryContactIds: secondaryIds
    }
  };
}
