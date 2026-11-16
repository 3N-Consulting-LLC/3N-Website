function setupTabs(selector, onSelect) {
  const tabs = [...document.querySelectorAll(selector)];
  function select(tab, automatic = false) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    }
    onSelect(tab, automatic);
  }
  for (const tab of tabs) {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      let next;
      const index = tabs.indexOf(tab);
      const vertical =
        tab.closest('[role="tablist"]').getAttribute("aria-orientation") ===
        "vertical";
      if (event.key === (vertical ? "ArrowDown" : "ArrowRight"))
        next = (index + 1) % tabs.length;
      if (event.key === (vertical ? "ArrowUp" : "ArrowLeft"))
        next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        tabs[next].focus();
        select(tabs[next]);
      }
    });
  }
  return select;
}

const feature = document.querySelector(".feature");
const featuredTabs = [...feature.querySelectorAll('[role="tab"]')];
const playback = feature.querySelector(".feature-playback");
const progress = feature.querySelector(".feature-progress-fill");
const togglePlayback = feature.querySelector(".feature-toggle");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const panels = featuredTabs.map((tab) =>
  document.getElementById(tab.getAttribute("aria-controls")),
);
const clips = panels.map((panel) => panel.querySelector(".feature-clip"));
const videos = clips.filter(Boolean);
for (const clip of videos) {
  clip.muted = true;
}
let clipsPlaying = false;
const playIcon = togglePlayback.querySelector(".feature-icon-play");
const pauseIcon = togglePlayback.querySelector(".feature-icon-pause");
const cloudFrames = feature.querySelector(".feature-sky image");
const cloudFrameCount = 80;
const cloudFrameColumns = 10;
const cloudFrameWidth = 320;
const cloudFrameHeight = 214;
let cloudFrame = 0;
const slideDuration = 5000;
const transitionDuration = 450;
const rotationDuration = featuredTabs.length * slideDuration;
let playing = !reducedMotion.matches;
const initialBounds = feature.getBoundingClientRect();
const initialVisibleHeight = Math.max(
  0,
  Math.min(initialBounds.bottom, window.innerHeight) -
    Math.max(initialBounds.top, 0),
);
let inView = initialVisibleHeight >= initialBounds.height * 0.25;
let elapsed = 0;
let selectedIndex = 0;
let lastTime;
let frameId;
let transitionTimer;

function showProgress() {
  progress.style.transform = `scaleX(${elapsed / rotationDuration})`;
  if (selectedIndex === 0 && !reducedMotion.matches) {
    // Play the recorded frames on the same clock as the slideshow.
    const nextFrame = Math.floor((elapsed / slideDuration) * cloudFrameCount);
    if (nextFrame === cloudFrame) return;
    cloudFrame = nextFrame;
    const x = (cloudFrame % cloudFrameColumns) * cloudFrameWidth;
    const y = Math.floor(cloudFrame / cloudFrameColumns) * cloudFrameHeight;
    cloudFrames.setAttribute("transform", `translate(${-x} ${-y})`);
  }
}

function showSlide(nextIndex) {
  clearTimeout(transitionTimer);
  const previous = panels[selectedIndex];
  previous.classList.remove("hero-intro");
  const incoming = panels[nextIndex];
  const animate = !reducedMotion.matches;

  for (const panel of panels) {
    const visible = panel === incoming;
    panel.classList.remove("is-entering", "is-leaving");
    panel.hidden = !visible && !(animate && panel === previous);
    panel.inert = !visible;
    panel.setAttribute("aria-hidden", String(!visible));
  }

  if (!animate) return;
  previous.classList.add("is-leaving");
  incoming.classList.add("is-entering");
  transitionTimer = setTimeout(() => {
    previous.hidden = true;
    previous.classList.remove("is-leaving");
    incoming.classList.remove("is-entering");
  }, transitionDuration);
}

const selectFeaturedTab = setupTabs(
  ".feature-tabs [role=tab]",
  (tab, automatic) => {
    const nextIndex = featuredTabs.indexOf(tab);
    if (nextIndex !== selectedIndex) {
      showSlide(nextIndex);
      selectedIndex = nextIndex;
      const rail = tab.parentElement;
      const left = tab.offsetLeft;
      const right = left + tab.offsetWidth;
      if (
        rail.scrollWidth > rail.clientWidth &&
        (left < rail.scrollLeft || right > rail.scrollLeft + rail.clientWidth)
      ) {
        rail.scrollTo({
          left: left < rail.scrollLeft ? left : right - rail.clientWidth,
          behavior: reducedMotion.matches ? "instant" : "smooth",
        });
      }
    }
    if (clips[selectedIndex]) clips[selectedIndex].currentTime = 0;
    syncClips();

    if (!automatic) {
      elapsed = selectedIndex * slideDuration;
      lastTime = undefined;
      showProgress();
    }
  },
);

function advance(now) {
  if (lastTime !== undefined) {
    elapsed = (elapsed + now - lastTime) % rotationDuration;
  }
  lastTime = now;
  const nextIndex = Math.floor(elapsed / slideDuration);
  if (nextIndex !== selectedIndex)
    selectFeaturedTab(featuredTabs[nextIndex], true);
  showProgress();
  frameId = requestAnimationFrame(advance);
}

function updatePlayback() {
  const focused = document.activeElement;
  const keyboardReading =
    focused !== togglePlayback &&
    feature.contains(focused) &&
    focused.matches(":focus-visible");
  const shouldAdvance =
    playing && inView && !document.hidden && !keyboardReading;

  clipsPlaying = shouldAdvance && !reducedMotion.matches;
  syncClips();

  const action = playing ? "Pause slideshow" : "Play slideshow";
  togglePlayback.setAttribute("aria-label", action);
  togglePlayback.title = action;
  playIcon.toggleAttribute("hidden", playing);
  pauseIcon.toggleAttribute("hidden", !playing);
  if (shouldAdvance && frameId === undefined) {
    frameId = requestAnimationFrame(advance);
  } else if (!shouldAdvance && frameId !== undefined) {
    cancelAnimationFrame(frameId);
    frameId = undefined;
    lastTime = undefined;
  }
}

function syncClips() {
  clips.forEach((clip, index) => {
    if (!clip) return;
    const active = clipsPlaying && index === selectedIndex;
    clip.autoplay = active;
    if (active) {
      if (clip.paused && !clip.ended) clip.play().catch(() => {});
    } else {
      clip.pause();
    }
  });
}
for (const clip of videos) {
  clip.addEventListener("canplay", syncClips, { once: true });
  clip.addEventListener("error", () => clip.classList.add("clip-unavailable"));
}

togglePlayback.addEventListener("click", () => {
  playing = !playing;
  updatePlayback();
});
reducedMotion.addEventListener("change", (event) => {
  if (event.matches) playing = false;
  updatePlayback();
});
feature.addEventListener("focusin", updatePlayback);
feature.addEventListener("focusout", () => queueMicrotask(updatePlayback));
document.addEventListener("visibilitychange", updatePlayback);
new IntersectionObserver(
  ([entry]) => {
    inView = entry.intersectionRatio >= 0.25;
    updatePlayback();
  },
  { threshold: 0.25 },
).observe(feature);
playback.hidden = false;
updatePlayback();

const services = {
  "procurement-operations": {
    description: "We assess where you stand, quantify savings opportunities, and put policies, processes, and tools in place to improve purchasing and operations.",
    path: "/procurement-operations/",
  },
  "human-capital-management": {
    description: "We help public organizations understand their workforce, set fair and competitive pay, develop leaders, and support employees through change.",
    path: "/human-capital-management/",
  },
  "economic-development-strategic-planning-performance": {
    description: "We help agencies and institutions set priorities with stakeholders, turn those priorities into a plan, and measure whether it is working.",
    path: "/economic-development-strategic-planning-performance/",
  },
  "financial-management-cfo-services": {
    description: "We help finance leaders allocate shared revenue, justify costs, account for grant dollars, and improve finance and treasury operations.",
    path: "/financial-management-cfo-services/",
  },
};
const serviceDetail = document.querySelector("#service-detail");
const serviceDescription = document.querySelector("#service-description");
const serviceName = document.querySelector("#service-name");
const serviceLink = document.querySelector("#service-link");
const servicePhotos = [...document.querySelectorAll("[data-service-photo]")];
// Every version occupies the same grid cell, so the longest copy reserves space
// at each viewport width without hard-coded heights or truncation.
const serviceContent = document.createElement("div");
serviceContent.className = "service-detail-content";
serviceContent.append(...serviceDetail.childNodes);
serviceDetail.append(serviceContent);
for (const tab of document.querySelectorAll(".service-options [role=tab]")) {
  const reserve = serviceContent.cloneNode(true);
  reserve.className = "service-detail-reserve";
  reserve.setAttribute("aria-hidden", "true");
  reserve.inert = true;
  for (const element of reserve.querySelectorAll("[id]")) element.removeAttribute("id");
  reserve.querySelector("h3").textContent = tab.textContent.trim();
  reserve.querySelector("p").textContent = services[tab.dataset.service].description;
  serviceDetail.append(reserve);
}
let serviceMotion;

async function showServicePhoto(tab) {
  const photo = servicePhotos.find(
    (image) => image.dataset.servicePhoto === tab.dataset.service,
  );
  try {
    if (!photo.complete || !photo.naturalWidth) await photo.decode();
  } catch {
    return;
  }
  if (serviceDetail.getAttribute("aria-labelledby") !== tab.id) return;
  for (const image of servicePhotos) {
    image.setAttribute("aria-hidden", String(image !== photo));
  }
}

setupTabs(".service-options [role=tab]", (tab) => {
  if (serviceDetail.getAttribute("aria-labelledby") === tab.id) return;

  const service = services[tab.dataset.service];
  serviceDescription.textContent = service.description;
  serviceName.textContent = tab.textContent.trim();
  serviceLink.href = service.path;
  serviceDetail.setAttribute("aria-labelledby", tab.id);
  showServicePhoto(tab);

  serviceMotion?.cancel();
  if (!reducedMotion.matches) {
    serviceMotion = serviceContent.animate(
      [
        { opacity: 0.65 },
        { opacity: 1 },
      ],
      { duration: 220, easing: "ease-out" },
    );
  }
});

if (!reducedMotion.matches) {
  const entrances = new IntersectionObserver(
    (entries, observer) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        target.classList.add("section-arrived");
        observer.unobserve(target);
      }
    },
    { rootMargin: "0px 0px -28px 0px", threshold: 0.12 },
  );
  const sections = [
    ".services-image",
    ".services-content",
    ".case-heading",
    ".article-copy",
    ".firm-copy",
    ".insights .page-width",
    ".contact-band > div",
  ];
  document
    .querySelectorAll(sections.join(","))
    .forEach((section) => entrances.observe(section));
}
