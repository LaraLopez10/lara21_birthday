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
function invalidateDraw() {
  data.teams = [];
  data.publishedTeams = [];
  data.publishedAt = null;
}
function invalidateTeamConfig() { data.teamsConfirmed = false; invalidateDraw(); }
function validTeamSetup() {
  const count = Number(data.teamCount || $("count").value);
  const names = data.teamNames.slice(0, count).map(safeText);
  return count >= 2 && count <= 6 && count <= data.guests.length && names.length === count &&
    names.every(Boolean) && new Set(names.map(name => name.toLocaleLowerCase("es"))).size === count;
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
    input.value = data.teamNames[i] || TEAM_LABELS[i] || `Team ${i + 1}`;
    data.teamNames[i] = input.value;
    input.dataset.teamName = "";
    input.addEventListener("input", () => {
      data.teamNames[i] = safeText(input.value);
      invalidateDraw();
      data.teamsConfirmed = false;
      save();
      render();
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
      if (data.participantsConfirmed) return;
      data.guests.splice(i, 1);
      data.participantsConfirmed = false;
      data.teamsConfirmed = false;
      invalidateDraw();
      save();
      render();
    };
    chip.append(b);
    root.append(chip);
  });
  $("guest-count").textContent = `${data.guests.length} ${data.guests.length === 1 ? "jugadora" : "jugadoras"}`;
}
function render() {
  if (data.teamsConfirmed && (!data.participantsConfirmed || !validTeamSetup())) {
    data.teamsConfirmed = false;
    invalidateDraw();
    save();
  }
  renderGuests();
  const guestLocked = data.participantsConfirmed;
  $("add-form").querySelectorAll("input,button").forEach(el => el.disabled = guestLocked);
  $("guests").classList.toggle("is-locked", guestLocked);
  $("confirm-guests").classList.toggle("hidden", guestLocked);
  $("edit-guests").classList.toggle("hidden", !guestLocked);
  $("guest-confirmed-status").classList.toggle("hidden", !guestLocked);
  $("confirmed-guest-total").textContent = `${data.guests.length} jugadoras confirmadas`;
  const setupLocked = !data.participantsConfirmed;
  $("team-setup").classList.toggle("locked", setupLocked || data.teamsConfirmed);
  $("team-setup-lock").classList.toggle("hidden", !setupLocked);
  $("count").disabled = setupLocked || data.teamsConfirmed;
  $("team-name-fields").querySelectorAll("input").forEach(el => el.disabled = setupLocked || data.teamsConfirmed);
  $("confirm-teams").classList.toggle("hidden", setupLocked || data.teamsConfirmed);
  $("edit-teams").classList.toggle("hidden", setupLocked || !data.teamsConfirmed);
  $("team-confirmed-status").classList.toggle("hidden", !data.teamsConfirmed);
  const nTeams = Number($("count").value);
  const minSize = nTeams ? Math.floor(data.guests.length / nTeams) : 0;
  const remainder = nTeams ? data.guests.length % nTeams : 0;
  $("team-size-estimate").textContent = `${remainder ? `${remainder} equipos tendrán ${minSize + 1}` : `Cada equipo tendrá ${minSize}`} ${minSize === 1 && remainder === 0 ? "integrante" : "integrantes"}${remainder ? ` y ${nTeams - remainder} tendrán ${minSize}` : ""}.`;
  $("draw").disabled = busy || !data.participantsConfirmed || !data.teamsConfirmed;
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
  renderEditableResult();
  $("result-share-actions").classList.toggle("hidden", !published);
}
function renderEditableResult() {
  const root = $("editable-result"); root.replaceChildren();
  const teams = data.publishedTeams?.length ? data.publishedTeams : currentTeams();
  if (!teams.length) { root.innerHTML = '<p class="notice">Primero sorteá equipos para revisar la distribución.</p>'; return; }
  const grid = document.createElement("div"); grid.className = "team-grid";
  teams.forEach((team, ti) => {
    const card = document.createElement("section"); card.className = "team-card";
    const title = document.createElement("h3"); title.textContent = team.name; card.append(title);
    team.members.forEach((member, mi) => {
      const row = document.createElement("div"); row.className = "member-edit";
      const name = document.createElement("span"); name.textContent = member; row.append(name);
      const select = document.createElement("select"); select.setAttribute("aria-label", `Mover ${member} a otro equipo`);
      teams.forEach((destination, di) => { const option = document.createElement("option"); option.value = String(di); option.textContent = destination.name; option.selected = di === ti; select.append(option); });
      select.addEventListener("change", () => {
        const moved = teams[ti].members.splice(mi, 1)[0]; teams[Number(select.value)].members.push(moved);
        data.teamNames = teams.map(t => t.name); data.teams = teams.map(t => t.members);
        if (data.publishedTeams?.length) data.publishedTeams = teams;
        render();
      }); row.append(select); card.append(row);
    }); grid.append(card);
  }); root.append(grid);
}
document.querySelectorAll(".tab-button").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".tab-button").forEach(tab => { const active = tab === button; tab.classList.toggle("active", active); tab.setAttribute("aria-selected", String(active)); });
  document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.toggle("hidden", panel.id !== button.dataset.panel));
}));
$("count").value = String(Math.max(2, Math.min(6, data.teamCount || data.teams.length || 4)));
drawNames();
$("count").addEventListener("change", () => {
  data.teamCount = Number($("count").value);
  invalidateTeamConfig();
  drawNames();
  save();
  render();
});
$("confirm-guests").addEventListener("click", () => {
  if (!data.guests.length) { $("guest-feedback").textContent = "Agregá al menos una participante antes de confirmar."; return; }
  $("guest-feedback").textContent = "";
  data.participantsConfirmed = true; data.teamsConfirmed = false; invalidateDraw(); save(); render();
});
$("edit-guests").addEventListener("click", () => {
  data.participantsConfirmed = false; data.teamsConfirmed = false; invalidateDraw(); save(); render(); $("name").focus();
});
$("confirm-teams").addEventListener("click", () => {
  if (!data.participantsConfirmed) return;
  const count = Number($("count").value);
  const names = data.teamNames.slice(0, count).map(safeText);
  if (count > data.guests.length) { $("draw-status").textContent = "La cantidad de equipos no puede superar la cantidad de jugadoras."; return; }
  if (names.some(name => !name)) { $("draw-status").textContent = "Completá el nombre de todos los equipos."; return; }
  if (new Set(names.map(name => name.toLocaleLowerCase("es"))).size !== names.length) { $("draw-status").textContent = "Cada equipo debe tener un nombre diferente."; return; }
  data.teamCount = count; data.teamNames = names; data.teamsConfirmed = true; invalidateDraw(); save(); render(); $("draw-status").textContent = "¡Equipos configurados! Ya podés realizar el sorteo.";
});
$("edit-teams").addEventListener("click", () => { data.teamsConfirmed = false; invalidateDraw(); save(); render(); });
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
  if (data.participantsConfirmed) return;
  data.guests.push(name);
  data.participantsConfirmed = false; data.teamsConfirmed = false;
  invalidateDraw();
  save();
  render();
  $("add-form").reset();
  $("name").focus();
});
$("draw").onclick = () => {
  if (busy || !data.participantsConfirmed || !data.teamsConfirmed) return;
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
  slot.classList.add("opening");
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
      slot.classList.remove("opening"); slot.classList.add("opened");
    }
  }, 120);
};
$("save-manual").onclick = () => { if (!data.teams.length) return; data.publishedTeams = currentTeams(); data.publishedAt = Date.now(); save(); render(); $("manual-status").textContent = "Distribución guardada y publicada."; };
$("result-copy-link").onclick = async () => { await copyText(publicUrl(data.publishedTeams)); $("manual-status").textContent = "Enlace público copiado."; };
$("result-share-wa").onclick = () => { const text = teamPlainText(data.publishedTeams) + "\n\nVer equipos: " + publicUrl(data.publishedTeams); window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener"); };
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
