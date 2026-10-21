const calc = document.querySelector("#calc");
const out = document.querySelector("#out");

calc.addEventListener("submit", (e) => {
  e.preventDefault();
  const kg = Number(calc.querySelector("#kg").value);

  // Stop empty or negative input
  if (!kg || kg < 0) return;
  const g = Number(calc.dataset.gravity);
  out.textContent = `Your weight feels like ${(kg * g).toFixed(1)} kg here.`;
});
