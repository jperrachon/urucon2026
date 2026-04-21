let drawer;
let hamburger;
let navScrollBound = false;
let revealInitialized = false;

function updateNavOnScroll() {
  const navbar = document.getElementById("navbar");
  if (!navbar) {
    return;
  }

  navbar.classList.toggle("scrolled", window.scrollY > 10);
}

function toggleMobile() {
  if (!drawer || !hamburger) {
    return;
  }

  const isOpen = drawer.classList.toggle("open");
  hamburger.classList.toggle("active", isOpen);
  document.body.style.overflow = isOpen ? "hidden" : "";
}

function closeMobile() {
  if (!drawer || !hamburger) {
    return;
  }

  drawer.classList.remove("open");
  hamburger.classList.remove("active");
  document.body.style.overflow = "";
}

function initNavigation() {
  drawer = document.getElementById("mobileDrawer");
  hamburger = document.getElementById("hamburger");

  if (drawer) {
    drawer.addEventListener("click", (e) => {
      if (e.target === drawer) {
        closeMobile();
      }
    });
  }

  if (!navScrollBound) {
    navScrollBound = true;
    window.addEventListener("scroll", updateNavOnScroll);
  }

  updateNavOnScroll();
}

function initReveal() {
  if (revealInitialized) {
    return;
  }

  const reveals = document.querySelectorAll(".reveal");
  if (reveals.length === 0) {
    return;
  }

  revealInitialized = true;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("visible"), i * 80);
      }
    });
  }, { threshold: 0.12 });

  reveals.forEach((el) => observer.observe(el));
}

function initPageBehavior() {
  initNavigation();
  initReveal();
}

window.toggleMobile = toggleMobile;
window.closeMobile = closeMobile;

document.addEventListener("DOMContentLoaded", initPageBehavior);
document.addEventListener("layout:loaded", initPageBehavior);