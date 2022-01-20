/* eslint-disable no-await-in-loop */
const { EventEmitter } = require('events');

class Semaphore extends EventEmitter {
  static immediate() {
    let immediateID;
    const promise = new Promise((resolve) => {
      immediateID = setImmediate(resolve);
    });
    promise.immediateID = immediateID;
    return promise;
  }

  static createWaiting() {
    let resolve;
    let reject;
    const promise = new Promise((pResolve, pReject) => {
      resolve = pResolve;
      reject = pReject;
    });
    return { promise, resolve, reject };
  }

  #n = 0;

  #waits = [];

  #waitsComplete = [];

  constructor(max) {
    super();

    this.#n = 0;
    this.max = max;
  }

  get n() {
    return this.#n;
  }

  get isFree() {
    return this.#n < this.max;
  }

  get isComplete() {
    return this.#n <= 0;
  }

  async waitComplete() {
    const self = this.constructor;
    if (!this.isComplete) {
      const wait = self.createWaiting();
      this.#waitsComplete.push(wait);
      return wait.promise;
    }
    return Promise.resolve();
  }

  async done() {
    return this.waitComplete();
  }

  async waitRelease() {
    const self = this.constructor;
    if (!this.isFree) {
      const wait = self.createWaiting();
      this.#waits.push(wait);
      return wait.promise;
    }
    return Promise.resolve();
  }

  async onRelease() {
    return new Promise((resolve) => {
      this.once('release', resolve);
    });
  }

  async onAcquire() {
    return new Promise((resolve) => {
      this.once('acquire', resolve);
    });
  }

  async acquire() {
    do {
      await this.waitRelease();
    } while (!this.isFree);
    this.#n += 1;
    this.emit('acquire', this.#n);
  }

  release() {
    this.#n -= 1;
    if (this.#n < 0) this.#n = 0;
    while (this.isFree && this.#waits.length) {
      const wait = this.#waits.shift();
      wait.resolve();
    }
    while (this.isComplete && this.#waitsComplete.length) {
      const wait = this.#waitsComplete.shift();
      wait.resolve();
    }
    this.emit('release', this.#n);
  }

  async use(fn, ...args) {
    await this.acquire();
    try {
      const result = await fn(...args);
      return result;
    } finally {
      this.release();
    }
  }
}

module.exports = Semaphore;
