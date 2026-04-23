const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "cherry", // 👈 Put your actual pgAdmin password here
  host: "localhost",
  port: 5432,
  database: "ai_assistant"   // 👈 THIS IS THE MAGIC WORD!
});

module.exports = pool;