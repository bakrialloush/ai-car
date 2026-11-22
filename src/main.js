import { CONFIG } from "./config.js";
import { Track } from "./world/Track.js";
import { GeneticManager } from "./ai/GeneticManager.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const clearBtn = document.getElementById("clearBtn");
const speedBtn = document.getElementById("speedBtn");
const statusEl = document.getElementById("status");

canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

const track = new Track();
let manager = null;
let speedMultiplier = 1;

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener("mousedown", (e) => {
  manager = null;
  track.startDrawing(getMousePos(e));
  statusEl.textContent = "جاري الرسم...";
});

canvas.addEventListener("mousemove", (e) => {
  track.addPoint(getMousePos(e));
});

window.addEventListener("mouseup", () => {
  if (!track.isDrawing) return;
  track.finishDrawing();

  if (track.isClosed) {
    manager = new GeneticManager(track);
  } else {
    statusEl.textContent = "المسار قصير جداً، أعد الرسم.";
  }
});

clearBtn.addEventListener("click", () => {
  track.reset();
  manager = null;
  statusEl.textContent = "ارسم مساراً مغلقاً بالماوس";
});

speedBtn.addEventListener("click", () => {
  speedMultiplier = speedMultiplier === 1 ? 5 : 1;
  speedBtn.textContent = `السرعة: ${speedMultiplier}x`;
});

const FRAME_TIME = 1000 / 60;
let lastTime = 0;

function animate(time = 0) {
  requestAnimationFrame(animate);
  if (time - lastTime < FRAME_TIME) return;
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  track.draw(ctx);

  if (manager) {
    let state;
    for (let i = 0; i < speedMultiplier; i++) {
      state = manager.update();
    }
    manager.draw(ctx, state.currentBestCar);
    statusEl.textContent = `الجيل: ${manager.generation} | المتبقي: ${state.aliveCount} | أفضل تقدم: ${Math.floor(manager.bestScore)}`;
  }
}

animate();