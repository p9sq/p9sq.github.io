// Index page — animated stat counters
function animateCount(el, target, duration = 1800) {
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(eased * target);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

window.addEventListener("DOMContentLoaded", () => {
  const nSystems = Object.keys(CATALOGUED_SYSTEMS).length;
  const nCandidates = Object.keys(PROMISING_WORLDS).length;
  const nTerraformed = Object.keys(TERRAFORMED_WORLDS).length;

  setTimeout(() => {
    animateCount(document.getElementById("num-systems"), nSystems);
    animateCount(document.getElementById("num-candidates"), nCandidates);
    animateCount(document.getElementById("num-terraformed"), nTerraformed);
  }, 900);
});
