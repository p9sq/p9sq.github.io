// this counts up the stat numbers on the home page

function animateCount(el, target) {
  var duration = 1800;
  var start = performance.now();

  function step(now) {
    var t = (now - start) / duration;
    if (t > 1) t = 1;
    var eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(eased * target);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

window.addEventListener("DOMContentLoaded", function () {
  var nSystems = Object.keys(CATALOGUED_SYSTEMS).length;
  var nCandidates = Object.keys(PROMISING_WORLDS).length;
  var nTerraformed = Object.keys(TERRAFORMED_WORLDS).length;

  // small delay so the count-up kicks off after the page settles
  setTimeout(function () {
    animateCount(document.getElementById("num-systems"), nSystems);
    animateCount(document.getElementById("num-candidates"), nCandidates);
    animateCount(document.getElementById("num-terraformed"), nTerraformed);
  }, 900);
});
