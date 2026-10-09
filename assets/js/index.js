const imagesAmount = 24;

let currentIndex = 1;
const container = document.getElementById("bg-image");

function changeBackground() {
  let nextImageNumber;

  do {
    nextImageNumber = Math.floor(Math.random() * imagesAmount) + 1;
  } while (nextImageNumber === currentIndex && imagesAmount > 1);

  currentIndex = nextImageNumber;
  const imagePath = `assets/img/bg${currentIndex}.png`;
  container.style.backgroundImage = `url("${imagePath}")`;
}

changeBackground();

setInterval(changeBackground, 5000);
