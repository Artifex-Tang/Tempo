'use strict';
/**
 * Generate 81x81 tab bar PNG icons (gray inactive + blue active)
 * Pure Node.js, no native deps — writes raw PNG via zlib
 */
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

const OUT  = path.resolve(__dirname, '../images');
const SIZE = 81;
const GRAY = [0x99, 0x99, 0x99];
const BLUE = [0x1A, 0x73, 0xE8];
const BG   = [0xFF, 0xFF, 0xFF, 0x00]; // transparent

// ── PNG helpers ──────────────────────────────────────────────────────────────
function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })());
  let c = 0xFFFFFFFF;
  for (const b of buf) c = table[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function makePng(pixels /* Uint8Array SIZE*SIZE*4 RGBA */) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8]=8; ihdr[9]=6; // 8-bit RGBA
  const IHDR = chunk('IHDR', ihdr);

  // IDAT — one filter byte (0=None) per row
  const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0; // filter None
    for (let x = 0; x < SIZE; x++) {
      const dst = y * (SIZE * 4 + 1) + 1 + x * 4;
      const src = (y * SIZE + x) * 4;
      raw[dst]   = pixels[src];
      raw[dst+1] = pixels[src+1];
      raw[dst+2] = pixels[src+2];
      raw[dst+3] = pixels[src+3];
    }
  }
  const IDAT = chunk('IDAT', zlib.deflateSync(raw));
  const IEND = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, IHDR, IDAT, IEND]);
}

// ── Canvas abstraction ───────────────────────────────────────────────────────
class Canvas {
  constructor(size) {
    this.size = size;
    this.data = new Uint8Array(size * size * 4); // RGBA all transparent
  }
  setPixel(x, y, r, g, b, a=255) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return;
    const i = (y * this.size + x) * 4;
    this.data[i]=r; this.data[i+1]=g; this.data[i+2]=b; this.data[i+3]=a;
  }
  // Wu antialiased line
  line(x0, y0, x1, y1, r, g, b, w=3) {
    const hw = (w-1)/2;
    for (let t = -hw; t <= hw; t++) {
      this._line(x0, y0+t, x1, y1+t, r, g, b);
      this._line(x0+t, y0, x1+t, y1, r, g, b);
    }
  }
  _line(x0, y0, x1, y1, r, g, b) {
    let steep = Math.abs(y1-y0) > Math.abs(x1-x0);
    if (steep) { [x0,y0]=[y0,x0]; [x1,y1]=[y1,x1]; }
    if (x0 > x1) { [x0,x1]=[x1,x0]; [y0,y1]=[y1,y0]; }
    const dx=x1-x0, dy=Math.abs(y1-y0), gradient=dx?dy/dx:1;
    let y=y0;
    for (let x=x0; x<=x1; x++) {
      const frac=y-Math.floor(y);
      if (steep) {
        this.setPixel(Math.floor(y),  x, r,g,b, Math.round(255*(1-frac)));
        this.setPixel(Math.floor(y)+1,x, r,g,b, Math.round(255*frac));
      } else {
        this.setPixel(x, Math.floor(y),  r,g,b, Math.round(255*(1-frac)));
        this.setPixel(x, Math.floor(y)+1,r,g,b, Math.round(255*frac));
      }
      y += gradient;
    }
  }
  circle(cx, cy, radius, r, g, b, fill=false) {
    if (fill) {
      for (let y=cy-radius; y<=cy+radius; y++)
        for (let x=cx-radius; x<=cx+radius; x++)
          if ((x-cx)**2+(y-cy)**2<=radius**2) this.setPixel(x,y,r,g,b);
    } else {
      // Midpoint circle + thick
      for (let theta=0; theta<Math.PI*2; theta+=0.01) {
        for (let dr=-1.5; dr<=1.5; dr+=0.5) {
          const px=cx+(radius+dr)*Math.cos(theta);
          const py=cy+(radius+dr)*Math.sin(theta);
          this.setPixel(px, py, r, g, b);
        }
      }
    }
  }
  rect(x,y,w,h,r,g,b,fill=false,lw=3) {
    if (fill) {
      for (let cy=y; cy<y+h; cy++)
        for (let cx=x; cx<x+w; cx++)
          this.setPixel(cx,cy,r,g,b);
    } else {
      this.line(x,y,x+w,y,r,g,b,lw);
      this.line(x+w,y,x+w,y+h,r,g,b,lw);
      this.line(x+w,y+h,x,y+h,r,g,b,lw);
      this.line(x,y+h,x,y,r,g,b,lw);
    }
  }
  save(file) {
    fs.writeFileSync(file, makePng(this.data));
    console.log('  wrote', path.basename(file));
  }
}

// ── Icon drawers ─────────────────────────────────────────────────────────────
function drawHome(c, col) {
  const [r,g,b]=col, s=SIZE;
  const cx=s/2, top=10, roofH=22, bodyY=32, bodyH=29, doorW=13, doorH=18;
  // roof
  c.line(cx,top, cx-26,bodyY, r,g,b,3);
  c.line(cx,top, cx+26,bodyY, r,g,b,3);
  c.line(cx-26,bodyY, cx+26,bodyY, r,g,b,3);
  // walls
  c.rect(cx-20,bodyY,40,bodyH,r,g,b,false,3);
  // door
  const dx=cx-doorW/2, dy=bodyY+bodyH-doorH;
  c.rect(dx,dy,doorW,doorH,r,g,b,false,2);
}

function drawFocus(c, col) {
  const [r,g,b]=col, cx=SIZE/2, cy=SIZE/2, R=28;
  // clock face
  c.circle(cx,cy,R,r,g,b,false);
  // hour hand (12 o'clock direction → slight tilt = 10:10 style)
  c.line(cx,cy, cx-10,cy-18, r,g,b,3);
  // minute hand
  c.line(cx,cy, cx+14,cy-12, r,g,b,3);
  // center dot
  c.circle(cx,cy,3,r,g,b,true);
  // top tick
  c.line(cx,cy-R+2,cx,cy-R+8,r,g,b,3);
}

function drawGoal(c, col) {
  const [r,g,b]=col, cx=SIZE/2, cy=SIZE/2;
  // three concentric circles
  c.circle(cx,cy,28,r,g,b,false);
  c.circle(cx,cy,18,r,g,b,false);
  c.circle(cx,cy, 7,r,g,b,true);
  // arrow from right
  c.line(cx+10,cy,cx+36,cy,r,g,b,3);
  c.line(cx+29,cy-6,cx+36,cy,r,g,b,3);
  c.line(cx+29,cy+6,cx+36,cy,r,g,b,3);
}

function drawSummary(c, col) {
  const [r,g,b]=col, s=SIZE;
  const baseY=s-14, barW=13, gap=5;
  const bars=[{h:22},{h:36},{h:46},{h:28}];
  const totalW=bars.length*(barW+gap)-gap;
  let x=(s-totalW)/2;
  for (const bar of bars) {
    const y=baseY-bar.h;
    c.rect(x,y,barW,bar.h,r,g,b,true);
    x+=barW+gap;
  }
  // baseline
  c.line((s-totalW)/2-3, baseY, (s+totalW)/2+3, baseY, r,g,b,2);
}

// ── Generate all icons ────────────────────────────────────────────────────────
const icons = [
  { name:'tab-home',    draw:drawHome    },
  { name:'tab-focus',   draw:drawFocus   },
  { name:'tab-goal',    draw:drawGoal    },
  { name:'tab-summary', draw:drawSummary },
];

for (const icon of icons) {
  for (const [suffix, col] of [['', GRAY],  ['-active', BLUE]]) {
    const c = new Canvas(SIZE);
    icon.draw(c, col);
    c.save(path.join(OUT, `${icon.name}${suffix}.png`));
  }
}
console.log('Done — 8 icons generated in FocusLab/images/');
