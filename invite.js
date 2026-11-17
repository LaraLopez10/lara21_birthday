const modal = document.querySelector("#rsvp-modal");
let lastFocus;
document.querySelector("#rsvp").addEventListener("click", () => {
  lastFocus = document.activeElement;
  modal.classList.remove("hidden");
  document.querySelector("#guest-name").focus();
});
function close() {
  modal.classList.add("hidden");
  lastFocus?.focus();
}
document.querySelector("#close").addEventListener("click", close);
modal.addEventListener("click", (e) => {
  if (e.target === modal) close();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) close();
});
document.querySelector("#rsvp-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.querySelector("#guest-name").value.trim();
  if (name.length < 2) return;
  const answer = document.querySelector("#plays").value;
  const msg = `¡Hola Lara! 🍒 Soy ${name} y confirmo mi asistencia a tus 21 el 21/11 a las 22:00. 🥂\n🎲 Participo en los juegos: ${answer}\n¡Nos vemos! 💗`;
  const href = "https://wa.me/5493573495822?text=" + encodeURIComponent(msg);
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.append(a);
  a.click();
  a.remove();
  document.querySelector("#rsvp-status").textContent =
    "¡Listo! En WhatsApp tocá Enviar para confirmar 💗";
});
const date = new Date("2026-11-21T22:00:00-03:00").getTime();
function tick() {
  const diff = Math.max(0, Math.floor((date - Date.now()) / 1000));
  const v = [
    Math.floor(diff / 86400),
    Math.floor((diff % 86400) / 3600),
    Math.floor((diff % 3600) / 60),
    diff % 60,
  ];
  ["days", "hours", "minutes", "seconds"].forEach(
    (id, i) =>
      (document.getElementById(id).textContent = String(v[i]).padStart(2, "0")),
  );
  if (!diff)
    document.querySelector("#count-caption").textContent =
      "¡Llegó la hora de festejar! 🎉";
}
tick();
setInterval(tick, 1000);
