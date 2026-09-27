let notes = [];
let currentMenuVersion = 1;
let rollingUpdateRunning = false;
let routeBroken = false;

document.addEventListener("DOMContentLoaded", () => {
  const probeCook =
    document.getElementById("probeCook");

  const livenessBadge =
    document.getElementById("livenessBadge");

  const readinessBadge =
    document.getElementById("readinessBadge");

  const trafficStatus =
    document.getElementById("trafficStatus");

  const probeMessage =
    document.getElementById("probeMessage");

  const failReadinessButton =
    document.getElementById("failReadinessButton");

  const failLivenessButton =
    document.getElementById("failLivenessButton");

  let readinessFailed = false;

  if (
    !probeCook ||
    !livenessBadge ||
    !readinessBadge ||
    !trafficStatus ||
    !probeMessage ||
    !failReadinessButton ||
    !failLivenessButton
  ) {
    console.error("Probe simulation elements missing");
    return;
  }

  failReadinessButton.addEventListener("click", async () => {
    failReadinessButton.disabled = true;

    if (!readinessFailed) {
      readinessBadge.textContent =
        "Readiness: FAILED";

      readinessBadge.classList.remove("healthy");
      readinessBadge.classList.add("failed");

      trafficStatus.textContent =
        "Cook stops receiving new orders";

      probeMessage.textContent =
        "The cook is alive, but Kubernetes removes it from Service traffic.";

      failReadinessButton.textContent =
        "Restore Readiness";

      readinessFailed = true;

      await recordSimulationEvent(
        "readiness_failed",
        {
          liveness: "healthy",
          readiness: "failed",
          receivingTraffic: false,
        }
      );
    } else {
      readinessBadge.textContent =
        "Readiness: OK";

      readinessBadge.classList.remove("failed");
      readinessBadge.classList.add("healthy");

      trafficStatus.textContent =
        "Cook receives orders";

      probeMessage.textContent =
        "The cook is healthy and ready.";

      failReadinessButton.textContent =
        "Fail Readiness";

      readinessFailed = false;

      await recordSimulationEvent(
        "readiness_restored",
        {
          liveness: "healthy",
          readiness: "healthy",
          receivingTraffic: true,
        }
      );
    }

    failReadinessButton.disabled = false;
  });

  failLivenessButton.addEventListener("click", async () => {
    failLivenessButton.disabled = true;
    failReadinessButton.disabled = true;

    livenessBadge.textContent =
      "Liveness: FAILED";

    livenessBadge.classList.remove("healthy");
    livenessBadge.classList.add("failed");

    probeCook.classList.add("unhealthy");

    trafficStatus.textContent =
      "Worker unavailable";

    probeMessage.textContent =
      "The cook stopped responding. Kubernetes restarts the container.";

    await recordSimulationEvent(
      "liveness_failed",
      {
        liveness: "failed",
        action: "container_restart",
      }
    );

    await new Promise(resolve =>
      setTimeout(resolve, 1000)
    );

    probeCook.textContent = "💨";

    await new Promise(resolve =>
      setTimeout(resolve, 500)
    );

    probeCook.textContent = "👨‍🍳";
    probeCook.classList.remove("unhealthy");

    livenessBadge.textContent =
      "Liveness: OK";

    livenessBadge.classList.remove("failed");
    livenessBadge.classList.add("healthy");

    trafficStatus.textContent =
      readinessFailed
        ? "Cook is alive but not receiving orders"
        : "Cook receives orders";

    probeMessage.textContent =
      readinessFailed
        ? "Container restarted, but the cook is still not ready for traffic."
        : "Container restarted. The cook is alive and ready again.";

    await recordSimulationEvent(
      "liveness_recovered",
      {
        liveness: "healthy",
        readiness: readinessFailed
          ? "failed"
          : "healthy",
      }
    );

    failLivenessButton.disabled = false;
    failReadinessButton.disabled = false;
  });
});

const notesList = document.getElementById("notesList");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const categoryFilter = document.getElementById("categoryFilter");

const totalCount = document.getElementById("totalCount");
const activeCount = document.getElementById("activeCount");
const hiddenCount = document.getElementById("hiddenCount");
const pinnedCount = document.getElementById("pinnedCount");

const resultCount = document.getElementById("resultCount");
const refreshButton = document.getElementById("refreshButton");
const toast = document.getElementById("toast");

const startRushHourButton =
  document.getElementById("startRushHour");

const customerRow =
  document.getElementById("customerRow");

const queueFill =
  document.getElementById("queueFill");

const cookRow =
  document.getElementById("cookRow");

const visualLoad =
  document.getElementById("visualLoad");

const cookCount =
  document.getElementById("cookCount");

const rushMessage =
  document.getElementById("rushMessage");

const simulatePodFailureButton =
  document.getElementById("simulatePodFailure");

const healKitchen =
  document.getElementById("healKitchen");

const healStatus =
  document.getElementById("healStatus");

const simulateRollingUpdateButton =
  document.getElementById("simulateRollingUpdate");

const versionWorkers =
  document.getElementById("versionWorkers");

const rollingStatus =
  document.getElementById("rollingStatus");

const rolloutFill =
  document.getElementById("rolloutFill");

const rolloutPercent =
  document.getElementById("rolloutPercent");

document.addEventListener("DOMContentLoaded", () => {
  const breakRouteButton =
    document.getElementById("breakRouteButton");

  const routeStatus =
    document.getElementById("routeStatus");

  const endpointCount =
    document.getElementById("endpointCount");

  const routeMessage =
    document.getElementById("routeMessage");

  let routeBroken = false;

  if (
    !breakRouteButton ||
    !routeStatus ||
    !endpointCount ||
    !routeMessage
  ) {
    console.error("Break Route UI elements not found", {
      breakRouteButton,
      routeStatus,
      endpointCount,
      routeMessage,
    });

    return;
  }

  console.log("Break Route simulation ready");

  breakRouteButton.addEventListener("click", async () => {
    console.log("Break Route clicked");

    breakRouteButton.disabled = true;

    if (!routeBroken) {
      routeMessage.textContent =
        "Changing the Service selector...";

      await new Promise(resolve =>
        setTimeout(resolve, 700)
      );

      endpointCount.textContent = "0";
      endpointCount.style.color = "#dd9286";

      routeStatus.textContent =
        "Service exists and Pods are healthy, but the Service cannot find matching Pods.";

      routeMessage.textContent =
        "Orders cannot reach the kitchen.";

      breakRouteButton.textContent =
        "Fix Route";

      routeBroken = true;
    } else {
      routeMessage.textContent =
        "Restoring the correct Service selector...";

      await new Promise(resolve =>
        setTimeout(resolve, 700)
      );

      endpointCount.textContent = "2";
      endpointCount.style.color = "";

      routeStatus.textContent =
        "Service found the backend Pods again.";

      routeMessage.textContent =
        "Orders are reaching the kitchen.";

      breakRouteButton.textContent =
        "Break Route";

      routeBroken = false;
    }

    breakRouteButton.disabled = false;
  });
});

if (failReadinessButton) {
  failReadinessButton.addEventListener("click", async () => {
    if (!readinessFailed) {
      readinessBadge.textContent = "Readiness: FAILED";
      readinessBadge.classList.remove("healthy");
      readinessBadge.classList.add("failed");

      trafficStatus.textContent =
        "Cook stops receiving new orders";

      probeMessage.textContent =
        "The cook is alive, but Kubernetes removes it from Service traffic.";

      failReadinessButton.textContent =
        "Restore Readiness";

      readinessFailed = true;
    } else {
      readinessBadge.textContent = "Readiness: OK";
      readinessBadge.classList.remove("failed");
      readinessBadge.classList.add("healthy");

      trafficStatus.textContent =
        "Cook receives orders";

      probeMessage.textContent =
        "The cook is healthy and ready.";

      failReadinessButton.textContent =
        "Fail Readiness";

      readinessFailed = false;
    }
  });
}

if (failLivenessButton) {
  failLivenessButton.addEventListener("click", async () => {
    if (!livenessFailed) {
      livenessBadge.textContent = "Liveness: FAILED";
      livenessBadge.classList.remove("healthy");
      livenessBadge.classList.add("failed");

      probeCook.classList.add("unhealthy");

      probeMessage.textContent =
        "The cook stopped responding. Kubernetes restarts the container.";

      trafficStatus.textContent =
        "Worker unavailable";

      failLivenessButton.disabled = true;

      await new Promise(resolve =>
        setTimeout(resolve, 1200)
      );

      probeCook.textContent = "💨";

      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );

      probeCook.textContent = "👨‍🍳";
      probeCook.classList.remove("unhealthy");

      livenessBadge.textContent = "Liveness: OK";
      livenessBadge.classList.remove("failed");
      livenessBadge.classList.add("healthy");

      probeMessage.textContent =
        "Container restarted. The cook is alive again.";

      trafficStatus.textContent =
        readinessFailed
          ? "Cook is alive but not receiving orders"
          : "Cook receives orders";

      failLivenessButton.disabled = false;
      livenessFailed = false;
    }
  });
}

async function loadNotes() {
  loadingState.classList.remove("hidden");
  emptyState.classList.add("hidden");
  notesList.innerHTML = "";

  try {
    const response = await fetch("/api/admin/notes");

    if (!response.ok) {
      throw new Error("Could not load notes");
    }

    const data = await response.json();

    notes = data.items || [];

    updateStats();
    renderNotes();

  } catch (error) {
    loadingState.textContent = "Could not load notes.";
    console.error(error);
    return;
  }

  loadingState.classList.add("hidden");
}

async function toggleBrokenRoute() {
  if (!breakRouteButton) return;

  breakRouteButton.disabled = true;

  if (!routeBroken) {
    routeMessage.textContent =
      "Changing the Service selector...";

    await sleep(700);

    endpointCount.textContent = "0";
    endpointCount.style.color = "#dd9286";

    routeStatus.textContent =
      "Service exists, Pods are healthy, but there are no matching endpoints.";

    routeMessage.textContent =
      "Orders cannot reach the kitchen.";

    breakRouteButton.textContent =
      "Fix Route";

    routeBroken = true;

    await recordSimulationEvent(
      "route_broken",
      {
        endpoints: 0,
        reason: "simulated_service_selector_mismatch",
      }
    );
  } else {
    routeMessage.textContent =
      "Restoring the correct Service selector...";

    await sleep(700);

    endpointCount.textContent = "2";
    endpointCount.style.color = "";

    routeStatus.textContent =
      "Service found the backend Pods again.";

    routeMessage.textContent =
      "Orders are reaching the kitchen.";

    breakRouteButton.textContent =
      "Break Route";

    routeBroken = false;

    await recordSimulationEvent(
      "route_restored",
      {
        endpoints: 2,
        status: "healthy",
      }
    );
  }

  breakRouteButton.disabled = false;
}

if (breakRouteButton) {
  breakRouteButton.addEventListener(
    "click",
    toggleBrokenRoute
  );
}

function updateStats() {
  totalCount.textContent = notes.length;

  activeCount.textContent =
    notes.filter(note => note.status === "active").length;

  hiddenCount.textContent =
    notes.filter(note => note.status === "hidden").length;

  pinnedCount.textContent =
    notes.filter(note => note.is_pinned).length;
}


function renderNotes() {
  const search = searchInput.value
    .trim()
    .toLowerCase();

  const selectedStatus = statusFilter.value;
  const selectedCategory = categoryFilter.value;

  const filtered = notes.filter(note => {

    const matchesSearch =
      !search ||
      note.message?.toLowerCase().includes(search) ||
      note.author_name?.toLowerCase().includes(search);

    const matchesStatus =
      selectedStatus === "all" ||
      note.status === selectedStatus;

    const matchesCategory =
      selectedCategory === "all" ||
      note.category === selectedCategory;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory
    );
  });

  notesList.innerHTML = "";

  resultCount.textContent =
    `${filtered.length} result${filtered.length === 1 ? "" : "s"}`;

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtered.forEach(note => {
    notesList.appendChild(createNoteRow(note));
  });
}


function createNoteRow(note) {
  const row = document.createElement("article");

  row.className = "note-row";

  const created = note.created_at
    ? new Date(note.created_at).toLocaleString()
    : "Unknown";

  row.innerHTML = `
    <div class="note-content">

      <div class="note-message">
        ${escapeHtml(note.message)}
      </div>

      <div class="note-meta">
        ${note.author_name
          ? escapeHtml(note.author_name)
          : "Anonymous"}
        ·
        ${created}
        ·
        #${note.id}
      </div>

    </div>

    <div>
      <span class="category-tag">
        ${escapeHtml(note.category || "general")}
      </span>
    </div>

    <div>
      <span class="status-tag status-${note.status}">
        ${escapeHtml(note.status)}
      </span>
    </div>

    <div class="actions">

      ${
        note.status !== "deleted"
          ? `
            <button
              class="action-btn ${note.is_pinned ? "pin-active" : ""}"
              data-action="pin"
              data-id="${note.id}"
            >
              ${note.is_pinned ? "Unpin" : "Pin"}
            </button>
          `
          : ""
      }

      ${
        note.status === "active"
          ? `
            <button
              class="action-btn"
              data-action="hide"
              data-id="${note.id}"
            >
              Hide
            </button>
          `
          : ""
      }

      ${
        note.status === "hidden" ||
        note.status === "deleted"
          ? `
            <button
              class="action-btn"
              data-action="restore"
              data-id="${note.id}"
            >
              Restore
            </button>
          `
          : ""
      }

      ${
        note.status !== "deleted"
          ? `
            <button
              class="action-btn danger"
              data-action="delete"
              data-id="${note.id}"
            >
              Delete
            </button>
          `
          : ""
      }

    </div>
  `;

  return row;
}


notesList.addEventListener("click", async event => {

  const button = event.target.closest("button");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (!id || !action) return;

  button.disabled = true;

  try {

    if (action === "hide") {
      await performAction(
        `/api/admin/notes/${id}/hide`,
        "POST"
      );

      showToast("Note hidden");
    }

    if (action === "restore") {
      await performAction(
        `/api/admin/notes/${id}/restore`,
        "POST"
      );

      showToast("Note restored");
    }

    if (action === "delete") {

      const confirmed = window.confirm(
        "Soft delete this note?"
      );

      if (!confirmed) {
        button.disabled = false;
        return;
      }

      await performAction(
        `/api/admin/notes/${id}`,
        "DELETE"
      );

      showToast("Note deleted");
    }

    if (action === "pin") {

      const note = notes.find(
        item => String(item.id) === String(id)
      );

      const endpoint = note?.is_pinned
        ? `/api/admin/notes/${id}/unpin`
        : `/api/admin/notes/${id}/pin`;

      await performAction(
        endpoint,
        "POST"
      );

      showToast(
        note?.is_pinned
          ? "Note unpinned"
          : "Note pinned"
      );
    }

    await loadNotes();

  } catch (error) {

    console.error(error);

    showToast("Something went wrong");

    button.disabled = false;
  }
});


async function performAction(url, method) {

  const response = await fetch(url, {
    method
  });

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status}`
    );
  }

  return response.json();
}



function showToast(message) {

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}


function escapeHtml(value = "") {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function recordSimulationEvent(
  eventType,
  metadata = {}
) {
  try {
    const response = await fetch(
      "/api/events/simulation",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType,
          metadata,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Event request failed: ${response.status}`
      );
    }

    return await response.json();

  } catch (error) {
    console.error(
      "Could not record simulation event:",
      eventType,
      error
    );
  }
}

searchInput.addEventListener(
  "input",
  renderNotes
);

statusFilter.addEventListener(
  "change",
  renderNotes
);

categoryFilter.addEventListener(
  "change",
  renderNotes
);

refreshButton.addEventListener(
  "click",
  loadNotes
);


loadNotes();

async function startRushHour() {
  if (!startRushHourButton) return;

  startRushHourButton.disabled = true;

  await recordSimulationEvent(
    "rush_hour_started",
    {
      visualStartingCooks: 2,
      maxVisualCooks: 5,
    }
  );

  rushMessage.textContent =
    "Customers are entering the café...";

  let load = 10;
  let cooks = 2;

  setRushVisual(load, cooks);

  const visualInterval = setInterval(() => {
    load = Math.min(load + 12, 95);

    if (load >= 45 && cooks < 3) {
      cooks = 3;
    }

    if (load >= 65 && cooks < 4) {
      cooks = 4;
    }

    if (load >= 82 && cooks < 5) {
      cooks = 5;
    }

    setRushVisual(load, cooks);
  }, 550);

  try {
    rushMessage.textContent =
      "Rush hour started — backend CPU work is running.";

    const requests = [];

    for (let wave = 0; wave < 5; wave++) {
      for (let request = 0; request < 6; request++) {
        requests.push(
          fetch("/api/work?ms=700").then(response => {
            if (!response.ok) {
              throw new Error("Work request failed");
            }

            return response.json();
          })
        );
      }

      await sleep(300);
    }

    await Promise.allSettled(requests);

    rushMessage.textContent =
      "Rush complete. Check the real HPA with kubectl.";

    await recordSimulationEvent(
      "rush_hour_completed",
      {
        status: "completed",
        maxVisualCooks: cooks,
        finalVisualLoad: load,
      }
    );
  } catch (error) {
    console.error("Rush Hour failed:", error);

    rushMessage.textContent =
      "Could not generate backend load.";

    await recordSimulationEvent(
      "rush_hour_completed",
      {
        status: "failed",
      }
    );
  } finally {
    clearInterval(visualInterval);

    await sleep(900);

    load = 30;
    setRushVisual(load, cooks);

    await sleep(900);

    cooks = 2;
    load = 5;

    setRushVisual(load, cooks);

    rushMessage.textContent =
      "Café is calm again.";

    startRushHourButton.disabled = false;
  }
}

function setRushVisual(load, cooks) {
  visualLoad.textContent = `${load}%`;
  cookCount.textContent = cooks;

  queueFill.style.width = `${load}%`;

  const customerCount =
    Math.max(4, Math.ceil(load / 8));

  customerRow.textContent =
    Array(customerCount)
      .fill("🙂")
      .join(" ");

  cookRow.innerHTML = "";

  for (let index = 0; index < cooks; index++) {
    const cook = document.createElement("span");

    cook.className = "cook";
    cook.textContent = "👨‍🍳";

    cookRow.appendChild(cook);
  }
}

function sleep(milliseconds) {
  return new Promise(resolve =>
    setTimeout(resolve, milliseconds)
  );
}

if (startRushHourButton) {
  startRushHourButton.addEventListener(
    "click",
    startRushHour
  );
}

async function simulatePodFailure() {
  if (!simulatePodFailureButton) return;

  simulatePodFailureButton.disabled = true;

  await recordSimulationEvent(
    "self_heal_simulation_started",
    {
      desiredReplicas: 2,
    }
  );

  healStatus.textContent =
    "One cook suddenly disappears...";

  const cooks =
    healKitchen.querySelectorAll(".heal-cook");

  if (cooks[1]) {
    cooks[1].classList.add("removing");
  }

  await sleep(900);

  if (cooks[1]) {
    cooks[1].remove();
  }

  healStatus.textContent =
    "Deployment notices that one worker is missing.";

  await sleep(1200);

  healStatus.textContent =
    "Kubernetes creates a replacement Pod...";

  await sleep(1000);

  const newCook =
    document.createElement("span");

  newCook.className =
    "heal-cook new-cook";

  newCook.textContent =
    "👨‍🍳";

  healKitchen.appendChild(newCook);

  healStatus.textContent =
    "Kitchen restored: desired replicas are healthy again.";

  await recordSimulationEvent(
    "self_heal_simulation_completed",
    {
      restoredReplicas: 2,
      status: "healthy",
    }
  );

  await sleep(1600);

  healStatus.textContent =
    "Kitchen is healthy.";

  simulatePodFailureButton.disabled = false;
}

if (simulatePodFailureButton) {
  simulatePodFailureButton.addEventListener(
    "click",
    simulatePodFailure
  );
}

async function simulateRollingUpdate() {
  if (!simulateRollingUpdateButton || rollingUpdateRunning) return;

  rollingUpdateRunning = true;
  simulateRollingUpdateButton.disabled = true;

  const oldVersion = currentMenuVersion;
  const newVersion = oldVersion + 1;

  await recordSimulationEvent(
    "rolling_update_started",
    {
      fromVersion: oldVersion,
      toVersion: newVersion,
    }
  );

  versionWorkers.innerHTML = `
    <span class="version-cook old">
      👨‍🍳 <small>v${oldVersion}</small>
    </span>

    <span class="version-cook old">
      👨‍🍳 <small>v${oldVersion}</small>
    </span>
  `;

  rolloutFill.style.width = "0%";
  rolloutPercent.textContent = "0%";

  rollingStatus.textContent =
    `Preparing menu v${newVersion}...`;

  await sleep(700);

  rollingStatus.textContent =
    `Rolling update started: v${oldVersion} → v${newVersion}`;

  rolloutFill.style.width = "20%";
  rolloutPercent.textContent = "20%";

  await sleep(700);

  let oldCooks =
    versionWorkers.querySelectorAll(".version-cook.old");

  if (oldCooks[0]) {
    oldCooks[0].classList.add("leaving");

    await sleep(400);

    oldCooks[0].remove();
  }

  const firstNewCook = createVersionCook(
    newVersion,
    "new"
  );

  versionWorkers.appendChild(firstNewCook);

  rolloutFill.style.width = "50%";
  rolloutPercent.textContent = "50%";

  rollingStatus.textContent =
    `Mixed shift: one v${oldVersion} cook and one v${newVersion} cook are serving.`;

  await sleep(1200);

  oldCooks =
    versionWorkers.querySelectorAll(".version-cook.old");

  if (oldCooks[0]) {
    oldCooks[0].classList.add("leaving");

    await sleep(400);

    oldCooks[0].remove();
  }

  const secondNewCook = createVersionCook(
    newVersion,
    "new"
  );

  versionWorkers.appendChild(secondNewCook);

  rolloutFill.style.width = "100%";
  rolloutPercent.textContent = "100%";

  currentMenuVersion = newVersion;

  rollingStatus.textContent =
    `Release complete. Both cooks are now serving menu v${currentMenuVersion}.`;

  simulateRollingUpdateButton.textContent =
    `Release Menu v${currentMenuVersion + 1}`;

  await recordSimulationEvent(
    "rolling_update_completed",
    {
      version: currentMenuVersion,
      status: "completed",
    }
  );

  await sleep(1200);

  versionWorkers
    .querySelectorAll(".version-cook")
    .forEach((cook) => {
      cook.classList.remove("new");
      cook.classList.add("old");
    });

  rollingUpdateRunning = false;
  simulateRollingUpdateButton.disabled = false;
}

function createVersionCook(version, stateClass) {
  const cook = document.createElement("span");

  cook.className =
    `version-cook ${stateClass}`;

  cook.innerHTML =
    `👨‍🍳 <small>v${version}</small>`;

  return cook;
}

if (simulateRollingUpdateButton) {
  simulateRollingUpdateButton.addEventListener(
    "click",
    simulateRollingUpdate
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const eventsList =
    document.getElementById("eventsList");

  const eventsLoading =
    document.getElementById("eventsLoading");

  const eventsEmpty =
    document.getElementById("eventsEmpty");

  const refreshEventsButton =
    document.getElementById("refreshEventsButton");

  if (
    !eventsList ||
    !eventsLoading ||
    !eventsEmpty
  ) {
    console.error("Activity timeline elements missing");
    return;
  }

  async function loadEvents() {
    eventsLoading.classList.remove("hidden");
    eventsEmpty.classList.add("hidden");
    eventsList.innerHTML = "";

    try {
      const response =
        await fetch("/api/admin/events");

      if (!response.ok) {
        throw new Error(
          `Events request failed: ${response.status}`
        );
      }

      const data = await response.json();
      const events = data.items || [];

      eventsLoading.classList.add("hidden");

      if (!events.length) {
        eventsEmpty.classList.remove("hidden");
        return;
      }

      eventsList.innerHTML = events
        .map(event => {
          return `
            <div class="activity-item">
              <div class="activity-dot"></div>

              <div class="activity-main">
                <div class="activity-title">
                  ${formatEventName(event.event_type)}
                </div>

                <div class="activity-meta">
                  ${escapeHtml(event.event_source || "system")}
                  ${
                    event.entity_id
                      ? ` · ${escapeHtml(event.entity_type || "item")} #${event.entity_id}`
                      : ""
                  }
                </div>
              </div>

              <div class="activity-time">
                ${new Date(event.created_at).toLocaleString()}
              </div>
            </div>
          `;
        })
        .join("");

    } catch (error) {
      console.error("Activity load failed:", error);

      eventsLoading.textContent =
        "Could not load café activity.";
    }
  }

  function formatEventName(eventType) {
    const names = {
      note_created: "Memory added",
      note_hidden: "Memory hidden",
      note_deleted: "Memory deleted",
      note_pinned: "Memory pinned",
      note_unpinned: "Memory unpinned",
      rush_hour_started: "Rush Hour started",
      order_traced: "Order journey started",
      self_heal_simulation_started:
        "Cook failure simulation started",
      rolling_update_simulation_started:
        "Menu rollout simulation started",
    };

    return names[eventType] ||
      String(eventType || "activity")
        .replaceAll("_", " ");
  }

  if (refreshEventsButton) {
    refreshEventsButton.addEventListener(
      "click",
      loadEvents
    );
  }

  loadEvents();
});