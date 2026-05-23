export const isVersionLower = (current: string, minimum: string) => {
  const c = current.split(".").map(Number);
  const m = minimum.split(".").map(Number);

  for (let i = 0; i < Math.max(c.length, m.length); i++) {
    const currentPart = c[i] || 0;
    const minPart = m[i] || 0;

    if (currentPart < minPart) return true;
    if (currentPart > minPart) return false;
  }

  return false;
};