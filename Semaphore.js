/* eslint-disable no-await-in-loop */
const { EventEmitter } = require('events');

class Semaphore extends EventEmitter {
  static immediate() {
    const promise = new Promise((resolve) => {
      promise.immediateID = setImmediate(resolve);
    });
    return promise;
  }

  constructor(max) {
    super();

    this.n = 0;
    this.max = max;
  }

  async waitComplete() {
    const self = this.constructor;
    while (this.n > 0) {
      await self.immediate();
    }
  }

  async done() {
    return this.waitComplete();
  }

  async waitRelease() {
    const self = this.constructor;
    while (this.n >= this.max) {
      await self.immediate();
    }
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
    await this.waitRelease();
    this.n += 1;
    this.emit('acquire', this.n);
  }

  release() {
    this.n -= 1;
    if (this.n < 0) this.n = 0;
    this.emit('release', this.n);
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
