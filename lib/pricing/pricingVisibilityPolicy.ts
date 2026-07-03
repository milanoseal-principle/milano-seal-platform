export function isPublicVisible(): boolean {
  return false; // pricing bases are hidden from public pages by default
}

export function clientEstimateOnly(): boolean {
  return true;
}

export default { isPublicVisible, clientEstimateOnly };
