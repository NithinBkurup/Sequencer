import express from "express";
import cors from "cors";
import sql from "mssql";
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("."));

const config = {
  user: process.env.MPAS_DB_USER,
  password: process.env.MPAS_DB_PASS,
  server: process.env.MPAS_DB_HOST,
  port: parseInt(process.env.MPAS_DB_PORT || "1433"),
  database: process.env.MPAS_DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};
const APP_PORT = parseInt(process.env.MPAS_APP_PORT || "3010");

// Test endpoint
app.get("/api/test", async (req, res) => {
  try {
    console.log("Testing SQL connection...");
    const pool = await sql.connect(config);
    console.log("Connected to SQL!");

    const result = await pool.request().query("SELECT @@VERSION as Version");
    console.log("Query executed successfully!");

    res.json({
      success: true,
      message: "SQL connection successful!",
      version: result.recordset[0].Version
    });
  } catch (e) {
    console.error("SQL Error:", e.message);
    console.error("Full error:", e);
    res.status(500).json({
      success: false,
      error: e.message,
      code: e.code,
      originalError: e.originalError?.message
    });
  }
});

// Get last scheduled time for a line
app.get("/api/last-scheduled", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    
  const result = await pool.request()
    .input("Plant", sql.NVarChar(50), req.query.plant)
    .execute("usp_GetLastScheduledTime");

    const lastScheduledTime = result.recordset.length > 0 
      ? result.recordset[0].lastScheduledTime 
      : null;

    console.log(`Last scheduled time for ${req.query.plant}: ${lastScheduledTime}`);
    res.json({ lastScheduledTime });
  } catch (e) {
    console.error("Error in /api/last-scheduled:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Orders endpoint
app.get("/api/orders", async (req, res) => {
  try {
    console.log("Fetching orders with params:", req.query);

    const pool = await sql.connect(config);
    console.log("Connected to SQL");

    const result = await pool.request()
      .input("Plant", sql.NVarChar, req.query.plant)
      .input("Line", sql.NVarChar, req.query.line)
      .input("FromDate", sql.DateTime, req.query.from)
      .input("ToDate", sql.DateTime, req.query.to)
      .input("Material", sql.NVarChar, req.query.material || "ALL")
      .input("Mode", sql.NVarChar, req.query.mode)
      .execute("usp_Get_MPAS_Orders_For_Sequencing");

    let filteredRows = result.recordset;

    // Γ£à CLIENT-SIDE FILTERING based on mode
    if (req.query.mode === 'Sequence') {
      // For Sequence: Sflag = 0 AND OrderStatus = 'Open'
      filteredRows = filteredRows.filter(row =>
        row.Sflag === 0 &&
        row.OrderStatus === 'Open'
      );
      console.log(`Filtered for Sequence: ${filteredRows.length} rows (Sflag=0, Status=Open)`);
    }
    else if (req.query.mode === 'Resequence') {
      // For Resequence: Sflag = 2 AND OrderStatus = 'Ready'
      filteredRows = filteredRows.filter(row =>
        row.Sflag === 2 &&
        row.OrderStatus === 'Ready'
      );
      console.log(`Filtered for Resequence: ${filteredRows.length} rows (Sflag=2, Status=Ready)`);
    }

    console.log(`Final result: ${filteredRows.length} rows`);
    res.json(filteredRows);
  } catch (e) {
    console.error("Error in /api/orders:", e.message);
    console.error("Full error:", e);
    res.status(500).json({
      error: e.message,
      code: e.code,
      details: e.originalError?.message
    });
  }
});

app.post("/api/sequence", async (req, res) => {
  try {
    const rows = req.body;
    if (!rows || !rows.length) {
      return res.sendStatus(200);
    }

    // Extract username and clientid from first row (they should be same for all)
    const username = rows[0].username || 'SYSTEM';
    const clientid = rows[0].clientid || 'UNKNOWN';
    const plant = rows[0].PlantCode;
    const pool = await sql.connect(config);

    for (const r of rows) {
      // Clean the date: remove milliseconds and ensure proper format
      const schedTime = new Date(r.ScheduledTime);
      const cleanTime = new Date(
        schedTime.getFullYear(),
        schedTime.getMonth(),
        schedTime.getDate(),
        schedTime.getHours(),
        schedTime.getMinutes(),
        schedTime.getSeconds(),
        0  // Zero milliseconds
      );

    await pool.request()
      .input("RowID", sql.Int, r.RowID)
      .input("ScheduledTime", sql.DateTime, cleanTime)
      .input("Username", sql.NVarChar(100), username)
      .input("ClientID", sql.NVarChar(100), clientid)
      .execute("usp_UpdateScheduledOrder");
    }

    console.log(`Updated ${rows.length} rows for sequencing (User: ${username}, Client: ${clientid})`);
    res.sendStatus(200);
  } catch (e) {
    console.error("Error in /api/sequence:", e.message);
    res.status(500).send(e.message);
  }
});

app.post("/api/resequence", async (req, res) => {
  try {
    const rows = req.body;
    if (!rows || !rows.length) {
      return res.sendStatus(200);
    }

    // Extract username and clientid from first row
    const username = rows[0].username || 'SYSTEM';
    const clientid = rows[0].clientid || 'UNKNOWN';
    const plant = rows[0].PlantCode;
    const pool = await sql.connect(config);

    for (const r of rows) {
      // Clean the date: remove milliseconds and ensure proper format
      const schedTime = new Date(r.ScheduledTime);
      const cleanTime = new Date(
        schedTime.getFullYear(),
        schedTime.getMonth(),
        schedTime.getDate(),
        schedTime.getHours(),
        schedTime.getMinutes(),
        schedTime.getSeconds(),
        0  // Zero milliseconds
      );

      await pool.request()
      .input("RowID", sql.Int, r.RowID)
      .input("ScheduledTime", sql.DateTime, cleanTime)
      .input("Username", sql.NVarChar(100), username)
      .input("ClientID", sql.NVarChar(100), clientid)
      .execute("usp_UpdateResequenceOrder");
    }

    console.log(`Updated ${rows.length} rows for resequencing (User: ${username}, Client: ${clientid})`);
    res.sendStatus(200);
  } catch (e) {
    console.error("Error in /api/resequence:", e.message);
    res.status(500).send(e.message);
  }
});

app.listen(APP_PORT, () => {
  console.log("=".repeat(50));
  console.log(`Sequencer running on http://localhost:${APP_PORT}`);
  console.log("=".repeat(50));
});