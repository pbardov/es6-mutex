/* global describe, it */
/* eslint-disable no-await-in-loop, no-loop-func */
const process = require('process');

process.env.DEBUG = true;

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const assert = require('assert');
const crypto = require('crypto');

chai.use(chaiAsPromised);

const { Mutex, Semaphore } = require('../index');

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
    for (let n = 0; n < res.length; ++n) {
      assert(vals.includes(res[n]), `${n} ${res[n]} not in vals`);
    }
    for (let n = 0; n < vals.length; ++n) {
      assert(res.includes(vals[n]), `${n} ${vals[n]} not in res`);
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
    for (let n = 0; n < res.length; ++n) {
      assert(vals.includes(res[n]), `${n} ${res[n]} not in vals`);
    }
    for (let n = 0; n < vals.length; ++n) {
      assert(res.includes(vals[n]), `${n} ${vals[n]} not in res`);
    }
  });

  it('Prallel test', async () => {
    let count = 0;
    const sem = new Semaphore(20);
    for (let n = 0; n < 1000; n += 1) {
      const { promise } = await sem.parallel(
        n % 2 > 0 ? 10 : 1000,
        async (v) => {
          const ms = 100 + Math.ceil(Math.random() * 100);
          await delay(ms);
          return v;
        },
        n
      );
      promise
        .then((v) => {
          count += v;
        })
        .catch(() => {});
    }
    await sem.done();

    const valid = (500 * 998) / 2;
    assert(count === valid, `bad count = ${count} != ${valid}`);
  });
});
