import {
  CATALOGUED_SYSTEMS,
  PROMISING_WORLDS,
  TERRAFORMED_WORLDS,
} from "./data.js";

const cataloguedCount = document.getElementById("catalogued-count");
const candidatesCount = document.getElementById("candidates-count");
const terraformedCount = document.getElementById("terraformed-count");

cataloguedCount.textContent = Object.keys(CATALOGUED_SYSTEMS).length;
candidatesCount.textContent = Object.keys(PROMISING_WORLDS).length;
terraformedCount.textContent = Object.keys(TERRAFORMED_WORLDS).length;
