import { CONFIG } from "../config.js";

export class Car {
  constructor(x, y, angle = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 0;
    this.length = CONFIG.CAR.LENGTH;
    this.width = CONFIG.CAR.WIDTH;
  }

  update(input) {
    this.#applyPhysics(input);
  }

  #applyPhysics({ forward, reverse, left, right }) {
    if (forward) this.speed += CONFIG.CAR.ACCELERATION;
    if (reverse) this.speed -= CONFIG.CAR.ACCELERATION;

    // تقييد السرعة القصوى
    if (this.speed > CONFIG.CAR.MAX_SPEED) this.speed = CONFIG.CAR.MAX_SPEED;
    if (this.speed < -CONFIG.CAR.MAX_SPEED / 2) this.speed = -CONFIG.CAR.MAX_SPEED / 2;

    // الاحتكاك
    if (this.speed > 0) this.speed -= CONFIG.CAR.FRICTION;
    if (this.speed < 0) this.speed += CONFIG.CAR.FRICTION;
    if (Math.abs(this.speed) < CONFIG.CAR.FRICTION) this.speed = 0;

    // التوجيه (يعتمد على اتجاه الحركة)
    if (this.speed !== 0) {
      const flip = this.speed > 0 ? 1 : -1;
      if (left) this.angle -= CONFIG.CAR.TURN_SPEED * flip;
      if (right) this.angle += CONFIG.CAR.TURN_SPEED * flip;
    }

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // هيكل السيارة
    ctx.fillStyle = CONFIG.CAR.COLOR;
    ctx.fillRect(-this.length / 2, -this.width / 2, this.length, this.width);

    // الزجاج الأمامي لتمييز الاتجاه
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(this.length / 6, -this.width / 2 + 2, this.length / 4, this.width - 4);

    ctx.restore();
  }
}