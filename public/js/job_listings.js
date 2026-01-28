document.addEventListener("DOMContentLoaded", loadJobs);

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
        <p>${job.description}</p>
        <p><strong>Hourly Rate:</strong> ₱${job.hourly_rate}</p>
        <p><strong>Posted by:</strong> ${job.username}</p>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
  }
}
