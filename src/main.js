import { CONFIG } from "./config.js";
import { Track } from "./world/Track.js";
import { GeneticManager } from "./ai/GeneticManager.js";
import { exportToJson, importFromJson } from "./utils/storage.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const clearBtn = document.getElementById("clearBtn");
const speedBtn = document.getElementById("speedBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const statusEl = document.getElementById("status");
const fileInput = document.getElementById("fileInput");

function resizeCanvas() {
  const isPortrait = window.matchMedia("(max-width: 600px)").matches;
  canvas.width = isPortrait ? CONFIG.PORTRAIT_WIDTH : CONFIG.CANVAS_WIDTH;
  canvas.height = isPortrait ? CONFIG.PORTRAIT_HEIGHT : CONFIG.CANVAS_HEIGHT;
}

resizeCanvas();
window.addEventListener("resize", () => {
  if (!track.isClosed && !track.isDrawing) resizeCanvas();
});

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

saveBtn.addEventListener("click", () => {
  if (!track.isClosed || !manager?.bestBrain) {
    statusEl.textContent = "لا توجد بيانات تدريب جاهزة للحفظ بعد.";
    return;
  }

  exportToJson({
    trackPoints: track.centerPoints,
    bestBrain: manager.bestBrain,
    generation: manager.generation,
  });
});

loadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = await importFromJson(file);
    if (!data.trackPoints || !data.bestBrain) throw new Error("ملف غير صالح");

    track.loadPoints(data.trackPoints);
    manager = new GeneticManager(track, data.bestBrain, data.generation || 1);
  } catch {
    statusEl.textContent = "فشل تحميل الملف، تأكد من أنه ملف JSON صالح.";
  } finally {
    fileInput.value = "";
  }
});

function getPointerPos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

canvas.addEventListener("pointerdown", (e) => {
  canvas.setPointerCapture(e.pointerId);
  manager = null;
  track.startDrawing(getPointerPos(e));
  statusEl.textContent = "جاري الرسم...";
});

canvas.addEventListener("pointermove", (e) => {
  if (!track.isDrawing) return;
  track.addPoint(getPointerPos(e));
});

function handlePointerUp() {
  if (!track.isDrawing) return;
  track.finishDrawing();

  if (track.isClosed) {
    manager = new GeneticManager(track);
  } else {
    statusEl.textContent = "المسار قصير جداً، أعد الرسم.";
  }
}

window.addEventListener("pointerup", handlePointerUp);
window.addEventListener("pointercancel", handlePointerUp);

const FRAME_TIME = 1000 / 1000;
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