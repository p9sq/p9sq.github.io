// resonanceRatio.js
// Interactive orbital resonance calculator using readline.
// Run with: node resonanceRatio.js

const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question) {
    return new Promise(resolve => rl.question(question, resolve));
}

function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}

function findTopResonances(rawRatio, maxN = 20, topN = 5) {
    const candidates = [];

    for (let q = 1; q <= maxN; q++) {
        for (let p = q + 1; p <= maxN * 2; p++) {
            if (gcd(p, q) !== 1) continue;
            const candidate = p / q;
            const dev = Math.abs(rawRatio - candidate) / candidate * 100;
            candidates.push({ p, q, ratio: candidate, deviation: dev });
        }
    }

    candidates.sort((a, b) => a.deviation - b.deviation);
    return candidates.slice(0, topN);
}

function printResults(a1, a2, maxN, tolerance) {
    const aInner = Math.min(a1, a2);
    const aOuter = Math.max(a1, a2);
    const rawRatio = Math.pow(aOuter / aInner, 1.5);
    const top5 = findTopResonances(rawRatio, maxN, 5);
    const best = top5[0];

    console.log("");
    console.log("─────────────────────────────────────────");
    console.log("  Orbital Resonance Calculator");
    console.log("─────────────────────────────────────────");
    console.log(`  Inner planet:       ${aInner} AU`);
    console.log(`  Outer planet:       ${aOuter} AU`);
    console.log(`  Axis ratio:         ${(aOuter / aInner).toFixed(6)}`);
    console.log(`  Raw period ratio:   ${rawRatio.toFixed(8)}`);
    console.log("");
    console.log(`  Best resonance:     ${best.p}:${best.q}  (${best.ratio.toFixed(6)})`);
    console.log(`  Deviation:          ${best.deviation.toFixed(4)}%`);

    if (best.deviation <= tolerance) {
        console.log(`  ✓ Within ${tolerance}% tolerance — likely resonant`);
    } else {
        console.log(`  ✗ Outside ${tolerance}% tolerance — not cleanly resonant`);
    }

    console.log("");
    console.log("  Top 5 closest resonances:");
    console.log("  ─────────────────────────");
    top5.forEach((r, i) => {
        const marker = i === 0 ? " ◀ best" : "";
        console.log(`  ${String(i + 1).padStart(2)}. ${r.p}:${r.q}  →  ratio ${r.ratio.toFixed(6)}  |  dev ${r.deviation.toFixed(4)}%${marker}`);
    });

    console.log("─────────────────────────────────────────");
}

async function promptFloat(prompt, fallback = null) {
    while (true) {
        const raw = (await ask(prompt)).trim();
        if (raw === "" && fallback !== null) return fallback;
        const val = parseFloat(raw);
        if (!isNaN(val) && val > 0) return val;
        console.log("  Invalid input — please enter a positive number.");
    }
}

async function promptInt(prompt, fallback) {
    while (true) {
        const raw = (await ask(prompt)).trim();
        if (raw === "") return fallback;
        const val = parseInt(raw);
        if (!isNaN(val) && val >= 2) return val;
        console.log("  Invalid input — please enter an integer of 2 or more.");
    }
}

async function main() {
    console.log("");
    console.log("═════════════════════════════════════════");
    console.log("    Orbital Resonance Calculator");
    console.log("═════════════════════════════════════════");
    console.log("  Enter semi-major axes in AU.");
    console.log("  Order doesn't matter — inner/outer");
    console.log("  is determined automatically.");
    console.log("─────────────────────────────────────────");
    console.log("");

    while (true) {
        const a1 = await promptFloat("  Planet 1 semi-major axis (AU): ");
        const a2 = await promptFloat("  Planet 2 semi-major axis (AU): ");
        const maxN = await promptInt("  Max resonance integer [default 20]: ", 20);
        const tolerance = await promptFloat("  Tolerance % [default 1.0]: ", 1.0);

        printResults(a1, a2, maxN, tolerance);

        console.log("");
        const again = (await ask("  Run again? (y/n) [default y]: ")).trim().toLowerCase();
        if (again === "n") break;
        console.log("");
    }

    console.log("");
    console.log("  Goodbye.");
    rl.close();
}

main();
