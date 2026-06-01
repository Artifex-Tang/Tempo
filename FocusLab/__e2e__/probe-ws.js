/**
 * 探测 DevTools WebSocket 连接
 */
const WebSocket = require('ws');

const ports = [9090, 36527, 9420];
const paths = ['', '/', '/socket', '/ws', '/devtools'];

async function probe(port, path) {
  return new Promise((resolve) => {
    const url = `ws://127.0.0.1:${port}${path}`;
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.terminate();
      resolve({ url, ok: false, reason: 'timeout' });
    }, 2000);
    ws.on('open', () => {
      clearTimeout(timer);
      ws.close();
      resolve({ url, ok: true });
    });
    ws.on('error', (e) => {
      clearTimeout(timer);
      resolve({ url, ok: false, reason: e.message });
    });
  });
}

(async () => {
  for (const port of ports) {
    for (const path of paths) {
      const r = await probe(port, path);
      console.log(r.ok ? `✓ OPEN: ${r.url}` : `✗ ${r.url} → ${r.reason}`);
    }
  }
})();
