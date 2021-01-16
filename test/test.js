/* global describe, it */
/* eslint-disable no-await-in-loop */
const process = require('process');

process.env.DEBUG = true;

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('assert');
const crypto = require('crypto');

chai.use(chaiAsPromised);

const { Mutex } = require('../index');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Semaphore and Mutex test', function semTest() {
  this.timeout(20000);

  const mutex = new Mutex();

  let val;
  async function test1(v) {
    await mutex.acquire();
    val = v;
    await delay(100);
    const res = val;
    mutex.release();
    return res;
  }

  function test2(v) {
    return mutex.use(async (vv) => {
      val = vv;
      await delay(100);
      return val;
    }, v);
  }

  it('Test1', async () => {
    const vals = [];
    for (let n = 0; n < 6; ++n) {
      vals.push(crypto.randomBytes(4).toString('hex'));
    }
    const w = [];
    vals.forEach((v) => {
      w.push(test1(v));
    });

    const res = await Promise.all(w);
    for (let n = 0; n < vals.length; ++n) {
      assert(res[n] === vals[n], `${n} ${res[n]} != ${vals[n]}`);
    }
  });

  it('Test2', async () => {
    const vals = [];
    for (let n = 0; n < 6; ++n) {
      vals.push(crypto.randomBytes(4).toString('hex'));
    }
    const w = [];
    vals.forEach((v) => {
      w.push(test2(v));
    });

    const res = await Promise.all(w);
    for (let n = 0; n < vals.length; ++n) {
      assert(res[n] === vals[n], `${n} ${res[n]} != ${vals[n]}`);
    }
  });
});
