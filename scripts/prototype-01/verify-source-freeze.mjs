import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const EXPECTED = Object.freeze({
  outer: "203d761b049073c0a809ec62365a02729ec76f80550ed4b78e6efcbf3a9180dd",
  source: "3513a0e7c50e37018688af7511499b1de792f9af1a2031d328a80971eda0c2c5",
  manifesto: "c3a3c2e6de12d55120b859fc6febbb4f1993a8812cec88758b321a29d15f7d02",
});

async function sha256(file) {
  return createHash("sha256")
    .update(await readFile(file))
    .digest("hex");
}

const [outerArchive, sourceArchive, manifesto] = process.argv
  .slice(2)
  .map((file) => path.resolve(file));
if (!outerArchive || !sourceArchive || !manifesto) {
  console.error(
    "Usage: node scripts/prototype-01/verify-source-freeze.mjs <outer.zip> <prototype-source.zip> <00_MANIFESTO.md>",
  );
  process.exit(1);
}

const actual = {
  outer: await sha256(outerArchive),
  source: await sha256(sourceArchive),
  manifesto: await sha256(manifesto),
};

for (const key of Object.keys(EXPECTED)) {
  if (actual[key] !== EXPECTED[key]) {
    console.error(`Prototype 01 ${key} hash mismatch.`);
    process.exit(1);
  }
}

console.log("Prototype 01 source freeze: PASS");
