const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ordinal(day: number): string {
  if (day % 100 >= 11 && day % 100 <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

/** Public-facing date format: "July 8th, 2026". Never numeric like 7/8/2026. */
export function formatPublicDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getMonth()]} ${ordinal(d.getDate())}, ${d.getFullYear()}`;
}
