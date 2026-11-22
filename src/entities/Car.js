import { CONFIG } from "../config.js";
import { polyIntersectsSegments } from "../utils/math.js";
import { Sensor } from "./Sensor.js";
import { NeuralNetwork } from "../ai/NeuralNetwork.js";

export class Car {
  constructor(x, y, angle = 0, useBrain = false, brain = null) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.speed = 0;
    this.length = CONFIG.CAR.LENGTH;
    this.width = CONFIG.CAR.WIDTH;
    this.damaged = false;
    this.polygon = [];
    this.sensor = new Sensor(this);
    this.fitness = 0;
    this.nextCheckpoint = 1;
    this.framesSinceProgress = 0;

    this.useBrain = useBrain;
    if (useBrain) {
      this.brain =
        brain ||
        new NeuralNetwork([
          CONFIG.SENSOR.RAY_COUNT,
          CONFIG.AI.HIDDEN_NEURONS,
          CONFIG.AI.OUTPUT_NEURONS,
        ]);
    }
  }

update(borders, centerPoints) {
    if (!this.damaged) {
      this.sensor.update(borders);
      const input = this.#getBrainInput();
      this.#applyPhysics(input);
      this.polygon = this.#createPolygon();
      this.damaged = polyIntersectsSegments(this.polygon, borders);
      this.#updateFitness(centerPoints);
    }
  }

  #updateFitness(centerPoints) {
    const target = centerPoints[this.nextCheckpoint];
    const dist = Math.hypot(target.x - this.x, target.y - this.y);

    if (dist < CONFIG.TRACK.WIDTH * 0.6) {
      this.fitness += 1;
      this.nextCheckpoint = (this.nextCheckpoint + 1) % centerPoints.length;
      this.framesSinceProgress = 0;
    } else {
      this.framesSinceProgress++;
      if (this.framesSinceProgress > CONFIG.GENETIC.STALL_FRAMES) {
        this.damaged = true; // منع الدوران حول النفس
      }
    }
  }

  getScore(centerPoints) {
    const target = centerPoints[this.nextCheckpoint];
    const dist = Math.hypot(target.x - this.x, target.y - this.y);
    return this.fitness + 1 / (1 + dist);
  }

  #getBrainInput() {
    const offsets = this.sensor.getNormalizedReadings();
    const outputs = NeuralNetwork.feedForward(offsets, this.brain);
    return {
      forward: true,  // دفع مستمر للأمام (يمنع التوقف)
      reverse: false, // منع الرجوع للخلف
      left: Boolean(outputs[0]),
      right: Boolean(outputs[1]),
    };
  }

  #applyPhysics({ forward, reverse, left, right }) {
    if (forward) this.speed += CONFIG.CAR.ACCELERATION;
    if (reverse) this.speed -= CONFIG.CAR.ACCELERATION;

    if (this.speed > CONFIG.CAR.MAX_SPEED) this.speed = CONFIG.CAR.MAX_SPEED;
    if (this.speed < -CONFIG.CAR.MAX_SPEED / 2) this.speed = -CONFIG.CAR.MAX_SPEED / 2;

    if (this.speed > 0) this.speed -= CONFIG.CAR.FRICTION;
    if (this.speed < 0) this.speed += CONFIG.CAR.FRICTION;
    if (Math.abs(this.speed) < CONFIG.CAR.FRICTION) this.speed = 0;

    if (this.speed !== 0) {
      const flip = this.speed > 0 ? 1 : -1;
      if (left) this.angle -= CONFIG.CAR.TURN_SPEED * flip;
      if (right) this.angle += CONFIG.CAR.TURN_SPEED * flip;
    }

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;
  }

  #createPolygon() {
    const hl = this.length / 2;
    const hw = this.width / 2;
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);

    const localCorners = [
      { x: hl, y: hw },
      { x: hl, y: -hw },
      { x: -hl, y: -hw },
      { x: -hl, y: hw },
    ];

    return localCorners.map((p) => ({
      x: this.x + p.x * cos - p.y * sin,
      y: this.y + p.x * sin + p.y * cos,
    }));
  }

draw(ctx, isBest = false) {
    if (isBest) {
      this.sensor.draw(ctx);
    }

    ctx.save();
    ctx.globalAlpha = isBest ? 1 : 0.25;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.damaged
      ? CONFIG.CAR.DAMAGED_COLOR
      : isBest
      ? CONFIG.GENETIC.BEST_CAR_COLOR
      : CONFIG.CAR.COLOR;

    ctx.fillRect(-this.length / 2, -this.width / 2, this.length, this.width);
    ctx.fillStyle = "#93c5fd";
    ctx.fillRect(this.length / 6, -this.width / 2 + 2, this.length / 4, this.width - 4);
    ctx.restore();
  }
}