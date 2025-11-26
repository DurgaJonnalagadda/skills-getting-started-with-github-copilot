document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">Select an activity</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const desc = document.createElement("p");
        desc.textContent = details.description;
        activityCard.appendChild(desc);

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        activityCard.appendChild(schedule);

        const spotsLeft = details.max_participants - details.participants.length;
        const safeId = name.replace(/\W/g, "-");
        const availability = document.createElement("p");
        availability.id = `availability-${safeId}`;
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(availability);

        // Participants section
        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsHeading.style.margin = "8px 0 6px";
        participantsHeading.style.fontSize = "0.95rem";
        participantsSection.appendChild(participantsHeading);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          ul.id = `participants-${safeId}`;
          details.participants.forEach((p) => {
            const li = document.createElement("li");

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = p;
            li.appendChild(emailSpan);

            const btn = document.createElement("button");
            btn.className = "delete-btn";
            btn.type = "button";
            btn.title = "Unregister";
            btn.innerHTML = "✕";

            btn.addEventListener("click", async () => {
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, {
                  method: "POST",
                });

                const result = await resp.json();

                if (resp.ok) {
                  li.remove();

                  const availabilityEl = document.getElementById(`availability-${safeId}`);
                  if (availabilityEl) {
                    const match = availabilityEl.textContent.match(/(\d+)/);
                    if (match) {
                      const current = parseInt(match[1], 10);
                      availabilityEl.innerHTML = `<strong>Availability:</strong> ${current + 1} spots left`;
                    }
                  }

                  if (ul.children.length === 0) {
                    const muted = document.createElement("p");
                    muted.textContent = "No participants yet.";
                    muted.className = "muted";
                    participantsSection.replaceChild(muted, ul);
                  }

                  messageDiv.textContent = result.message || "Unregistered successfully";
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                } else {
                  messageDiv.textContent = result.detail || result.message || "Failed to unregister";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (err) {
                console.error("Error unregistering:", err);
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            });

            li.appendChild(btn);
            ul.appendChild(li);
          });
          participantsSection.appendChild(ul);
        } else {
          const muted = document.createElement("p");
          muted.textContent = "No participants yet.";
          muted.className = "muted";
          muted.style.marginTop = "6px";
          participantsSection.appendChild(muted);
        }

        activityCard.appendChild(participantsSection);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
