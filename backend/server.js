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
    author_name VARCHAR(60),
    category VARCHAR(40) NOT NULL DEFAULT 'general',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
  )
 `);
  console.log("Cluster Café database initialized");
  await pool.query(`
    ALTER TABLE cafe_notes
      ADD COLUMN IF NOT EXISTS author_name VARCHAR(60),
      ADD COLUMN IF NOT EXISTS category VARCHAR(40) NOT NULL DEFAULT 'general',
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cafe_events (
      id BIGSERIAL PRIMARY KEY,
      event_type VARCHAR(60) NOT NULL,
      event_source VARCHAR(40) NOT NULL DEFAULT 'website',
      entity_type VARCHAR(40),
      entity_id BIGINT,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
   )
`);
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

app.get("/api/notes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        message,
        author_name,
        category,
        is_pinned,
        is_featured,
        created_at
      FROM cafe_notes
      WHERE status = 'active'
      ORDER BY is_pinned DESC, created_at DESC
      LIMIT 50
    `);

    res.json({
      items: result.rows,
    });
  } catch (error) {
    console.error("Load notes error:", error);
    res.status(500).json({
      error: "Could not load notes.",
    });
  }
});

app.post("/api/notes", async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const authorName = String(req.body.authorName || "").trim();
    const category = String(req.body.category || "general").trim();

    const allowedCategories = [
      "general",
      "persistence",
      "kubernetes",
      "feedback",
    ];

    if (!message || message.length > 160) {
      return res.status(400).json({
        error: "Message must be between 1 and 160 characters.",
      });
    }

    if (authorName.length > 60) {
      return res.status(400).json({
        error: "Author name must be 60 characters or less.",
      });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        error: "Invalid category.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO cafe_notes (
        message,
        author_name,
        category
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [message, authorName || null, category]
    );

    const note = result.rows[0];

    await pool.query(
      `
      INSERT INTO cafe_events (
        event_type,
        event_source,
        entity_type,
        entity_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        "note_created",
        "website",
        "note",
        note.id,
        JSON.stringify({
          category: note.category,
        }),
      ]
    );

    res.status(201).json({
      success: true,
      note,
    });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({
      error: "Could not create note.",
    });
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

app.get("/api/admin/notes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM cafe_notes
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({
      items: result.rows,
    });
  } catch (error) {
    console.error("Admin notes error:", error);
    res.status(500).json({
      error: "Could not load admin notes.",
    });
  }
});

app.post("/api/admin/notes/:id/hide", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE cafe_notes
      SET
        status = 'hidden',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Note not found.",
      });
    }

    await pool.query(
      `
      INSERT INTO cafe_events (
        event_type,
        event_source,
        entity_type,
        entity_id
      )
      VALUES ($1, $2, $3, $4)
      `,
      ["note_hidden", "admin", "note", id]
    );

    res.json({
      success: true,
      note: result.rows[0],
    });
  } catch (error) {
    console.error("Hide note error:", error);
    res.status(500).json({
      error: "Could not hide note.",
    });
  }
});

app.post("/api/admin/notes/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE cafe_notes
      SET
        status = 'active',
        deleted_at = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Note not found.",
      });
    }

    res.json({
      success: true,
      note: result.rows[0],
    });
  } catch (error) {
    console.error("Restore note error:", error);
    res.status(500).json({
      error: "Could not restore note.",
    });
  }
});

app.delete("/api/admin/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE cafe_notes
      SET
        status = 'deleted',
        deleted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: "Note not found.",
      });
    }

    await pool.query(
      `
      INSERT INTO cafe_events (
        event_type,
        event_source,
        entity_type,
        entity_id
      )
      VALUES ($1, $2, $3, $4)
      `,
      ["note_deleted", "admin", "note", id]
    );

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({
      error: "Could not delete note.",
    });
  }
});

app.post("/api/admin/notes/:id/pin", async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE cafe_notes
      SET
        is_pinned = TRUE,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [req.params.id]
    );

    await pool.query(
      `
      INSERT INTO cafe_events (
        event_type,
        event_source,
        entity_type,
        entity_id
      )
      VALUES ($1, $2, $3, $4)
      `,
      ["note_pinned", "admin", "note", req.params.id]
    );

    res.json({
      success: true,
      note: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not pin note.",
    });
  }
});

app.post("/api/admin/notes/:id/unpin", async (req, res) => {
  try {
    const result = await pool.query(
      `
      UPDATE cafe_notes
      SET
        is_pinned = FALSE,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [req.params.id]
    );

    await pool.query(
      `
      INSERT INTO cafe_events (
        event_type,
        event_source,
        entity_type,
        entity_id
      )
      VALUES ($1, $2, $3, $4)
      `,
      ["note_unpinned", "admin", "note", req.params.id]
    );

    res.json({
      success: true,
      note: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      error: "Could not unpin note.",
    });
  }
});

app.get("/api/admin/events", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        event_type,
        event_source,
        entity_type,
        entity_id,
        metadata,
        created_at
      FROM cafe_events
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json({
      items: result.rows,
    });
  } catch (error) {
    console.error("Admin events error:", error);

    res.status(500).json({
      error: "Could not load activity.",
    });
  }
});

app.post("/api/events/simulation", async (req, res) => {
  try {
    const { eventType, metadata = {} } = req.body;

    const allowedEvents = [
      "rush_hour_started",
      "rush_hour_completed",

      "self_heal_simulation_started",
      "self_heal_simulation_completed",

      "rolling_update_started",
      "rolling_update_completed",

      "route_broken",
      "route_restored",

      "readiness_failed",
      "readiness_restored",

      "liveness_failed",
      "liveness_recovered",
    ];

    if (!allowedEvents.includes(eventType)) {
      return res.status(400).json({
        error: "Unsupported event type.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO cafe_events (
        event_type,
        event_source,
        entity_type,
        metadata
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        eventType,
        "simulation",
        "kubernetes_demo",
        JSON.stringify(metadata),
      ]
    );

    res.status(201).json({
      success: true,
      event: result.rows[0],
    });
  } catch (error) {
    console.error("Simulation event error:", error);

    res.status(500).json({
      error: "Could not record simulation event.",
    });
  }
});

app.get("/api/admin/analytics", async (req, res) => {
  try {
    const notesResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_notes,
        COUNT(*) FILTER (WHERE status = 'active')::int AS active_notes,
        COUNT(*) FILTER (WHERE status = 'hidden')::int AS hidden_notes,
        COUNT(*) FILTER (WHERE is_pinned = TRUE)::int AS pinned_notes
      FROM cafe_notes
    `);

    const eventCountsResult = await pool.query(`
      SELECT
        event_type,
        COUNT(*)::int AS count
      FROM cafe_events
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const recentActivityResult = await pool.query(`
      SELECT
        id,
        event_type,
        event_source,
        metadata,
        created_at
      FROM cafe_events
      ORDER BY created_at DESC
      LIMIT 10
    `);

    const eventCounts = {};

    for (const row of eventCountsResult.rows) {
      eventCounts[row.event_type] = row.count;
    }

    const conceptCounts = {
      rushHour:
        eventCounts.rush_hour_started || 0,

      rollingUpdate:
        eventCounts.rolling_update_started || 0,

      selfHealing:
        eventCounts.self_heal_simulation_started || 0,

      routing:
        eventCounts.route_broken || 0,

      probes:
        (eventCounts.readiness_failed || 0) +
        (eventCounts.liveness_failed || 0),
    };

    const totalSimulations =
      conceptCounts.rushHour +
      conceptCounts.rollingUpdate +
      conceptCounts.selfHealing +
      conceptCounts.routing +
      conceptCounts.probes;

    res.json({
      notes: notesResult.rows[0],

      simulations: {
        total: totalSimulations,
        concepts: conceptCounts,
      },

      eventCounts,

      recentActivity: recentActivityResult.rows,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      error: "Could not load analytics.",
    });
  }
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