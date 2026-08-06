// Starfield background animation.
(function () {
  var canvas = document.getElementById("starfield");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  var stars = [];
  var W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // More stars on a bigger screen. Fewer on a small one.
  function initStars() {
    stars = [];
    var count = Math.floor((W * H) / 4000);
    for (var i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.2,
        alpha: Math.random() * 0.7 + 0.1,
        speed: Math.random() * 0.015 + 0.003,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  var frame = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame += 0.008;
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var twinkle = s.alpha + Math.sin(frame * s.speed * 60 + s.phase) * 0.15;
      var a = twinkle;
      if (a < 0) a = 0;
      if (a > 1) a = 1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200, 220, 255, " + a + ")";
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  initStars();
  draw();

  // Redo the star positions whenever the window size changes.
  window.addEventListener("resize", function () {
    resize();
    initStars();
  });
})();
