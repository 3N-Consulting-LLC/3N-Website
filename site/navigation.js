const header = document.querySelector("#header");
const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
const desktopNav = window.matchMedia("(min-width: 681px)");
const hoverNav = window.matchMedia("(min-width: 681px) and (hover: hover)");
let openDisclosure;
let submenuCloseTimer;

function showSubmenu(disclosure) {
  clearTimeout(submenuCloseTimer);
  if (openDisclosure === disclosure) return;
  if (openDisclosure) {
    openDisclosure.setAttribute("aria-expanded", "false");
    document.getElementById(openDisclosure.getAttribute("aria-controls")).hidden = true;
  }
  openDisclosure = disclosure;
  if (openDisclosure) {
    openDisclosure.setAttribute("aria-expanded", "true");
    document.getElementById(openDisclosure.getAttribute("aria-controls")).hidden = false;
  }
}

for (const disclosure of navigation.querySelectorAll(".nav-disclosure")) {
  const group = disclosure.closest(".nav-group");
  disclosure.addEventListener("click", (event) => {
    const hoveredWithMouse = hoverNav.matches && event.pointerType === "mouse";
    showSubmenu(openDisclosure === disclosure && !hoveredWithMouse ? undefined : disclosure);
  });
  group.addEventListener("pointerenter", (event) => {
    clearTimeout(submenuCloseTimer);
    if (hoverNav.matches && event.pointerType === "mouse") showSubmenu(disclosure);
  });
  group.addEventListener("pointerleave", (event) => {
    const focused = document.activeElement;
    if (hoverNav.matches && event.pointerType === "mouse" && openDisclosure === disclosure &&
        !(group.contains(focused) && focused.matches(":focus-visible"))) {
      submenuCloseTimer = setTimeout(() => showSubmenu(), 180);
    }
  });
  group.addEventListener("focusout", (event) => {
    if (openDisclosure === disclosure && !group.contains(event.relatedTarget) &&
        !(hoverNav.matches && group.matches(":hover"))) {
      showSubmenu();
    }
  });
}

const closeMenu = () => {
  showSubmenu();
  menu.setAttribute("aria-expanded", "false");
  navigation.classList.remove("open");
};
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  if (!open) {
    closeMenu();
    return;
  }
  menu.setAttribute("aria-expanded", "true");
  navigation.classList.add("open");
});
navigation.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMenu();
});
document.addEventListener("pointerdown", (event) => {
  if (!navigation.contains(event.target)) showSubmenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (openDisclosure) {
    const disclosure = openDisclosure;
    const focusInside = disclosure.closest(".nav-group").contains(document.activeElement);
    showSubmenu();
    if (focusInside) disclosure.focus();
    return;
  }
  if (menu.getAttribute("aria-expanded") === "true") {
    closeMenu();
    menu.focus();
  }
});
if (!document.body.classList.contains("interior")) {
  const updateHeader = () =>
    header.classList.toggle("scrolled", window.scrollY > 70);
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}
desktopNav.addEventListener("change", closeMenu);

const bannerVideos = [...document.querySelectorAll(".practice-video")];
const reduceVideoMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (reduceVideoMotion.matches) {
  for (const video of bannerVideos) {
    video.autoplay = false;
    video.pause();
  }
} else if (bannerVideos.length) {
  const playBanner = (video) => {
    if (document.hidden) return;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.play().catch(() => {
      // Keep the poster if the browser restricts autoplay.
    });
  };
  // The visible hero must not wait for an intersection callback to fetch/play.
  const firstBanner = bannerVideos[0];
  firstBanner.preload = "auto";
  firstBanner.autoplay = true;
  playBanner(firstBanner);
  firstBanner.addEventListener("canplay", () => {
    if (firstBanner.paused) playBanner(firstBanner);
  }, { once: true });
  window.addEventListener("pageshow", () => {
    if (firstBanner.paused) playBanner(firstBanner);
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && firstBanner.paused) playBanner(firstBanner);
  });
  if (bannerVideos.length > 1) {
    const startVideo = new IntersectionObserver((entries, observer) => {
      for (const { target: video, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        observer.unobserve(video);
        playBanner(video);
      }
    }, { threshold: 0.25 });
    for (const video of bannerVideos.slice(1)) startVideo.observe(video);
  }
}
