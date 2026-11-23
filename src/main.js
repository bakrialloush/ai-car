import { CONFIG } from "./config.js";
import { Track } from "./world/Track.js";
import { Car } from "./entities/Car.js";
import { GeneticManager } from "./ai/GeneticManager.js";
import { exportToJson, importFromJson } from "./utils/storage.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const clearBtn = document.getElementById("clearBtn");
const resetBrainBtn = document.getElementById("resetBrainBtn");
const modeBtn = document.getElementById("modeBtn");
const speedBtn = document.getElementById("speedBtn");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const statusEl = document.getElementById("status");
const fileInput = document.getElementById("fileInput");

const track = new Track();
let manager = null;
let runCar = null;
let savedBrain = null;
let savedGeneration = 1;
let isRunMode = false;
let speedMultiplier = 1;

function resizeCanvas() {
  const isPortrait = window.matchMedia("(max-width: 600px)").matches;
  canvas.width = isPortrait ? CONFIG.PORTRAIT_WIDTH : CONFIG.CANVAS_WIDTH;
  canvas.height = isPortrait ? CONFIG.PORTRAIT_HEIGHT : CONFIG.CANVAS_HEIGHT;
}

resizeCanvas();
window.addEventListener("resize", () => {
  if (!track.isClosed && !track.isDrawing) resizeCanvas();
});

function startSimulation() {
  if (!track.isClosed) return;

  if (isRunMode && savedBrain) {
    manager = null;
    const start = track.getStartTransform();
    runCar = new Car(start.x, start.y, start.angle, true, structuredClone(savedBrain));
  } else {
    isRunMode = false;
    modeBtn.textContent = "الطور: تدريب";
    runCar = null;
    manager = new GeneticManager(track, savedBrain, savedGeneration);
  }
}

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
  if (manager?.bestBrain) {
    savedBrain = structuredClone(manager.bestBrain);
    savedGeneration = manager.generation;
  }
  manager = null;
  runCar = null;
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
    startSimulation();
  } else {
    statusEl.textContent = "المسار قصير جداً، أعد الرسم.";
  }
}

window.addEventListener("pointerup", handlePointerUp);
window.addEventListener("pointercancel", handlePointerUp);

clearBtn.addEventListener("click", () => {
  if (manager?.bestBrain) {
    savedBrain = structuredClone(manager.bestBrain);
    savedGeneration = manager.generation;
  }
  track.reset();
  manager = null;
  runCar = null;
  statusEl.textContent = savedBrain
    ? `تم مسح المسار (الجيل ${savedGeneration} محفوظ في الذاكرة)`
    : "ارسم مساراً مغلقاً بالماوس أو اللمس";
});

resetBrainBtn.addEventListener("click", () => {
  savedBrain = null;
  savedGeneration = 1;
  isRunMode = false;
  modeBtn.textContent = "الطور: تدريب";
  runCar = null;

  if (track.isClosed) {
    manager = new GeneticManager(track);
  } else {
    statusEl.textContent = "تم تصفير بيانات التدريب. ارسم مساراً جديداً.";
  }
});

modeBtn.addEventListener("click", () => {
  if (!isRunMode && !savedBrain) {
    statusEl.textContent = "لا يوجد دماغ مدرّب بعد لتشغيله.";
    return;
  }

  if (!isRunMode && manager?.bestBrain) {
    savedBrain = structuredClone(manager.bestBrain);
    savedGeneration = manager.generation;
  }

  isRunMode = !isRunMode;
  modeBtn.textContent = isRunMode ? "الطور: تشغيل 🚗" : "الطور: تدريب";
  startSimulation();
});

speedBtn.addEventListener("click", () => {
  speedMultiplier = speedMultiplier === 1 ? 5 : 1;
  speedBtn.textContent = `السرعة: ${speedMultiplier}x`;
});

saveBtn.addEventListener("click", () => {
  const brainToSave = manager?.bestBrain || savedBrain;
  const genToSave = manager?.generation || savedGeneration;

  if (!track.isClosed || !brainToSave) {
    statusEl.textContent = "لا توجد بيانات تدريب جاهزة للحفظ بعد.";
    return;
  }

  exportToJson({
    trackPoints: track.centerPoints,
    bestBrain: brainToSave,
    generation: genToSave,
  });
});

loadBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const data = await importFromJson(file);
    if (!data.trackPoints || !data.bestBrain) throw new Error("ملف غير صالح");

    savedBrain = structuredClone(data.bestBrain);
    savedGeneration = data.generation || 1;
    track.loadPoints(data.trackPoints);
    startSimulation();
  } catch {
    statusEl.textContent = "فشل تحميل الملف، تأكد من أنه ملف JSON صالح.";
  } finally {
    fileInput.value = "";
  }
});

const FRAME_TIME = 1000 / 60;
let lastTime = 0;

function animate(time = 0) {
  requestAnimationFrame(animate);
  if (time - lastTime < FRAME_TIME) return;
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  track.draw(ctx);

  if (isRunMode && runCar) {
    for (let i = 0; i < speedMultiplier; i++) {
      runCar.update(track.borders, track.centerPoints);
      if (runCar.damaged) {
        const start = track.getStartTransform();
        runCar = new Car(start.x, start.y, start.angle, true, structuredClone(savedBrain));
      }
    }
    runCar.draw(ctx, true);
    statusEl.textContent = `🚗 طور التشغيل | الجيل: ${savedGeneration} | التقدم: ${runCar.fitness}`;
  } else if (manager) {
    let state;
    for (let i = 0; i < speedMultiplier; i++) {
      state = manager.update();
      if (manager.bestBrain) {
        savedBrain = manager.bestBrain;
      }
      savedGeneration = manager.generation;
    }
    manager.draw(ctx, state.currentBestCar);
    const brainTag = savedBrain ? "🧠" : "🆕";
    statusEl.textContent = `${brainTag} الجيل: ${manager.generation} | المتبقي: ${state.aliveCount} | أفضل تقدم: ${Math.floor(manager.bestScore)}`;
  }
}

animate();