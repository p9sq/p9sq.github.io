document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.body.setAttribute("data-theme", savedTheme);
  }

  const hamburger = document.getElementById("hamburger");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const themeButton = document.getElementById("themeButton");
  const themeOverlay = document.getElementById("themeOverlay");
  const closeTheme = document.getElementById("closeTheme");

  hamburger.addEventListener("click", () => {
    dropdownMenu.classList.toggle("show");
  });

  themeButton.addEventListener("click", () => {
    dropdownMenu.classList.remove("show");
    themeOverlay.classList.add("show");
  });

  closeTheme.addEventListener("click", () => {
    themeOverlay.classList.remove("show");
  });

  document.querySelectorAll(".theme-option").forEach((button) => {
    button.addEventListener("click", () => {
      const selectedTheme = button.dataset.theme;
      document.body.setAttribute("data-theme", selectedTheme);
      localStorage.setItem("theme", selectedTheme);
      themeOverlay.classList.remove("show");
    });
  });
});
