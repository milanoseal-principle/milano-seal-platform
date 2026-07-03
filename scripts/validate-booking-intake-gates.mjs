import { existsSync, readFileSync } from "node:fs";

const bookPage = "app/book/page.tsx";
if (!existsSync(bookPage)) {
  console.error(`FAIL missing ${bookPage}`);
  process.exit(2);
}
const src = readFileSync(bookPage, "utf8").toLowerCase();

let failures = 0;

// payment before scheduling
if (!(src.includes("payment") && src.includes("schedul"))) {
  console.error("FAIL book page must reference payment and scheduling");
  failures += 1;
}
if (!src.includes("after payment")) {
  console.error("FAIL book page must state scheduling only after payment");
  failures += 1;
}
// no confirmed appointment before payment
if (!src.includes("no confirmed appointment")) {
  console.error("FAIL book page must state no confirmed appointment before payment");
  failures += 1;
}

if (failures) {
  console.error(`FAIL booking-intake-gates: ${failures} issue(s)`);
  process.exit(2);
}
console.log("OK booking-intake-gates");
