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

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            <div class="participants">
              <h5>Current Participants (${details.participants.length}/${details.max_participants})</h5>
              <!-- participants list will be created here -->
            </div>
          `;

          // Build participants list as DOM elements so we can attach delete buttons safely
          const participantsContainer = activityCard.querySelector('.participants');
          if (details.participants.length > 0) {
            const ul = document.createElement('ul');
            details.participants.forEach(p => {
              const li = document.createElement('li');

              const span = document.createElement('span');
              span.className = 'participant-email';
              span.textContent = p;

              const btn = document.createElement('button');
              btn.type = 'button';
              btn.className = 'delete-participant';
              btn.title = 'Unregister participant';
              btn.dataset.activity = name;
              btn.dataset.email = p;
              btn.textContent = '✖';

              // Attach click handler to unregister the participant
              btn.addEventListener('click', async (event) => {
                event.preventDefault();

                if (!confirm(`Remove ${p} from ${name}?`)) return;

                try {
                  const res = await fetch(`/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`, {
                    method: 'DELETE'
                  });

                  const result = await res.json();

                  if (res.ok) {
                    // Refresh activities so counts/availability update correctly
                    await fetchActivities();
                  } else {
                    alert(result.detail || result.message || 'Failed to remove participant');
                  }
                } catch (err) {
                  console.error('Error removing participant:', err);
                  alert('Error removing participant. See console for details.');
                }
              });

              li.appendChild(span);
              li.appendChild(btn);
              ul.appendChild(li);
            });

            participantsContainer.appendChild(ul);
          } else {
            const pno = document.createElement('p');
            pno.className = 'no-participants';
            pno.textContent = 'No participants yet';
            participantsContainer.appendChild(pno);
          }

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
        // Refresh activities so the newly signed-up participant appears without a manual page reload
        await fetchActivities();
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
