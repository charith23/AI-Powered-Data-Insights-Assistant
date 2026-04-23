const express = require("express");
const cors = require("cors");
const pool = require("./db");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ✅ DB test route
app.get("/sales", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sales");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB error");
  }
});

app.post("/query", async (req, res) => {
  const { query } = req.body;

  try {
    // 🔥 "DUMB-DOWN" Q/A PROMPT FOR TINYLLAMA (No complex rules to confuse it)
   // 🔥 ULTIMATE DUMBED-DOWN PROMPT
    const prompt = `Translate the request to PostgreSQL. ONLY output the SQL.

Tables:
users (user_id, country)
products (product_id, category, price)
orders (order_id, user_id, product_id, quantity)

Request: show me total revenue by product category
SQL: SELECT products.category, SUM(orders.quantity * products.price) AS total_revenue FROM orders JOIN products ON orders.product_id = products.product_id GROUP BY products.category;

Request: ${query}
SQL:`;

    const response = await axios.post("http://127.0.0.1:11434/api/generate", {
      model: "tinyllama",
      prompt: prompt,
      stream: false,
      options: { temperature: 0 } // Keeps the AI robotic and strict
    });

    let raw = response.data.response;
    console.log("RAW AI:", raw);

    // 🔥 SUPER BULLETPROOF CLEANING
    let cleanRaw = raw.replace(/```sql/ig, "").replace(/```/g, "").trim();
    
    // Match anything starting with SELECT up to a semicolon OR the end of the string
    let match = cleanRaw.match(/SELECT[\s\S]*?(;|$)/i);

    if (!match || !cleanRaw.toLowerCase().includes("select")) {
      // 🚀 SEND THE RAW AI TEXT TO THE FRONTEND IF IT FAILS
      return res.status(400).json({ error: `AI didn't write SQL! It said: "${cleanRaw}"` });
    }

    let sql = match[0].trim();
    if (!sql.endsWith(';')) sql += ';'; // Force a semicolon
    
    // Clean backticks just in case
    sql = sql.replace(/`/g, "");

    console.log("FINAL SQL:", sql);

    const result = await pool.query(sql);

    res.json({
      sql: sql,
      data: result.rows
    });

  } catch (err) {
    console.error("ERROR:", err.message);
    if (err.code === 'ECONNREFUSED') {
      return res.status(500).json({ error: "AI Error: Ollama is not running." });
    }
    res.status(500).json({ error: "Database/Server Error: " + err.message });
  }
});

// ✅ START SERVER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});