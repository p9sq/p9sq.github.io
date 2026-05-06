// Starfield background animation
(function () {
  const canvas = document.getElementById("starfield");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let stars = [];
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function initStars() {
    stars = [];
    const count = Math.floor((W * H) / 4000);
    for (let i = 0; i < count; i++) {
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

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame += 0.008;
    for (const s of stars) {
      const twinkle = s.alpha + Math.sin(frame * s.speed * 60 + s.phase) * 0.15;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${Math.max(0, Math.min(1, twinkle))})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  resize();
  initStars();
  draw();
  window.addEventListener("resize", () => {
    resize();
    initStars();
  });
})();
