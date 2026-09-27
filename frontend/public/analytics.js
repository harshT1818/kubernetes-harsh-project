document.addEventListener(
  "DOMContentLoaded",
  () => {
    const totalSimulations =
      document.getElementById(
        "totalSimulations"
      );

    const totalNotes =
      document.getElementById(
        "totalNotes"
      );

    const rushHourCount =
      document.getElementById(
        "rushHourCount"
      );

    const mostExplored =
      document.getElementById(
        "mostExplored"
      );

    const activeNotes =
      document.getElementById(
        "activeNotes"
      );

    const hiddenNotes =
      document.getElementById(
        "hiddenNotes"
      );

    const pinnedNotes =
      document.getElementById(
        "pinnedNotes"
      );

    const conceptBars =
      document.getElementById(
        "conceptBars"
      );

    const recentActivity =
      document.getElementById(
        "recentActivity"
      );

    const refreshButton =
      document.getElementById(
        "refreshAnalytics"
      );

    const errorState =
      document.getElementById(
        "errorState"
      );


    async function loadAnalytics() {
      errorState.classList.add(
        "hidden"
      );

      try {
        const response =
          await fetch(
            "/api/admin/analytics"
          );

        if (!response.ok) {
          throw new Error(
            `Analytics failed: ${response.status}`
          );
        }

        const data =
          await response.json();

        renderStats(data);
        renderConcepts(
          data.simulations?.concepts || {}
        );

        renderRecentActivity(
          data.recentActivity || []
        );

      } catch (error) {
        console.error(
          "Analytics error:",
          error
        );

        errorState.classList.remove(
          "hidden"
        );
      }
    }


    function renderStats(data) {
      const notes =
        data.notes || {};

      const simulations =
        data.simulations || {};

      const concepts =
        simulations.concepts || {};

      totalSimulations.textContent =
        simulations.total || 0;

      totalNotes.textContent =
        notes.total_notes || 0;

      activeNotes.textContent =
        notes.active_notes || 0;

      hiddenNotes.textContent =
        notes.hidden_notes || 0;

      pinnedNotes.textContent =
        notes.pinned_notes || 0;

      rushHourCount.textContent =
        concepts.rushHour || 0;

      mostExplored.textContent =
        getMostExploredConcept(
          concepts
        );
    }


    function renderConcepts(concepts) {
      const conceptData = [
        {
          label: "Rush Hour",
          value:
            concepts.rushHour || 0,
        },

        {
          label: "Rolling Update",
          value:
            concepts.rollingUpdate || 0,
        },

        {
          label: "Self Healing",
          value:
            concepts.selfHealing || 0,
        },

        {
          label: "Routing",
          value:
            concepts.routing || 0,
        },

        {
          label: "Probes",
          value:
            concepts.probes || 0,
        },
      ];

      const maximum =
        Math.max(
          ...conceptData.map(
            item => item.value
          ),
          1
        );

      conceptBars.innerHTML =
        conceptData
          .map(item => {
            const percentage =
              (item.value / maximum) *
              100;

            return `
              <div class="concept-row">

                <div class="concept-name">
                  ${item.label}
                </div>

                <div class="bar-track">

                  <div
                    class="bar-fill"
                    style="width:${percentage}%"
                  ></div>

                </div>

                <div class="concept-count">
                  ${item.value}
                </div>

              </div>
            `;
          })
          .join("");
    }


    function renderRecentActivity(
      events
    ) {
      if (!events.length) {
        recentActivity.innerHTML =
          "No activity recorded yet.";

        return;
      }

      recentActivity.innerHTML =
        events
          .map(event => {
            return `
              <div class="activity-item">

                <div class="activity-dot">
                </div>

                <div>

                  <div class="activity-title">
                    ${formatEventName(
                      event.event_type
                    )}
                  </div>

                  <div class="activity-meta">
                    ${escapeHtml(
                      event.event_source ||
                      "system"
                    )}
                  </div>

                </div>

                <div class="activity-time">
                  ${new Date(
                    event.created_at
                  ).toLocaleString()}
                </div>

              </div>
            `;
          })
          .join("");
    }


    function getMostExploredConcept(
      concepts
    ) {
      const options = [
        [
          "Rush Hour",
          concepts.rushHour || 0,
        ],

        [
          "Rolling Updates",
          concepts.rollingUpdate || 0,
        ],

        [
          "Self Healing",
          concepts.selfHealing || 0,
        ],

        [
          "Routing",
          concepts.routing || 0,
        ],

        [
          "Health Probes",
          concepts.probes || 0,
        ],
      ];

      options.sort(
        (a, b) => b[1] - a[1]
      );

      if (options[0][1] === 0) {
        return "No data yet";
      }

      return options[0][0];
    }


    function formatEventName(
      eventType
    ) {
      const names = {
        note_created:
          "Memory added",

        note_hidden:
          "Memory hidden",

        note_deleted:
          "Memory deleted",

        note_pinned:
          "Memory pinned",

        note_unpinned:
          "Memory unpinned",

        rush_hour_started:
          "Rush Hour started",

        rush_hour_completed:
          "Rush Hour completed",

        self_heal_simulation_started:
          "Cook failure started",

        self_heal_simulation_completed:
          "Kitchen recovered",

        rolling_update_started:
          "Menu rollout started",

        rolling_update_completed:
          "Menu rollout completed",

        route_broken:
          "Waiter route broken",

        route_restored:
          "Waiter route restored",

        readiness_failed:
          "Cook became unready",

        readiness_restored:
          "Cook became ready",

        liveness_failed:
          "Cook stopped responding",

        liveness_recovered:
          "Cook restarted",
      };

      return (
        names[eventType] ||
        String(eventType || "Activity")
          .replaceAll("_", " ")
      );
    }


    function escapeHtml(
      value = ""
    ) {
      return String(value)
        .replaceAll(
          "&",
          "&amp;"
        )
        .replaceAll(
          "<",
          "&lt;"
        )
        .replaceAll(
          ">",
          "&gt;"
        )
        .replaceAll(
          '"',
          "&quot;"
        )
        .replaceAll(
          "'",
          "&#039;"
        );
    }


    if (refreshButton) {
      refreshButton.addEventListener(
        "click",
        loadAnalytics
      );
    }


    loadAnalytics();
  }
);