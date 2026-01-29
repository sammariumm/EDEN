document.addEventListener("DOMContentLoaded", () => {
  loadJobs();

  const modal = document.getElementById("apply-modal");
  const modalCloseBtn = document.getElementById("modal-close");
  const applyForm = document.getElementById("apply-form");

  modalCloseBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Open modal and set job ID for application
  function openModal(jobId) {
    document.getElementById("job-id").value = jobId;
    modal.style.display = "block";
  }

  function closeModal() {
    modal.style.display = "none";
    applyForm.reset();
  }

  // Handle application form submission
  applyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(applyForm);

    try {
      const res = await fetch("/applications/submit", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to submit application: ${errorText}`);
      }

      alert("Application submitted successfully!");
      closeModal();
    } catch (err) {
      alert("Error submitting application. Please try again.");
      console.error(err);
    }
  });

  // Fetch and display approved job listings
  async function loadJobs() {
    try {
      const res = await fetch("/requests/jobs/approved");

      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const jobs = await res.json();

      const container = document.getElementById("job-list");
      container.innerHTML = "";

      if (jobs.length === 0) {
        container.innerHTML = "<p>No approved job listings available.</p>";
        return;
      }

      jobs.forEach(job => {
        const card = document.createElement("div");
        card.className = "job-card";

        card.innerHTML = `
          <img src="${job.image ?? '/images/placeholder.png'}" alt="">
          <h3>${job.title}</h3>
          <p>${job.description ?? ''}</p>
          <p><strong>Hourly Rate:</strong> ₱${job.hourly_rate ?? 'N/A'}</p>
          <p><strong>Posted by:</strong> ${job.username}</p>
          <button class="apply-btn" data-job-id="${job.id}">Apply</button>
        `;

        container.appendChild(card);
      });

      // Attach event listeners for apply buttons
      document.querySelectorAll(".apply-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const jobId = btn.getAttribute("data-job-id");
          openModal(jobId);
        });
      });

    } catch (err) {
      console.error(err);
    }
  }
});
