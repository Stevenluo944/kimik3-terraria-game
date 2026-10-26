// 无头冒烟测试:桩掉 DOM/Canvas 后跑 600 秒游戏逻辑
'use strict';

const ctxStub = new Proxy({}, {
  get(t, p) {
    if (p === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (p in t) return t[p];
    return () => {};
  },
  set(t, p, v) { t[p] = v; return true; },
});

function makeEl() {
  return {
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, textContent: '', innerHTML: '',
    style: {}, width: 0, height: 0, title: '',
    appendChild() {},
    getContext: () => ctxStub,
  };
}

const startBtn = { cb: null, addEventListener(ev, cb) { this.cb = cb; } };
const respawnBtn = { cb: null, addEventListener(ev, cb) { this.cb = cb; } };

const canvasEl = makeEl();
canvasEl.getContext = () => ctxStub;
canvasEl.width = 1280; canvasEl.height = 720;

global.document = {
  getElementById(id) {
    if (id === 'game') return canvasEl;
    if (id === 'startBtn') return startBtn;
    if (id === 'respawnBtn') return respawnBtn;
    return makeEl();
  },
  createElement() { return makeEl(); },
};
global.window = {};
global.localStorage = {
  _d: {},
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._d, k) ? this._d[k] : null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
};
global.innerWidth = 1280;
global.innerHeight = 720;
global.addEventListener = () => {};
let rafCb = null;
global.requestAnimationFrame = cb => { rafCb = cb; };

require('./game.js');

if (!startBtn.cb) { console.error('FAIL: startBtn 未绑定'); process.exit(1); }
startBtn.cb(); // 开始游戏

// 模拟 600 秒(覆盖昼夜循环 + 僵尸生成)
let ts = 0;
for (let i = 0; i < 600 * 60; i++) {
  ts += 1000 / 60;
  const cb = rafCb; rafCb = null;
  cb(ts);
  if (!rafCb) { console.error('FAIL: rAF 链断开 @' + i); process.exit(1); }
}
console.log('SMOKE OK: 600s 模拟无异常');if (!global.localStorage.getItem('pixel_save_v1')) { console.error('FAIL: 自动存档未写入 localStorage'); process.exit(1); }
console.log('SAVE OK: 自动存档已写入 localStorage');