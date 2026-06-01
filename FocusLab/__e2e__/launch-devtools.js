'use strict';
/**
 * DevTools 2.x automation launcher for Windows
 * Dynamically discovers the DevTools HTTP port via CLI islogin output.
 * Flow: CLI islogin → parse port → HTTP /v2/open → HTTP /v2/auto → WS connect → automator.connect
 */
const http = require('http');
const { execSync } = require('child_process');
const WebSocket = require('ws');
const automator = require('miniprogram-automator');
const path = require('path');

const CLI          = 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat';
const PROJECT_PATH = path.resolve(__dirname, '..');
const AUTO_PORT    = Number(process.env.WX_AUTO_PORT) || 9090;

/** Run CLI command and return combined output */
function runCli(args) {
  try {
    return execSync(`cmd /c "${CLI}" ${args} 2>&1`, { encoding: 'utf8', timeout: 15000 });
  } catch (e) {
    return e.stdout || e.message;
  }
}

/** Discover DevTools HTTP port from CLI islogin output */
function discoverPort() {
  const out = runCli('islogin');
  const m = out.match(/listening on http:\/\/127\.0\.0\.1:(\d+)/);
  if (m) return Number(m[1]);
  throw new Error(`Cannot detect DevTools port. CLI output:\n${out}`);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function waitForWs(port, timeout = 20000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    function attempt() {
      const ws = new WebSocket(`ws://127.0.0.1:${port}`);
      ws.once('open', () => { ws.close(); resolve(); });
      ws.once('error', () => {
        if (Date.now() < deadline) setTimeout(attempt, 500);
        else reject(new Error(`WS port ${port} not ready after ${timeout}ms`));
      });
    }
    attempt();
  });
}

async function launchMiniProgram() {
  // Step 1: Discover DevTools HTTP port
  console.log('[launch] Discovering DevTools port...');
  const httpPort = discoverPort();
  const BASE = `http://127.0.0.1:${httpPort}`;
  console.log(`[launch] DevTools HTTP at ${BASE}`);

  const enc = encodeURIComponent(PROJECT_PATH);

  // Step 2: Open project
  console.log('[launch] Opening project...');
  const openRes = await httpGet(`${BASE}/v2/open?projectpath=${enc}`);
  console.log(`[launch] Open: ${openRes.status}`);

  // Small delay for project to initialize
  await new Promise(r => setTimeout(r, 3000));

  // Step 3: Enable automation WebSocket
  // If port already open (from previous run), skip — reuse existing session
  console.log(`[launch] Enabling automation on port ${AUTO_PORT}...`);
  let autoOk = false;
  try {
    const ws = require('ws');
    await new Promise((res, rej) => {
      const t = new ws(`ws://127.0.0.1:${AUTO_PORT}`);
      t.once('open', () => { t.close(); res(); });
      t.once('error', rej);
      setTimeout(rej, 1000);
    });
    console.log(`[launch] Port ${AUTO_PORT} already open, reusing session`);
    autoOk = true;
  } catch (_) {
    // Port not open yet, call /v2/auto
  }

  if (!autoOk) {
    const autoRes = await httpGet(`${BASE}/v2/auto?project=${enc}&port=${AUTO_PORT}`);
    console.log(`[launch] Auto: ${autoRes.status} ${autoRes.body.substring(0,100)}`);
    if (autoRes.status !== 200) {
      throw new Error(`/v2/auto failed ${autoRes.status}: ${autoRes.body}`);
    }
  }

  // Step 4: Wait for automation WS
  console.log('[launch] Waiting for automation WebSocket...');
  await waitForWs(AUTO_PORT, 15000);

  // Step 5: Connect via automator
  console.log('[launch] Connecting automator...');
  const miniProgram = await automator.connect({
    wsEndpoint: `ws://127.0.0.1:${AUTO_PORT}`
  });
  console.log('[launch] Connected!');
  return miniProgram;
}

module.exports = { launchMiniProgram, AUTO_PORT };
