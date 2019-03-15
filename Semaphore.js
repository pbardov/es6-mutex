/* eslint-disable no-await-in-loop */
const { EventEmitter } = require('events');

class Semaphore extends EventEmitter {
  constructor(max) {
    super();

    this.n = 0;
    this.max = max;
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
    while (this.n + 1 > this.max) {
      await this.onRelease();
    }
    this.n += 1;
    this.emit('acquire', this.n);
  }

  release() {
    this.n -= 1;
    this.emit('release', this.n);
  }

  async use(fn, ...args) {
    await this.acquire();
    try {
      const result = await fn(...args);
      this.release();
      return result;
    } catch (err) {
      this.release();
      throw err;
    }
  }
}

module.exports = Semaphore;
