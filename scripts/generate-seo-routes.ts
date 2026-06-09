import { getAllApostilleCountryPaths, getAllDocumentPaths, getAllApostilleCountryDocumentPaths, LEGACY_COUNTRY_REDIRECTS } from "../lib/compliance/seoRoutes";

const apostillePaths = getAllApostilleCountryPaths();
const documentPaths = getAllDocumentPaths();
const matrixPaths = getAllApostilleCountryDocumentPaths();

console.log(`Apostille country pages: ${apostillePaths.length}`);
console.log(`Document pages: ${documentPaths.length}`);
console.log(`Country × document matrix pages: ${matrixPaths.length}`);
console.log(`Legacy redirects: ${Object.keys(LEGACY_COUNTRY_REDIRECTS).length}`);
console.log(`Total routes: ${apostillePaths.length + documentPaths.length + matrixPaths.length}`);
