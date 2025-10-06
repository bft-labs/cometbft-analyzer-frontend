export function formatMilliseconds(ms: number | null): string {
  if (ms === null || ms === undefined) return "";
  const date = new Date(ms);
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const seconds = date.getUTCSeconds().toString().padStart(2, "0");
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, "0");
  return `${hours}:${minutes}:${seconds}:${milliseconds}`;
}

export function parseTime(time: string): number | null {
  if (!time) return null;
  const parts = time.split(":").map(Number);
  if (parts.some(isNaN)) return null;

  const [hours = 0, minutes = 0, seconds = 0, milliseconds = 0] = parts;
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
}

export function formatDate(ms: number | null): string {
  if (ms === null || ms === undefined) return "";
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}