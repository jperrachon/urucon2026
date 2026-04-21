async function injectLayoutFragment(containerId, fragmentPath) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  try {
    const response = await fetch(fragmentPath);
    if (!response.ok) {
      throw new Error("Failed to load " + fragmentPath + ": " + response.status);
    }

    container.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
  }
}

async function loadSharedLayout() {
  await Promise.all([
    injectLayoutFragment("site-header", "partials/header.html"),
    injectLayoutFragment("site-footer", "partials/footer.html")
  ]);

  document.dispatchEvent(new Event("layout:loaded"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSharedLayout);
} else {
  loadSharedLayout();
}
