import {
  TEAM_LABELS,
  emptyState,
  readState,
  persist,
  safeText,
  renderTeams,
  encodeTeams,
  teamPlainText,
  copyText,
  makeTeams,
} from "./shared.js";
const $ = (id) => document.getElementById(id);
let data = readState();
let busy = false;
function save() {
  try {
    persist(data);
  } catch {
    $("backup-status").textContent =
      "No se pudo guardar. Descargá una copia JSON.";
  }
}
function currentTeams() {
  return makeTeams(data.teams, data.teamNames);
}
function publicUrl(teams) {
  return new URL(
    "./equipos.html#t=" +
      encodeTeams(
        teams
          .map((t) => t.members)
          .map((members, i) => ({ name: teams[i].name, members })),
      ),
    location.href,
  ).href;
}
function invalidate() {
  data.teams = [];
  data.publishedTeams = [];
  data.publishedAt = null;
}
function drawNames() {
  const n = Number($("count").value),
    root = $("team-name-fields");
  root.replaceChildren();
  for (let i = 0; i < n; i++) {
    const label = document.createElement("label");
    label.className = "form-field";
    label.textContent = `Nombre del equipo ${i + 1}`;
    const input = document.createElement("input");
    input.maxLength = 40;
    input.placeholder = TEAM_LABELS[i]?.replace(/^\S+ /, "") || `Team ${i + 1}`;
    input.value = data.teamNames[i] || "";
    input.dataset.teamName = "";
    input.addEventListener("input", () => {
      data.teamNames[i] = safeText(input.value);
      save();
      if (data.teams.length) render();
    });
    label.append(input);
    root.append(label);
  }
}
function renderGuests() {
  const root = $("guests");
  root.replaceChildren();
  data.guests.forEach((name, i) => {
    const chip = document.createElement("span");
    chip.className = "tag guest-tag";
    chip.append(document.createTextNode(name + " "));
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "×";
    b.setAttribute("aria-label", "Quitar a " + name);
    b.onclick = () => {
      data.guests.splice(i, 1);
      invalidate();
      save();
      render();
    };
    chip.append(b);
    root.append(chip);
  });
  $("guest-count").textContent =
    `${data.guests.length} ${data.guests.length === 1 ? "jugadora" : "jugadoras"}`;
}
function render() {
  renderGuests();
  const holder = $("teams");
  holder.replaceChildren();
  const teams = currentTeams();
  if (!teams.length) {
    const p = document.createElement("p");
    p.className = "notice";
    p.textContent =
      "La máquina está lista. Cargá participantes y elegí cuántos equipos querés.";
    holder.append(p);
  } else {
    renderTeams(holder, teams);
    $("confirm-result").classList.remove("hidden");
  }
  const published = data.publishedTeams?.length > 0;
  $("publish-actions").classList.toggle("hidden", !published);
  $("confirm-result").classList.toggle("hidden", !teams.length || published);
  if (published) {
    renderTeams(
      holder,
      makeTeams(
        data.publishedTeams.map((t) => t.members),
        data.publishedTeams.map((t) => t.name),
      ),
    );
    $("view-teams").href = publicUrl(data.publishedTeams);
    $("publish-info").textContent =
      "Resultado confirmado y publicado. Compartí el enlace para revelar los equipos.";
  } else $("publish-info").textContent = "";
}
$("count").value = String(Math.max(2, Math.min(6, data.teams.length || 4)));
drawNames();
$("count").addEventListener("change", () => {
  invalidate();
  drawNames();
  save();
  render();
});
$("add-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = safeText($("name").value);
  if (name.length < 2) return;
  if (
    data.guests.some(
      (n) => n.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"),
    )
  ) {
    alert("Ese nombre ya está cargado.");
    return;
  }
  data.guests.push(name);
  invalidate();
  save();
  render();
  $("add-form").reset();
  $("name").focus();
});
$("draw").onclick = () => {
  if (busy) return;
  const count = Number($("count").value);
  if (data.guests.length < count) {
    $("draw-status").textContent =
      `Agregá al menos ${count} participantes para formar ${count} equipos.`;
    return;
  }
  busy = true;
  $("draw").disabled = true;
  $("confirm-result").classList.add("hidden");
  $("draw-status").textContent = "La suerte está girando…";
  const slot = $("slot-window");
  slot.classList.add("spinning");
  let tick = 0;
  const interval = setInterval(() => {
    slot.querySelector("b").textContent =
      data.guests[Math.floor(Math.random() * data.guests.length)];
    if (++tick >= 14) {
      clearInterval(interval);
      slot.classList.remove("spinning");
      const shuffled = [...data.guests];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      data.teams = Array.from({ length: count }, () => []);
      shuffled.forEach((name, i) => data.teams[i % count].push(name));
      data.publishedTeams = [];
      data.publishedAt = null;
      save();
      busy = false;
      $("draw").disabled = false;
      $("draw-status").textContent =
        "¡Tenemos equipos! Revisalos y confirmá cuando estén listos.";
      render();
    }
  }, 120);
};
$("confirm-result").onclick = () => {
  if (!data.teams.length) return;
  data.publishedTeams = currentTeams();
  data.publishedAt = Date.now();
  save();
  render();
  $("draw-status").textContent =
    "¡Publicado! Ya podés copiar el enlace o compartir por WhatsApp.";
};
$("copy-link").onclick = async () => {
  try {
    await copyText($("view-teams").href);
    $("draw-status").textContent =
      "Enlace copiado. Pegalo en tu grupo de WhatsApp.";
  } catch {
    $("draw-status").textContent =
      "Abrí la vista pública y copiá su dirección.";
  }
};
$("send-teams").onclick = () =>
  window.open(
    "https://wa.me/?text=" +
      encodeURIComponent(
        teamPlainText(data.publishedTeams) +
          "\n\nVer equipos: " +
          $("view-teams").href,
      ),
    "_blank",
    "noopener",
  );
$("export").onclick = () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lucky-cherry-respaldo.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("backup-status").textContent = "Copia descargada.";
};
$("import").onclick = () => $("import-file").click();
$("import-file").onchange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 1000000) throw Error("Archivo demasiado grande");
    const obj = JSON.parse(await file.text());
    if (
      !Array.isArray(obj.guests) ||
      obj.guests.length > 500 ||
      obj.guests.some((n) => typeof n !== "string" || n.length > 70) ||
      !Array.isArray(obj.teams) ||
      obj.teams.length > 12 ||
      obj.teams.some(
        (t) =>
          !Array.isArray(t) ||
          t.some((n) => typeof n !== "string" || n.length > 70),
      )
    )
      throw Error("Formato inválido");
    if (!confirm("¿Reemplazar toda la organización por este respaldo?")) return;
    data = {
      ...emptyState(),
      ...obj,
      teamNames: Array.isArray(obj.teamNames) ? obj.teamNames : [],
      publishedTeams: Array.isArray(obj.publishedTeams)
        ? obj.publishedTeams
        : [],
    };
    save();
    drawNames();
    render();
    $("backup-status").textContent = "Copia restaurada correctamente.";
  } catch (err) {
    $("backup-status").textContent = "No se pudo importar: " + err.message;
  } finally {
    e.target.value = "";
  }
};
render();
