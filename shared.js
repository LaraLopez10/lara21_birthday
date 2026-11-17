export const TEAM_LABELS = [
  "🍒 Team Cherry",
  "🎀 Team Pink",
  "🪩 Team Disco",
  "🍸 Team Cocktail",
  "👑 Team Iconic",
  "💋 Team Glam",
  "💖 Team Sweet",
];
export const KEY = "lara21-organizador-v1";
export function emptyState() {
  return {
    guests: [],
    teams: [],
    teamNames: [],
    publishedTeams: [],
    publishedAt: null,
  };
}
export function readState() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.guests) && Array.isArray(d.teams))
      return {
        ...emptyState(),
        ...d,
        teamNames: Array.isArray(d.teamNames) ? d.teamNames : [],
        publishedTeams: Array.isArray(d.publishedTeams) ? d.publishedTeams : [],
      };
  } catch {}
  return emptyState();
}
export function persist(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}
export function safeText(s) {
  return String(s ?? "")
    .trim()
    .slice(0, 70);
}
export function teamsPayload(teams) {
  return {
    version: 1,
    teams: teams.map((entry, i) =>
      Array.isArray(entry)
        ? { name: TEAM_LABELS[i] || `Equipo ${i + 1}`, members: entry }
        : {
            name: safeText(entry.name) || TEAM_LABELS[i] || `Equipo ${i + 1}`,
            members: entry.members,
          },
    ),
  };
}
export function makeTeams(members, names = []) {
  return members.map((group, i) => ({
    name: safeText(names[i]) || TEAM_LABELS[i] || `Equipo ${i + 1}`,
    members: group,
  }));
}
export function encodeTeams(teams) {
  const json = JSON.stringify(teamsPayload(teams));
  const bytes = new TextEncoder().encode(json);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decodeTeams(hash) {
  const raw = hash.replace(/^#t=/, "");
  if (!raw || raw.length > 10000) throw Error("Enlace incorrecto");
  const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (
    data.version !== 1 ||
    !Array.isArray(data.teams) ||
    data.teams.length > 12 ||
    data.teams.some(
      (t) =>
        typeof t.name !== "string" ||
        !Array.isArray(t.members) ||
        t.members.some((m) => typeof m !== "string" || m.length > 70),
    )
  )
    throw Error("Datos de equipos inválidos");
  return data.teams;
}
export function renderTeams(target, teams) {
  target.replaceChildren();
  const grid = document.createElement("div");
  grid.className = "team-grid";
  teams.forEach((t) => {
    const card = document.createElement("article");
    card.className = "team-card";
    const h = document.createElement("h3");
    h.textContent = t.name;
    card.append(h);
    const ul = document.createElement("ul");
    t.members.forEach((m) => {
      const li = document.createElement("li");
      li.textContent = m;
      ul.append(li);
    });
    card.append(ul);
    grid.append(card);
  });
  target.append(grid);
}
export function teamPlainText(teams) {
  return (
    "🍒 LARA’S 21 — EQUIPOS DE GAME NIGHT 🎲\n\n" +
    teams
      .map((t) => t.name + "\n" + t.members.map((n) => "• " + n).join("\n"))
      .join("\n\n") +
    "\n\n¡Nos vemos el 21/11 a las 22:00! 🥂"
  );
}
export function basePath(file) {
  return new URL(file, document.baseURI);
}
export async function copyText(t) {
  await navigator.clipboard.writeText(t);
}
