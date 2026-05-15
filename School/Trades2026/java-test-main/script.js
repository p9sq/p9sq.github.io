// script.js
const themeButton = document.getElementById("themeButton");
const shapeButton = document.getElementById("shapeButton");
const playBox = document.getElementById("playBox");
const secret = document.getElementById("secret");
let clicks = 0;
let multiplier = 1;
let gla = false;
let real = false;
let butyoustillclicked = false;

let themeIndex = 0;
let isCircle = false;

const themes = [
  {
    bg: "#f6f1ea",
    bgAlt: "#efe6da",
    text: "#1f1a17",
    muted: "#62564c",
    accent: "#c96f3b",
    accent2: "#3d7a6b",
    surface: "rgba(255, 255, 255, 0.6)",
  },
  {
    bg: "#0f172a",
    bgAlt: "#111827",
    text: "#e5eef8",
    muted: "#a7b6c9",
    accent: "#7c3aed",
    accent2: "#06b6d4",
    surface: "rgba(255, 255, 255, 0.08)",
  },
  {
    bg: "#fff2f2",
    bgAlt: "#ffe4d6",
    text: "#351c1c",
    muted: "#6d4b4b",
    accent: "#e85d75",
    accent2: "#f08a5d",
    surface: "rgba(255, 255, 255, 0.65)",
  },
  {
    bg: "#ff0000",
    bgAlt: "#000000",
    text: "#ff0000",
    muted: "#000000",
    accent: "#ff0000",
    accent2: "#000000",
    surface: "rgb(255, 0, 0)",
  },
];

themeButton.addEventListener("click", () => {
  themeIndex = (themeIndex + 1) % themes.length;
  const theme = themes[themeIndex];

  document.documentElement.style.setProperty("--bg", theme.bg);
  document.documentElement.style.setProperty("--bg-alt", theme.bgAlt);
  document.documentElement.style.setProperty("--text", theme.text);
  document.documentElement.style.setProperty("--muted", theme.muted);
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--accent-2", theme.accent2);
  document.documentElement.style.setProperty("--surface", theme.surface);

  playBox.textContent = "Theme Changed!";
  playBox.classList.add("active");

  setTimeout(() => {
    playBox.classList.remove("active");
    playBox.textContent = "Look at the title";
    document.title = "hi";
  }, 700);
});

secret.addEventListener("click", () => {
  let newMultiplier = prompt("How much cps do you want?");
  while (
    isNaN(newMultiplier) ||
    newMultiplier === null ||
    newMultiplier === ""
  ) {
    alert("That's not a number");
    newMultiplier = prompt("How much cps do you want?");
  }

  multiplier = Number(newMultiplier);
});

shapeButton.addEventListener("click", () => {
  isCircle = !isCircle;
  playBox.classList.toggle("circle");

  playBox.textContent = isCircle ? "Circle" : "Rounded Box";
  playBox.classList.add("active");

  shapeBtn = document.getElementById("shapeButton");
  clicks += multiplier;
  shapeBtn.innerText = `Change Shape (+${clicks.toLocaleString()} clicks)`;

  if (shapeBtn.innerText === "Change Shape (+∞ clicks)" && gla === false) {
    setTimeout(() => {
      alert("Godlike ascension....");
      gla = true;
    }, 200);
  }

  if (
    shapeBtn.innerText === "Change Shape (+∞ clicks)" &&
    gla === true &&
    real === false
  ) {
    alert(
      "You have all of the clicks in the world... Therefore, you have no more reason to click anymore...",
    );
    real = true;
  }

  if (
    shapeBtn.innerText === "Change Shape (+∞ clicks)" &&
    gla === true &&
    real === true &&
    butyoustillclicked === false
  ) {
    alert("But you still clicked it anyways...");
    butyoustillclicked = true;
  }

  setTimeout(() => {
    playBox.classList.remove("active");
  }, 500);
});

playBox.addEventListener("click", () => {
  playBox.classList.toggle("active");
  playBox.textContent = "Nice!";
});

playBox.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    playBox.classList.toggle("active");
    playBox.textContent = "Keyboard!";
  }
});

/*
SUGGESTIONS FOR STUDENTS:

1. Add a new theme:
   - Copy one object in the "themes" array
   - Change the colors
   - Click the button to cycle through it

2. Change button behavior:
   - Make themeButton change the page title
   - Make shapeButton also change the box size

3. Add more effects:
   - Use playBox.style.transform = "rotate(20deg)";
   - Add random colors on click
   - Make the box move left and right

4. Add a counter:
   - Count how many times the box is clicked
   - Display the number inside the box

5. Add sound or emoji text:
   - Change playBox.textContent to emojis or messages
*/
