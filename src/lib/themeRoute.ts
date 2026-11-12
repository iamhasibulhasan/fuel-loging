// Switching theme remounts the navigator (see app/_layout.tsx). Before switching,
// the Settings screen records where to return to so the user stays in place.
type Route = '/settings';
let pending: Route | null = null;

export const setReturnRoute = (r: Route) => {
  pending = r;
};

export const consumeReturnRoute = (): Route | null => {
  const r = pending;
  pending = null;
  return r;
};
