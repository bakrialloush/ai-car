import { CONFIG } from "../config.js";

export class Track {
  constructor() {
    this.reset();
  }

  reset() {
    this.centerPoints = [];
    this.borders = []; // مصفوفة قطع مستقيمة [pointA, pointB] للحواف
    this.isDrawing = false;
    this.isClosed = false;
  }

  startDrawing(point) {
    this.reset();
    this.isDrawing = true;
    this.centerPoints.push(point);
  }

  addPoint(point) {
    if (!this.isDrawing) return;

    const last = this.centerPoints[this.centerPoints.length - 1];
    const dist = Math.hypot(point.x - last.x, point.y - last.y);

    if (dist >= CONFIG.TRACK.MIN_POINT_DISTANCE) {
      this.centerPoints.push(point);
    }
  }
  
  loadPoints(points) {
    this.reset();
    this.centerPoints = points;
    this.isClosed = true;
    this.#buildBorders();
  }

  finishDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    if (this.centerPoints.length < 5) {
      this.reset();
      return;
    }

    this.isClosed = true;
    this.#buildBorders();
  }

  // حساب الحافة الداخلية والخارجية باستخدام المتجه العمودي (Normal Vector)
  #buildBorders() {
    const halfWidth = CONFIG.TRACK.WIDTH / 2;
    const n = this.centerPoints.length;
    const outerPoints = [];
    const innerPoints = [];

    for (let i = 0; i < n; i++) {
      const prev = this.centerPoints[(i - 1 + n) % n];
      const curr = this.centerPoints[i];
      const next = this.centerPoints[(i + 1) % n];

      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;

      const nx = -dy / len;
      const ny = dx / len;

      outerPoints.push({ x: curr.x + nx * halfWidth, y: curr.y + ny * halfWidth });
      innerPoints.push({ x: curr.x - nx * halfWidth, y: curr.y - ny * halfWidth });
    }

    this.borders = [];
    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      this.borders.push([outerPoints[i], outerPoints[nextIdx]]);
      this.borders.push([innerPoints[i], innerPoints[nextIdx]]);
    }
  }

  getStartTransform() {
    if (!this.isClosed) return null;
    const p0 = this.centerPoints[0];
    const p1 = this.centerPoints[1];
    const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    return { x: p0.x, y: p0.y, angle };
  }

  draw(ctx) {
    if (this.centerPoints.length < 2) return;

    // 1. رسم الإسفلت
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.centerPoints[0].x, this.centerPoints[0].y);
    for (let i = 1; i < this.centerPoints.length; i++) {
      ctx.lineTo(this.centerPoints[i].x, this.centerPoints[i].y);
    }
    if (this.isClosed) ctx.closePath();

    ctx.lineWidth = CONFIG.TRACK.WIDTH;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = CONFIG.TRACK.ROAD_COLOR;
    ctx.stroke();

    // 2. رسم الخط المتقطع في المنتصف
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = CONFIG.TRACK.CENTER_LINE_COLOR;
    ctx.stroke();
    ctx.restore();

    // 3. رسم الحواف الفعلية (التي ستصطدم بها السيارة لاحقاً)
    if (this.isClosed) {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = CONFIG.TRACK.BORDER_COLOR;
      for (const [a, b] of this.borders) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
