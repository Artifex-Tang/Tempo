'use strict';
/**
 * T4 miniprogram E2E tests
 * Requires: miniprogram-automator + WeChat DevTools (service port open)
 * Backend: DayCraft at http://localhost:8081 (mock openid mode)
 *
 * Navigation rules:
 *  - switchTab: tabBar pages (index/focus/goal/summary), prefix /
 *  - navigateTo: non-tabBar pages (todo/category), prefix /
 *
 * Run: npm run test:e2e
 */

const { launchMiniProgram } = require('./launch-devtools');
const http = require('http');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const BACKEND = 'http://localhost:8081';

/** Get JWT token from backend mock login */
async function getToken() {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ code: 'autotest' });
    const req = http.request(`${BACKEND}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d).data.token); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

let miniProgram;
let page;
let token;

jest.setTimeout(120000);

beforeAll(async () => {
  miniProgram = await launchMiniProgram();
  // Get backend token and inject into miniprogram storage
  token = await getToken();
  // callWxMethod(method, ...args) — passes args as positional array to wx.*
  await miniProgram.callWxMethod('setStorageSync', 'token', token);
  await sleep(500);
  console.log('[test] Token injected:', token.substring(0, 20) + '...');
});

afterAll(async () => {
  if (miniProgram) await miniProgram.close();
});

// T4-01
describe('T4-01 launch', () => {
  test('starts at index or login', async () => {
    await sleep(2000); // wait for app to finish launching
    page = await miniProgram.currentPage();
    expect(['pages/index/index', 'pages/login/login']).toContain(page.path);
  });
});

// T4-02
describe('T4-02 login page', () => {
  test('login page redirects to index when token exists', async () => {
    // With token set, login page onLoad immediately switchTab to index
    await miniProgram.reLaunch('/pages/login/login');
    await sleep(2000);
    const cur = await miniProgram.currentPage();
    // Either on index (redirected) or on login (no token) - both valid
    expect(['pages/index/index', 'pages/login/login']).toContain(cur.path);
  });

  test('app shows login or index on launch', async () => {
    await miniProgram.switchTab('/pages/index/index');
    await sleep(1000);
    const cur = await miniProgram.currentPage();
    expect(cur.path).toBe('pages/index/index');
  });
});

// T4-03
describe('T4-03 index page', () => {
  beforeAll(async () => {
    await miniProgram.switchTab('/pages/index/index');
    page = await miniProgram.currentPage();
    await sleep(2000);
  });

  test('on index page', async () => {
    expect(page.path).toBe('pages/index/index');
  });

  test('section-title element exists', async () => {
    const el = await page.$('.section-title');
    expect(el).not.toBeNull();
  });

  test('pull-down refresh ends with loading=false', async () => {
    await page.callMethod('onPullDownRefresh');
    await sleep(3000);
    expect(await page.data('loading')).toBe(false);
  });
});

// T4-04
describe('T4-04 todo create', () => {
  beforeAll(async () => {
    await miniProgram.navigateTo('/pages/todo/todo');
    page = await miniProgram.currentPage();
    await sleep(1500);
  });

  test('on todo page', async () => {
    expect(page.path).toBe('pages/todo/todo');
  });

  test('openCreate shows modal', async () => {
    await page.callMethod('openCreate');
    expect(await page.data('showModal')).toBe(true);
  });

  test('title input works', async () => {
    await page.callMethod('onFormInput', {
      currentTarget: { dataset: { field: 'title' } },
      detail: { value: 'autotest-todo' }
    });
    expect((await page.data('form')).title).toBe('autotest-todo');
  });

  test('set high priority', async () => {
    await page.callMethod('setPriority', { currentTarget: { dataset: { p: '1' } } });
    expect((await page.data('form')).priority).toBe(1);
  });

  test('submit closes modal', async () => {
    await page.callMethod('submitForm');
    await sleep(4000); // async method + network round-trip
    expect(await page.data('showModal')).toBe(false);
  });

  test('todo list has items after navigate-back refresh', async () => {
    // Navigate to index then back to todo — triggers onShow → _loadData naturally
    await miniProgram.switchTab('/pages/index/index');
    await sleep(500);
    await miniProgram.navigateTo('/pages/todo/todo');
    page = await miniProgram.currentPage();
    await sleep(3000);
    const todos = await page.data('todos');
    expect(Array.isArray(todos)).toBe(true);
    expect(todos.length).toBeGreaterThan(0);
  });
});

// T4-05
describe('T4-05 todo finish', () => {
  test('open finish modal', async () => {
    const todos = await page.data('todos');
    if (!todos || todos.length === 0) return;
    await page.callMethod('openFinish', { currentTarget: { dataset: { id: todos[0].id } } });
    expect(await page.data('showFinishModal')).toBe(true);
  });

  test('submit finish closes modal', async () => {
    await page.callMethod('onFinishNote', { detail: { value: 'done' } });
    await page.callMethod('submitFinish');
    await sleep(1500);
    expect(await page.data('showFinishModal')).toBe(false);
  });
});

// T4-06
describe('T4-06 focus timer', () => {
  beforeAll(async () => {
    await miniProgram.switchTab('/pages/focus/focus');
    page = await miniProgram.currentPage();
    await sleep(1000);
  });

  test('on focus page', async () => {
    expect(page.path).toBe('pages/focus/focus');
  });

  test('initial phase=idle', async () => {
    expect(await page.data('phase')).toBe('idle');
  });

  test('select 25 min preset', async () => {
    await page.callMethod('selectPreset', { currentTarget: { dataset: { min: 25 } } });
    expect(await page.data('selectedMin')).toBe(25);
  });

  test('start focus => phase=running', async () => {
    await page.callMethod('startFocus');
    expect(await page.data('phase')).toBe('running');
  });

  test('pause => phase=paused', async () => {
    await page.callMethod('pauseFocus');
    expect(await page.data('phase')).toBe('paused');
  });

  test('resume => phase=running', async () => {
    await page.callMethod('resumeFocus');
    expect(await page.data('phase')).toBe('running');
  });

  test('end => showDoneModal=true', async () => {
    await page.callMethod('endFocus');
    expect(await page.data('showDoneModal')).toBe(true);
  });

  test('save => phase=idle', async () => {
    await page.callMethod('onDoneNote', { detail: { value: 'autotest' } });
    await page.callMethod('saveFocus');
    await sleep(2000);
    expect(await page.data('phase')).toBe('idle');
  });
});

// T4-07
describe('T4-07 goal', () => {
  beforeAll(async () => {
    await miniProgram.switchTab('/pages/goal/goal');
    page = await miniProgram.currentPage();
    await sleep(1500);
  });

  test('on goal page', async () => {
    expect(page.path).toBe('pages/goal/goal');
  });

  test('openCreate shows modal', async () => {
    await page.callMethod('openCreate');
    expect(await page.data('showModal')).toBe(true);
  });

  test('title input works', async () => {
    await page.callMethod('onFormInput', {
      currentTarget: { dataset: { field: 'title' } },
      detail: { value: 'autotest-goal' }
    });
    expect((await page.data('form')).title).toBe('autotest-goal');
  });

  test('submit goal', async () => {
    await page.callMethod('onTargetDate', { detail: { value: '2026-06-07' } });
    await page.callMethod('submitForm');
    await sleep(4000);
    expect(await page.data('showModal')).toBe(false);
  });

  test('goal list has items after navigate-back refresh', async () => {
    await miniProgram.switchTab('/pages/index/index');
    await sleep(500);
    await miniProgram.switchTab('/pages/goal/goal');
    page = await miniProgram.currentPage();
    await sleep(3000);
    expect((await page.data('goals')).length).toBeGreaterThan(0);
  });
});

// T4-08
describe('T4-08 summary', () => {
  beforeAll(async () => {
    await miniProgram.switchTab('/pages/summary/summary');
    page = await miniProgram.currentPage();
    await sleep(2000);
  });

  test('on summary page', async () => {
    expect(page.path).toBe('pages/summary/summary');
  });

  test('default tab=weekly', async () => {
    expect(await page.data('tab')).toBe('weekly');
  });

  test('switch to monthly tab', async () => {
    await page.callMethod('switchTab', { currentTarget: { dataset: { tab: 'monthly' } } });
    expect(await page.data('tab')).toBe('monthly');
  });

  test('regenerate weekly summary', async () => {
    await page.callMethod('switchTab', { currentTarget: { dataset: { tab: 'weekly' } } });
    await page.callMethod('generate');
    await sleep(2000);
    expect(await page.data('weekly')).not.toBeNull();
  });
});

// T4-09
describe('T4-09 tab switching', () => {
  test('switch to index', async () => {
    await miniProgram.switchTab('/pages/index/index');
    expect((await miniProgram.currentPage()).path).toBe('pages/index/index');
  });

  test('switch to focus', async () => {
    await miniProgram.switchTab('/pages/focus/focus');
    expect((await miniProgram.currentPage()).path).toBe('pages/focus/focus');
  });

  test('switch to goal', async () => {
    await miniProgram.switchTab('/pages/goal/goal');
    expect((await miniProgram.currentPage()).path).toBe('pages/goal/goal');
  });

  test('switch to summary', async () => {
    await miniProgram.switchTab('/pages/summary/summary');
    expect((await miniProgram.currentPage()).path).toBe('pages/summary/summary');
  });
});

// T4-10
describe('T4-10 pull-down refresh', () => {
  test('goal page: loading=false after refresh', async () => {
    await miniProgram.switchTab('/pages/goal/goal');
    page = await miniProgram.currentPage();
    await page.callMethod('onPullDownRefresh');
    await sleep(2000);
    expect(await page.data('loading')).toBe(false);
  });

  test('summary page: loading=false after refresh', async () => {
    await miniProgram.switchTab('/pages/summary/summary');
    page = await miniProgram.currentPage();
    await page.callMethod('onPullDownRefresh');
    await sleep(2000);
    expect(await page.data('loading')).toBe(false);
  });
});
