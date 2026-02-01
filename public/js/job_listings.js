document.addEventListener("DOMContentLoaded", () => {
  const jobSearchInput = document.getElementById("job-search");

  loadJobs();

  const modal = document.getElementById("apply-modal");
  const modalCloseBtn = document.getElementById("modal-close");

  // Views inside modal
  const choiceView = document.getElementById("choice-view");
  const applyForm = document.getElementById("apply-form");

  // Buttons for choices
  const chooseApplyBtn = document.getElementById("choose-apply-btn");
  const chooseAvailBtn = document.getElementById("choose-avail-btn");

  let currentJob = null;

  modalCloseBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  function openModal(job) {
    currentJob = job;
    document.getElementById("job-id").value = job.id;
    choiceView.style.display = "block";
    applyForm.style.display = "none";
    applyForm.reset();
    modal.style.display = "block";
  }

  function closeModal() {
    modal.style.display = "none";
    choiceView.style.display = "block";
    applyForm.style.display = "none";
    applyForm.reset();
    currentJob = null;
  }

  // User chooses to apply for job: show application form
  chooseApplyBtn.addEventListener("click", () => {
    choiceView.style.display = "none";
    applyForm.style.display = "block";
  });

  // User chooses to avail service: send request and close modal
  chooseAvailBtn.addEventListener("click", async () => {
    if (!currentJob) return;

    try {
      const res = await fetch("/requests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          type: "service_avail",
          title: `Service Avail: ${currentJob.title}`,
          description: `Service availed for job: ${currentJob.description}`,
          parent_job_id: currentJob.id
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      alert("Service avail request submitted!");
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Failed to avail service. Please try again.");
    }
  });

  // Handle application form submission
  applyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(applyForm);

    try {
      const res = await fetch("/applications/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
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

  // Load job listings, now with search support
  async function loadJobs(searchTerm = "") {
    try {
      let url = "/requests/jobs/approved";
      if (searchTerm.trim()) {
        url += `?search=${encodeURIComponent(searchTerm.trim())}`;
      }

      const res = await fetch(url);

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
          <p>${job.description ?? ""}</p>
          <p><strong>Hourly Rate:</strong> ₱${job.hourly_rate ?? "N/A"}</p>
          <p><strong>Posted by:</strong> ${job.username}</p>
          <button class="apply-btn">Apply / Avail</button>
        `;

        card.querySelector(".apply-btn").addEventListener("click", () => {
          openModal(job);
        });

        container.appendChild(card);
      });
    } catch (err) {
      console.error(err);
    }
  }

  // Search input event listener
  jobSearchInput.addEventListener("input", () => {
    loadJobs(jobSearchInput.value);
  });
});

function sendMail() {

    let parms = {
      email : document.getElementById("avail_email").value,
    }
    emailjs.send("service_hlabdx8","template_3cg6671",parms).then(alert("Please check your E-mail."))
  }