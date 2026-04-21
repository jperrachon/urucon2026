document.addEventListener("DOMContentLoaded", () => {
  const panels = Array.from(document.querySelectorAll(".committee-panel"));
  const mapLinks = Array.from(document.querySelectorAll(".map-link"));
  const committeesPage = document.querySelector(".committees-page");
  const autoScrollMedia = window.matchMedia("(min-width: 1081px)");
  const SCROLL_DURATION_MS = 950;
  const SCROLL_STOP_DELAY_MS = 180;
  let isAutoScrolling = false;
  let scrollStopTimer;
  let activeAnimationToken = 0;
  let animationFrameId;

  if (panels.length === 0 || mapLinks.length === 0 || !committeesPage) {
    return;
  }

  function linkedinSearchUrl(name) {
    return "https://www.linkedin.com/search/results/all/?keywords=" + encodeURIComponent(name);
  }

  function linkedinIconSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3A1.95 1.95 0 1 0 5.3 6.9 1.95 1.95 0 0 0 5.25 3zM20.44 13.2c0-3.54-1.89-5.18-4.42-5.18-2.04 0-2.95 1.13-3.46 1.92V8.5H9.18c.05.96 0 11.5 0 11.5h3.38v-6.42c0-.34.03-.68.13-.92.27-.68.88-1.38 1.9-1.38 1.34 0 1.87 1.02 1.87 2.52V20h3.38v-6.8z"/></svg>';
  }

  function addLinkedinButtons() {
    const chairCards = Array.from(document.querySelectorAll(".chair-card"));
    chairCards.forEach((card) => {
      const chairName = card.querySelector(".chair-name")?.textContent?.trim();
      if (!chairName || card.querySelector(".chair-linkedin")) {
        return;
      }

      const linkedinLink = document.createElement("a");
      linkedinLink.className = "chair-linkedin";
      linkedinLink.href = linkedinSearchUrl(chairName);
      linkedinLink.target = "_blank";
      linkedinLink.rel = "noopener noreferrer";
      linkedinLink.setAttribute("aria-label", "Open LinkedIn for " + chairName);
      linkedinLink.title = "LinkedIn";
      linkedinLink.innerHTML = linkedinIconSvg();
      card.appendChild(linkedinLink);
    });

    const members = Array.from(document.querySelectorAll(".collaborators-list li"));
    members.forEach((member) => {
      if (member.querySelector(".team-linkedin")) {
        return;
      }

      const memberName = member.textContent.trim();
      const nameNode = document.createElement("span");
      nameNode.className = "team-member-name";
      nameNode.textContent = memberName;

      const linkedinLink = document.createElement("a");
      linkedinLink.className = "team-linkedin";
      linkedinLink.href = linkedinSearchUrl(memberName);
      linkedinLink.target = "_blank";
      linkedinLink.rel = "noopener noreferrer";
      linkedinLink.setAttribute("aria-label", "Open LinkedIn for " + memberName);
      linkedinLink.title = "LinkedIn";
      linkedinLink.innerHTML = linkedinIconSvg();

      member.textContent = "";
      member.appendChild(nameNode);
      member.appendChild(linkedinLink);
    });
  }

  function getCenteredPanelIndex() {
    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    panels.forEach((panel, index) => {
      const rect = panel.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - viewportCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function animateScrollTo(targetY, durationMs) {
    const token = ++activeAnimationToken;
    const startY = window.scrollY;
    const deltaY = targetY - startY;
    const startTime = performance.now();

    function easeInOutCubic(t) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function frame(now) {
      if (token !== activeAnimationToken) {
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, startY + deltaY * eased);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(frame);
      } else {
        isAutoScrolling = false;
        animationFrameId = undefined;
      }
    }

    animationFrameId = requestAnimationFrame(frame);
  }

  function cancelAutoScroll() {
    if (!isAutoScrolling) {
      return;
    }

    activeAnimationToken += 1;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = undefined;
    }

    isAutoScrolling = false;
  }

  function scrollToPanel(index) {
    if (index < 0 || index >= panels.length) {
      return;
    }

    const rect = panels[index].getBoundingClientRect();
    const targetY = Math.max(
      0,
      window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2
    );

    isAutoScrolling = true;
    animateScrollTo(targetY, SCROLL_DURATION_MS);
  }

  function centerClosestPanel() {
    if (isAutoScrolling) {
      return;
    }

    const closestIndex = getCenteredPanelIndex();
    scrollToPanel(closestIndex);
  }

  function updateTeamDensity() {
    const viewportAvailable = Math.max(320, window.innerHeight - 96);

    panels.forEach((panel) => {
      const teamList = panel.querySelector(".collaborators-list");
      if (!teamList) {
        return;
      }

      panel.classList.remove("needs-compact-team");

      const teamMembers = teamList.querySelectorAll("li").length;
      if (teamMembers < 5) {
        return;
      }

      const panelHeight = panel.getBoundingClientRect().height;
      if (panelHeight > viewportAvailable) {
        panel.classList.add("needs-compact-team");
      }
    });
  }

  function updateChairLayout() {
    const rows = Array.from(document.querySelectorAll(".chairs-row"));
    rows.forEach((row) => {
      const chairCount = row.querySelectorAll(".chair-card").length;
      row.classList.toggle("single-chair", chairCount === 1);
    });
  }

  function setActive(targetId) {
    const activeIndex = mapLinks.findIndex((link) => link.getAttribute("data-target") === targetId);

    mapLinks.forEach((link) => {
      const item = link.parentElement;
      const index = mapLinks.indexOf(link);
      link.classList.toggle("is-active", link.getAttribute("data-target") === targetId);
      if (item) {
        item.classList.toggle("is-active", index === activeIndex);
        item.classList.toggle("is-complete", activeIndex > index);
      }
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      threshold: 0.55
    }
  );

  panels.forEach((panel) => observer.observe(panel));

  mapLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("data-target");
      if (targetId) {
        setActive(targetId);
        const panelIndex = panels.findIndex((panel) => panel.id === targetId);
        scrollToPanel(panelIndex);
      }
    });
  });

  addLinkedinButtons();
  updateChairLayout();
  updateTeamDensity();

  ["wheel", "touchstart", "mousedown", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, () => {
      cancelAutoScroll();
    }, { passive: true });
  });

  window.addEventListener("resize", () => {
    updateChairLayout();
    updateTeamDensity();
  });

  window.addEventListener("scroll", () => {
    if (!autoScrollMedia.matches) {
      return;
    }

    if (isAutoScrolling) {
      return;
    }

    window.clearTimeout(scrollStopTimer);
    scrollStopTimer = window.setTimeout(() => {
      const firstPanelRect = panels[0].getBoundingClientRect();
      const lastPanelRect = panels[panels.length - 1].getBoundingClientRect();
      const isWithinCommitteesTrack = firstPanelRect.top < window.innerHeight && lastPanelRect.bottom > 0;

      if (isWithinCommitteesTrack) {
        centerClosestPanel();
      }
    }, SCROLL_STOP_DELAY_MS);
  }, { passive: true });
});
