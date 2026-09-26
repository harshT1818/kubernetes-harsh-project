const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

/* -----------------------------
   SYSTEM STATUS
----------------------------- */

async function refreshSystemStatus() {
  const status = $("#systemStatus");

  try {
    const data = await api("/api/status");

    status.classList.add("healthy");
    status.innerHTML = `
      <span class="status-dot"></span>
      Café open · ${data.pod}
    `;
  } catch {
    status.classList.remove("healthy");
    status.innerHTML = `
      <span class="status-dot"></span>
      Café unavailable
    `;
  }
}

/* -----------------------------
   REQUEST JOURNEY
----------------------------- */

async function traceOrder() {
  const button = $("#traceRequest");
  const responseBox = $("#traceResponse");
  const nodes = $$(".journey-node");

  button.disabled = true;
  button.textContent = "Order travelling...";

  nodes.forEach((node) => node.classList.remove("active"));

  for (const node of nodes.slice(0, 4)) {
    node.classList.add("active");
    await sleep(550);
    node.classList.remove("active");
  }

  try {
    const resultPromise = api("/api/events");

    nodes[4].classList.add("active");

    const result = await resultPromise;

    await sleep(500);

    nodes[4].classList.remove("active");

    responseBox.innerHTML = `
      <strong>✓ Coffee served</strong>&nbsp;&nbsp;
      Pod: ${result.pod} ·
      PostgreSQL: ${new Date(result.databaseTime).toLocaleTimeString()}
    `;

    showToast(`Order handled by ${result.pod}`);
  } catch (error) {
    responseBox.textContent =
      "The order failed somewhere in the café. Time to troubleshoot.";

    showToast("Order failed");
  } finally {
    button.disabled = false;
    button.textContent = "Send another coffee order";
  }
}

$("#traceRequest").addEventListener("click", traceOrder);

$("#sendOrderHero").addEventListener("click", () => {
  $("#journey").scrollIntoView({ behavior: "smooth" });

  setTimeout(traceOrder, 700);
});

/* -----------------------------
   RUSH HOUR / REAL CPU LOAD
----------------------------- */

let rushRunning = false;

async function startRushHour() {
  if (rushRunning) return;

  rushRunning = true;

  const button = $("#startRush");
  const status = $("#rushStatus");
  const bar = $("#loadBar");

  button.disabled = true;
  button.textContent = "Rush hour running...";

  try {
    const waves = 7;
    const requestsPerWave = 8;

    for (let wave = 1; wave <= waves; wave++) {
      const progress = Math.round((wave / waves) * 100);

      bar.style.width = `${Math.max(12, progress)}%`;

      status.textContent =
        wave < 3
          ? "Orders are piling up..."
          : wave < 6
            ? "Kitchen is busy. HPA should notice soon."
            : "Maximum rush. Kubernetes may add more workers.";

      const jobs = Array.from({ length: requestsPerWave }, () =>
        fetch("/api/work?ms=700").catch(() => null)
      );

      await Promise.allSettled(jobs);
      await sleep(450);
    }

    bar.style.width = "100%";

    status.textContent =
      "Rush sent. Watch your HPA — Kubernetes can scale the kitchen from 2 to 5 workers.";

    showToast("Rush hour complete — check HPA");
  } finally {
    setTimeout(() => {
      bar.style.width = "8%";
      status.textContent =
        "Traffic is calming down. HPA will eventually scale workers back down.";

      button.disabled = false;
      button.textContent = "Start rush hour";

      rushRunning = false;
    }, 3500);
  }
}

$("#startRush").addEventListener("click", startRushHour);

/* -----------------------------
   POSTGRES MEMORY JAR
----------------------------- */

const noteInput = $("#noteInput");
const charCount = $("#charCount");

noteInput.addEventListener("input", () => {
  charCount.textContent = noteInput.value.length;
});

async function loadNotes() {
  const list = $("#notesList");

  try {
    const { notes } = await api("/api/notes");

    if (!notes.length) {
      list.innerHTML = `
        <div class="empty-state">
          The jar is empty. Leave the first note.
        </div>
      `;
      return;
    }

    list.innerHTML = notes
      .map(
        (note) => `
          <div class="note">
            <p>${escapeHtml(note.message)}</p>
            <small>
              ${new Date(note.created_at).toLocaleString()}
              · PostgreSQL
            </small>
          </div>
        `
      )
      .join("");
  } catch {
    list.innerHTML = `
      <div class="empty-state">
        Couldn't open the Memory Jar.
      </div>
    `;
  }
}

$("#noteForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = noteInput.value.trim();

  if (!message) return;

  try {
    await api("/api/notes", {
      method: "POST",
      body: JSON.stringify({ message }),
    });

    noteInput.value = "";
    charCount.textContent = "0";

    await loadNotes();

    showToast("Saved permanently in PostgreSQL");
  } catch {
    showToast("Couldn't save the note");
  }
});

$("#refreshNotes").addEventListener("click", loadNotes);

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

/* -----------------------------
   BOOT
----------------------------- */

refreshSystemStatus();
loadNotes();

setInterval(refreshSystemStatus, 15000);