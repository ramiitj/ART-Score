// Mask name for privacy
export function maskName(name: string): string {
  if (!name) return "Anonymous";
  return name.trim().split(/\s+/).map(part => {
    if (part.length === 0) return "";
    if (part.length === 1) return part + "***";
    return part[0] + "***";
  }).join(" ");
}
