const jobStatus = document.querySelector("#job-status");
const jobList = document.querySelector("#job-list");
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

      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = job.$url;
      link.textContent = title;
      item.append(link);
      if (job.Job_Type) item.append(` · ${job.Job_Type}`);
      jobs.append(item);
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
