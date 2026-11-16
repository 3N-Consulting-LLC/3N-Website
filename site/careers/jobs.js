const jobStatus = document.querySelector("#job-status");
const jobList = document.querySelector("#job-list");
const jobCard = document.querySelector("#job-card");
const jobFilters = document.querySelector("#job-filters");
const search = document.querySelector("#job-search");
const type = document.querySelector("#job-type");
const remoteOnly = document.querySelector("#job-remote");
const recruit = "https://3nconsultinggroup.zohorecruit.com";
const endpoint = recruit + "/recruit/v2/public/Job_Openings?pagename=Careers&source=CareerSite";

function makeCard(job) {
  const card = jobCard.content.cloneNode(true);
  card.querySelector(".job-title").textContent = job.title;

  const fields = {
    ".job-type": job.type,
    ".job-meta": [job.location, job.experience].filter(Boolean).join(" · "),
    ".job-summary": job.summary,
  };
  for (const [selector, value] of Object.entries(fields)) {
    const field = card.querySelector(selector);
    field.textContent = value;
    field.hidden = !value;
  }

  const apply = card.querySelector(".job-apply");
  apply.href = job.url;
  apply.setAttribute("aria-label", `View details and apply for ${job.title}`);
  return card;
}

function renderJobs(jobs) {
  const query = search.value.trim().toLowerCase();
  const matches = jobs.filter(job =>
    (!type.value || job.type === type.value) &&
    (!remoteOnly.checked || job.remote) &&
    `${job.title} ${job.location}`.toLowerCase().includes(query)
  );

  jobList.replaceChildren(...matches.map(makeCard));
  jobList.hidden = !matches.length;
  jobStatus.textContent = matches.length
    ? `${matches.length} ${matches.length === 1 ? "opening" : "openings"}`
    : "No openings match your search.";
}

async function listJobs() {
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Zoho job feed is unavailable");
    const { code, data } = await response.json();
    if (code !== "success" || !Array.isArray(data)) throw new Error("Unexpected Zoho response");

    const jobs = [];
    for (const job of data) {
      const title = job.Posting_Title || job.Job_Opening_Name;
      if (!title || typeof job.$url !== "string" || !job.$url.startsWith(recruit + "/jobs/Careers/")) continue;
      const remote = job.Remote_Job === "Yes";
      jobs.push({
        title,
        remote,
        location: remote ? "Remote" : [job.City, job.Country].filter(Boolean).join(", "),
        type: job.Job_Type === "Any" ? "" : job.Job_Type,
        experience: job.Work_Experience,
        summary: job.Job_Description?.replaceAll("**", "").trim() ?? "",
        url: job.$url,
      });
    }

    if (!jobs.length) {
      jobStatus.textContent = "No current openings.";
      return;
    }

    const types = Array.from(new Set(jobs.map(job => job.type).filter(Boolean))).sort();
    type.append(...types.map(value => new Option(value, value)));
    search.addEventListener("input", () => renderJobs(jobs));
    type.addEventListener("change", () => renderJobs(jobs));
    remoteOnly.addEventListener("change", () => renderJobs(jobs));
    jobFilters.hidden = false;
    renderJobs(jobs);
  } catch {
    jobStatus.textContent = "Open the Zoho job board below to see current positions.";
  }
}

listJobs();
