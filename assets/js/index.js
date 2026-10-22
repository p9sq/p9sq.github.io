const imagesAmount = 24;
const container = document.getElementById("bg-image");
let currentIndex = 1;

// Dark fallback so a gap never shows white
container.style.backgroundColor = "#111";

const preloaded = {};

// Start every download now so the browser caches the files
for (let i = 1; i <= imagesAmount; i++) {
  const img = new Image();
  img.src = `assets/img/bg${i}.webp`;
  preloaded[i] = img;
}

function showBg(num) {
  currentIndex = num;
  container.style.backgroundImage = `url("${preloaded[num].src}")`;
}

function changeBackground() {
  let nextImageNumber;

  do {
    nextImageNumber = Math.floor(Math.random() * imagesAmount) + 1;
  } while (nextImageNumber === currentIndex && imagesAmount > 1);

  const img = preloaded[nextImageNumber];

  // Swap only after the download finishes
  if (img.complete && img.naturalWidth > 0) {
    showBg(nextImageNumber);
  } else {
    img.addEventListener("load", () => showBg(nextImageNumber), { once: true });
  }
}

changeBackground();

setInterval(changeBackground, 5000);
