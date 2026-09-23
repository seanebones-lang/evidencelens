import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { createBlindedAssignments } from "@evidencelens/semantic-evaluation";

const valueFor = (name) => process.argv.find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1);
const casesPath = valueFor("--cases");
const outputPrefix = valueFor("--output-prefix");
const seed = valueFor("--seed");
const rubricVersion = valueFor("--rubric-version") ?? "1.0.0";

if (!casesPath || !outputPrefix || !seed) {
  throw new Error("Usage: --cases=<json> --output-prefix=<path> --seed=<secret> [--rubric-version=1.0.0]");
}

const cases = JSON.parse(await readFile(resolve(process.cwd(), casesPath), "utf8"));
const assignments = createBlindedAssignments(cases, seed, rubricVersion);
for (const assignment of assignments) {
  const output = resolve(process.cwd(), `${outputPrefix}-${assignment.slot}.json`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(assignment, null, 2)}\n`, { flag: "wx" });
}

console.log(JSON.stringify({
  assignments: assignments.map(({ assignmentId, slot, cases: assignedCases }) => ({
    assignmentId,
    slot,
    cases: assignedCases.length,
  })),
  rubricVersion,
}, null, 2));
