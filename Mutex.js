const Semaphore = require('./Semaphore');

class Mutex extends Semaphore {
  constructor() {
    super(1);
  }
}

module.exports = Mutex;
