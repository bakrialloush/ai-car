import { lerp } from "../utils/math.js";

class Layer {
  constructor(inputCount, outputCount) {
    this.inputs = new Array(inputCount);
    this.outputs = new Array(outputCount);
    this.biases = new Array(outputCount);
    this.weights = Array.from({ length: inputCount }, () => new Array(outputCount));

    Layer.#randomize(this);
  }

  static #randomize(layer) {
    for (let i = 0; i < layer.inputs.length; i++) {
      for (let j = 0; j < layer.outputs.length; j++) {
        layer.weights[i][j] = Math.random() * 2 - 1;
      }
    }
    for (let i = 0; i < layer.biases.length; i++) {
      layer.biases[i] = Math.random() * 2 - 1;
    }
  }

  static feedForward(givenInputs, layer) {
    for (let i = 0; i < layer.inputs.length; i++) {
      layer.inputs[i] = givenInputs[i];
    }

    for (let j = 0; j < layer.outputs.length; j++) {
      let sum = 0;
      for (let i = 0; i < layer.inputs.length; i++) {
        sum += layer.inputs[i] * layer.weights[i][j];
      }
      layer.outputs[j] = sum > layer.biases[j] ? 1 : 0;
    }

    return layer.outputs;
  }
}

export class NeuralNetwork {
  constructor(neuronCounts) {
    this.layers = [];
    for (let i = 0; i < neuronCounts.length - 1; i++) {
      this.layers.push(new Layer(neuronCounts[i], neuronCounts[i + 1]));
    }
  }

  static feedForward(givenInputs, network) {
    let outputs = Layer.feedForward(givenInputs, network.layers[0]);
    for (let i = 1; i < network.layers.length; i++) {
      outputs = Layer.feedForward(outputs, network.layers[i]);
    }
    return outputs;
  }

  static mutate(network, amount = 0.1) {
    for (const layer of network.layers) {
      for (let i = 0; i < layer.biases.length; i++) {
        layer.biases[i] = lerp(layer.biases[i], Math.random() * 2 - 1, amount);
      }
      for (let i = 0; i < layer.weights.length; i++) {
        for (let j = 0; j < layer.weights[i].length; j++) {
          layer.weights[i][j] = lerp(layer.weights[i][j], Math.random() * 2 - 1, amount);
        }
      }
    }
  }

  clone() {
    return structuredClone(this);
  }
}