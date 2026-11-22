import { CONFIG } from "./config.js";
import { Track } from "./world/Track.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

const track = new Track();

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener("mousedown", (e) => {
  track.startDrawing(getMousePos(e));
  statusEl.textContent = "جاري الرسم...";
});

canvas.addEventListener("mousemove", (e) => {
  track.addPoint(getMousePos(e));
});

window.addEventListener("mouseup", () => {
  if (!track.isDrawing) return;
  track.finishDrawing();
  statusEl.textContent = track.isClosed
    ? "المسار جاهز!"
    : "المسار قصير جداً، أعد الرسم.";
});

clearBtn.addEventListener("click", () => {
  track.reset();
  statusEl.textContent = "ارسم مساراً مغلقاً بالماوس";
});

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  track.draw(ctx);
  requestAnimationFrame(animate);
}

animate();
