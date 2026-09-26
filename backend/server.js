const express = require("express");
const { Pool } = require("pg");
const os = require("os");
const crypto = require("crypto");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));

const PORT = Number(process.env.PORT || 8080);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

const podName = os.hostname();

/* -----------------------------
   DATABASE INITIALIZATION
----------------------------- */

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cafe_notes (
      id SERIAL PRIMARY KEY,
      message VARCHAR(160) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  console.log("Cluster Café database initialized");
}

/* -----------------------------
   HEALTH
----------------------------- */

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "cluster-cafe-backend",
    pod: podName,
  });
});

app.get("/api/status", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "open",
      database: "connected",
      pod: podName,
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------
   REQUEST JOURNEY
----------------------------- */

app.get("/api/events", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");

    res.json({
      message: "Order travelled successfully through Cluster Café",
      pod: podName,
      databaseTime: result.rows[0].now,
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------
   LEARNING CONTENT
----------------------------- */

app.get("/api/learn", (req, res) => {
  res.json({
    ingress: {
      analogy: "The café front door",
      explanation:
        "Ingress receives incoming traffic and decides which Service should handle it.",
    },

    service: {
      analogy: "The waiter",
      explanation:
        "A Service gives Pods a stable destination and distributes requests between them.",
    },

    pod: {
      analogy: "A café worker",
      explanation:
        "A Pod is the smallest deployable unit and runs the application container.",
    },

    deployment: {
      analogy: "The shift manager",
      explanation:
        "A Deployment keeps the desired number of Pods running and manages updates.",
    },

    hpa: {
      analogy: "Rush-hour staffing",
      explanation:
        "HPA changes Pod replica count based on metrics such as CPU utilization.",
    },

    persistentStorage: {
      analogy: "The pantry",
      explanation:
        "PVC and PV keep important data outside temporary Pod filesystems.",
    },

    configMap: {
      analogy: "The café notice board",
      explanation:
        "ConfigMaps store non-sensitive application configuration.",
    },

    secret: {
      analogy: "The locked drawer",
      explanation:
        "Secrets store sensitive configuration such as database credentials.",
    },
  });
});

/* -----------------------------
   CONTROLLED CPU LOAD
----------------------------- */

app.get("/api/work", (req, res) => {
  const requestedMs = Number(req.query.ms || 500);

  // Prevent accidental unbounded requests.
  const durationMs = Math.min(Math.max(requestedMs, 100), 1200);

  const startedAt = Date.now();
  let operations = 0;
  let value = Buffer.from(`${podName}-${startedAt}`);

  while (Date.now() - startedAt < durationMs) {
    value = crypto
      .createHash("sha256")
      .update(value)
      .digest();

    operations++;
  }

  res.json({
    message: "Coffee rush handled",
    pod: podName,
    durationMs,
    operations,
  });
});

/* -----------------------------
   PERSISTENCE DEMO
----------------------------- */

app.get("/api/notes", async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, message, created_at
      FROM cafe_notes
      ORDER BY created_at DESC
      LIMIT 8
    `);

    res.json({
      notes: result.rows,
      pod: podName,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/notes", async (req, res, next) => {
  try {
    const message =
      typeof req.body.message === "string"
        ? req.body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    if (message.length > 160) {
      return res.status(400).json({
        error: "Message must be 160 characters or less",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO cafe_notes (message)
        VALUES ($1)
        RETURNING id, message, created_at
      `,
      [message]
    );

    res.status(201).json({
      note: result.rows[0],
      pod: podName,
    });
  } catch (error) {
    next(error);
  }
});

/* -----------------------------
   ERROR HANDLING
----------------------------- */

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    error: "The café hit an unexpected problem.",
    pod: podName,
  });
});

/* -----------------------------
   STARTUP
----------------------------- */

async function start() {
  try {
    await initializeDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `Cluster Café backend running on port ${PORT} from pod ${podName}`
      );
    });
  } catch (error) {
    console.error("Unable to initialize Cluster Café:", error);
    process.exit(1);
  }
}

start();

async function shutdown(signal) {
  console.log(`${signal} received. Closing café gracefully.`);

  await pool.end();

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));