import { CONFIG } from "./config.js";
import { Track } from "./world/Track.js";
import { Car } from "./entities/Car.js";

const FRAME_TIME = 1000 / 120;
let lastTime = 0;

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

const track = new Track();
let car = null;

const keys = { forward: false, reverse: false, left: false, right: false };

function setKey(code, isPressed) {
  if (code === "ArrowUp" || code === "KeyW") keys.forward = isPressed;
  if (code === "ArrowDown" || code === "KeyS") keys.reverse = isPressed;
  if (code === "ArrowLeft" || code === "KeyA") keys.left = isPressed;
  if (code === "ArrowRight" || code === "KeyD") keys.right = isPressed;
}

window.addEventListener("keydown", (e) => setKey(e.code, true));
window.addEventListener("keyup", (e) => setKey(e.code, false));

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener("mousedown", (e) => {
  car = null;
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
    const start = track.getStartTransform();
    car = new Car(start.x, start.y, start.angle);
    statusEl.textContent = "استخدم الأسهم أو WASD للقيادة";
  } else {
    statusEl.textContent = "المسار قصير جداً، أعد الرسم.";
  }
});

clearBtn.addEventListener("click", () => {
  track.reset();
  car = null;
  statusEl.textContent = "ارسم مساراً مغلقاً بالماوس";
});

function animate(time = 0) {
  requestAnimationFrame(animate);

  if (time - lastTime < FRAME_TIME) return;
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  track.draw(ctx);

  if (car) {
    car.update(keys);
    car.draw(ctx);
  }
}

animate();