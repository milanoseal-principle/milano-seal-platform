// Accept the supported motion hooks only when imported and invoked. The shared
// hook must retain a stable SSR snapshot and a live media-query subscription.
export function hasMotionPreference(surface, sharedHook) {
  const legacy = /import[^;]*useReducedMotion[^;]*from ["']framer-motion["']/.test(surface)
    && /useReducedMotion\(\)/.test(surface);
  const sharedContract = /useSyncExternalStore\(subscribe, getSnapshot, getServerSnapshot\)/.test(sharedHook)
    && /prefers-reduced-motion: reduce/.test(sharedHook)
    && /function getServerSnapshot\(\)\s*\{\s*return false;/.test(sharedHook)
    && /preference\.addEventListener\("change", onChange\)/.test(sharedHook);
  const shared = sharedContract
    && /import[^;]*useMilanoReducedMotion[^;]*from ["']@\/lib\/motion\/use-milano-reduced-motion["']/.test(surface)
    && /useMilanoReducedMotion\(\)/.test(surface);
  return legacy || shared;
}
