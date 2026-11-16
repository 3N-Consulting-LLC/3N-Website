const jobStatus = document.querySelector("#job-status");
const jobList = document.querySelector("#job-list");
const jobCard = document.querySelector("#job-card");
const recruit = "https://3nconsultinggroup.zohorecruit.com";
const endpoint = recruit + "/recruit/v2/public/Job_Openings?pagename=Careers&source=CareerSite";

async function listJobs() {
  try {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Zoho job feed is unavailable");
    const { code, data } = await response.json();
    if (code !== "success" || !Array.isArray(data)) throw new Error("Unexpected Zoho response");

    const jobs = document.createDocumentFragment();
    for (const job of data) {
      const title = job.Posting_Title || job.Job_Opening_Name;
      if (!title || typeof job.$url !== "string" || !job.$url.startsWith(recruit + "/jobs/Careers/")) continue;

      const card = jobCard.content.cloneNode(true);
      card.querySelector(".job-title").textContent = title;
      const location = job.Remote_Job === "Yes" ? "Remote" : [job.City, job.Country].filter(Boolean).join(", ");
      const meta = card.querySelector(".job-meta");
      meta.textContent = [location, job.Job_Type === "Any" ? "" : job.Job_Type].filter(Boolean).join(" · ");
      meta.hidden = !meta.textContent;

      const summary = card.querySelector(".job-summary");
      summary.textContent = job.Job_Description?.replaceAll("**", "").trim() ?? "";
      summary.hidden = !summary.textContent;

      const apply = card.querySelector(".job-apply");
      apply.href = job.$url;
      apply.setAttribute("aria-label", `View details and apply for ${title}`);
      jobs.append(card);
    }

    if (!jobs.childElementCount) {
      jobStatus.textContent = "No current openings.";
      return;
    }
    jobList.replaceChildren(jobs);
    jobList.hidden = false;
    jobStatus.hidden = true;
  } catch {
    jobStatus.textContent = "Open the Zoho job board below to see current positions.";
  }
}

listJobs();
