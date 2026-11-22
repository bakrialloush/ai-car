import { CONFIG } from "../config.js";
import { Car } from "../entities/Car.js";
import { NeuralNetwork } from "./NeuralNetwork.js";

export class GeneticManager {
  constructor(track) {
    this.track = track;
    this.generation = 1;
    this.bestBrain = null;
    this.bestScore = 0;
    this.cars = [];
    this.#spawnGeneration();
  }

  #spawnGeneration() {
    const start = this.track.getStartTransform();
    this.cars = [];

    for (let i = 0; i < CONFIG.GENETIC.POPULATION_SIZE; i++) {
      let brain = null;
      if (this.bestBrain) {
        brain = structuredClone(this.bestBrain);
        // السيارة 0 نسخة مطابقة (Elitism)، والبقية بطفرات طفيفة
        if (i > 0) {
          NeuralNetwork.mutate(brain, CONFIG.GENETIC.MUTATION_RATE);
        }
      }
      this.cars.push(new Car(start.x, start.y, start.angle, true, brain));
    }
  }

  update() {
    let aliveCount = 0;
    let currentBestCar = this.cars[0];
    let currentBestScore = -1;

    for (const car of this.cars) {
      car.update(this.track.borders, this.track.centerPoints);
      if (!car.damaged) aliveCount++;

      const score = car.getScore(this.track.centerPoints);
      if (score > currentBestScore) {
        currentBestScore = score;
        currentBestCar = car;
      }
    }

    if (currentBestScore > this.bestScore) {
      this.bestScore = currentBestScore;
      this.bestBrain = structuredClone(currentBestCar.brain);
    }

    if (aliveCount === 0) {
      this.nextGeneration();
    }

    return { aliveCount, currentBestCar };
  }

  nextGeneration() {
    this.generation++;
    this.#spawnGeneration();
  }

  draw(ctx, bestCar) {
    for (const car of this.cars) {
      if (car !== bestCar) car.draw(ctx, false);
    }
    if (bestCar) bestCar.draw(ctx, true);
  }
}