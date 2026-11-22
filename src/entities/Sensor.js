import { CONFIG } from "../config.js";
import { lerp, getIntersection } from "../utils/math.js";

export class Sensor {
  constructor(car) {
    this.car = car;
    this.rayCount = CONFIG.SENSOR.RAY_COUNT;
    this.rayLength = CONFIG.SENSOR.RAY_LENGTH;
    this.raySpread = CONFIG.SENSOR.RAY_SPREAD;
    this.rays = [];
    this.readings = [];
  }

  update(borders) {
    this.#castRays();
    this.readings = this.rays.map((ray) => this.#getReading(ray, borders));
  }

  // قراءات جاهزة للشبكة العصبية لاحقاً: 0 (بعيد/آمن) إلى 1 (قريب جداً)
  getNormalizedReadings() {
    return this.readings.map((r) => (r ? 1 - r.offset : 0));
  }

  #castRays() {
    this.rays = [];
    for (let i = 0; i < this.rayCount; i++) {
      const t = this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1);
      const rayAngle = this.car.angle + lerp(-this.raySpread / 2, this.raySpread / 2, t);

      const start = { x: this.car.x, y: this.car.y };
      const end = {
        x: this.car.x + Math.cos(rayAngle) * this.rayLength,
        y: this.car.y + Math.sin(rayAngle) * this.rayLength,
      };
      this.rays.push([start, end]);
    }
  }

  #getReading(ray, borders) {
    let closest = null;

    for (const [b1, b2] of borders) {
      const touch = getIntersection(ray[0], ray[1], b1, b2);
      if (touch && (!closest || touch.offset < closest.offset)) {
        closest = touch;
      }
    }
    return closest;
  }

  draw(ctx) {
    for (let i = 0; i < this.rayCount; i++) {
      const [start, end] = this.rays[i];
      const hit = this.readings[i] || end;

      ctx.lineWidth = 2;
      ctx.strokeStyle = CONFIG.SENSOR.RAY_COLOR;
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(hit.x, hit.y);
      ctx.stroke();

      ctx.strokeStyle = CONFIG.SENSOR.HIT_COLOR;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(hit.x, hit.y);
      ctx.stroke();
    }
  }
}