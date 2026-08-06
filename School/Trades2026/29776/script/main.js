// Counts up the stats on the home page.

function animateCount(el, target) {
  var duration = 1800;
  var start = performance.now();

  function step(now) {
    var t = (now - start) / duration;
    if (t > 1) t = 1;
    var eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(eased * target);
    if (t < 1) {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

window.addEventListener("DOMContentLoaded", function () {
  const nSystems = Object.keys(CATALOGUED_SYSTEMS).length;
  const nCandidates = Object.keys(PROMISING_WORLDS).length;
  const nTerraformed = Object.keys(TERRAFORMED_WORLDS).length;

  // Wait a bit before the numbers start counting. Feels more natural after the page loads.
  setTimeout(function () {
    animateCount(document.getElementById("num-systems"), nSystems);
    animateCount(document.getElementById("num-candidates"), nCandidates);
    animateCount(document.getElementById("num-terraformed"), nTerraformed);
  }, 900);
});
