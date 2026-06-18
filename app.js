/* ═══════════════════════════════
   APP — Josh Walls Portfolio
   Sections:
     1. Config & data
     2. Theme
     3. Screen navigation
     4. Image gallery
     5. Hold-to-lift interaction
     6. Video gallery
═══════════════════════════════ */

import { playWhoosh, playLift, playHoldTick, playHoldReady, playStaticBurst, playSlide, wakeAudio } from './audio.js';

/* ── 1. CONFIG & DATA ── */
const REPO    = 'hutch7575/portfolio';
const BRANCH  = 'main';
const API     = `https://api.github.com/repos/${REPO}/contents`;
const RAW     = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const IMG_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
const VID_EXT = ['mp4', 'webm', 'mov', 'ogg'];
const xExt    = f => f.split('.').pop().toLowerCase();

let imgFiles = [], vidFiles = [], descs = {};

async function loadData() {
  const [a, b, c] = await Promise.all([
    fetch(`${API}/images`).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(`${API}/videos`).then(r => r.ok ? r.json() : []).catch(() => []),
    fetch(`${RAW}/descriptions.json?t=${Date.now()}`).then(r => r.ok ? r.json() : {}).catch(() => ({}))
  ]);
  imgFiles = a.filter(f => f.name && f.name !== '.gitkeep' && IMG_EXT.includes(xExt(f.name)));
  vidFiles = b.filter(f => f.name && f.name !== '.gitkeep' && VID_EXT.includes(xExt(f.name)));
  descs    = c || {};
  document.getElementById('cat-img-count').textContent = `${imgFiles.length} piece${imgFiles.length !== 1 ? 's' : ''}`;
  document.getElementById('cat-vid-count').textContent = `${vidFiles.length} piece${vidFiles.length !== 1 ? 's' : ''}`;

  // set preview images on category cards
  if (imgFiles.length) {
    const bg = document.getElementById('cat-bg-images');
    bg.style.backgroundImage = `url(${RAW}/images/${imgFiles[0].name})`;
    bg.classList.remove('no-preview');
  }
  if (vidFiles.length) {
    const bg = document.getElementById('cat-bg-videos');
    bg.style.backgroundImage = `url(${RAW}/videos/${vidFiles[0].name})`;
    bg.classList.remove('no-preview');
  }
}

/* ── 2. THEME ── */
let theme = 'dark';

document.getElementById('theme-toggle').addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-label').textContent = theme === 'dark' ? 'Light' : 'Dark';
  document.getElementById('theme-toggle').querySelector('.icon').textContent = theme === 'dark' ? '☽' : '☀';
});

// spotlight stays centered (no mouse follow)

/* ── 3. SCREEN NAVIGATION ── */
function showScreen(id) {
  // save to session so refresh restores position
  sessionStorage.setItem('jw_screen', id);
  const current = document.querySelector('.screen.on');
  const next = document.getElementById(id);
  if (!next) return;
  if (current && current !== next) {
    // fade current out, then fade next in
    current.classList.add('transitioning-out');
    setTimeout(() => {
      current.classList.remove('on', 'transitioning-out');
      next.classList.add('on');
    }, 280);
  } else {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  }
}

/* ── NAV HINT: show after 4s idle, hide on activity ── */
let _hintTimer = null;
let _hintId = null;

function startNavHint(id) {
  stopNavHint();
  _hintId = id;
  _hintTimer = setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
  }, 4000);
}

function stopNavHint() {
  if (_hintTimer) { clearTimeout(_hintTimer); _hintTimer = null; }
  if (_hintId) {
    const el = document.getElementById(_hintId);
    if (el) el.classList.remove('show');
  }
}

// reset idle timer on any user activity
['pointermove','pointerdown','keydown','wheel'].forEach(ev => {
  window.addEventListener(ev, () => {
    if (_hintId) {
      stopNavHint();
      startNavHint(_hintId);
    }
  }, { passive: true });
});

function showNavHint(id) {
  stopNavHint();
  startNavHint(id);
}

document.getElementById('zone-img').addEventListener('click', () => { wakeAudio(); playWhoosh(); setTimeout(openGallery, 80); });
document.getElementById('zone-vid').addEventListener('click', () => { wakeAudio(); playWhoosh(); setTimeout(openVideos, 80); });
document.getElementById('gal-back').addEventListener('click', () => { if (galLifted) dropFrame(galLifted); stopNavHint(); showScreen('sc-cat'); });
document.getElementById('tv-back').addEventListener('click', () => { document.querySelectorAll('.vid-el').forEach(v => v.pause()); stopNavHint(); showScreen('sc-cat'); });

document.addEventListener('keydown', e => {
  if (document.getElementById('sc-gallery').classList.contains('on')) {
    if (e.key === 'ArrowRight') galGoTo(galIdx + 1);
    if (e.key === 'ArrowLeft')  galGoTo(galIdx - 1);
    if (e.key === 'Escape')     document.getElementById('gal-back').click();
  }
  if (document.getElementById('sc-tv').classList.contains('on')) {
    if (e.key === 'ArrowRight') vidGoTo(vidIdx + 1);
    if (e.key === 'ArrowLeft')  vidGoTo(vidIdx - 1);
    if (e.key === 'Escape')     document.getElementById('tv-back').click();
  }
});

/* ── 4. IMAGE GALLERY ── */
let galIdx = 0, galLifted = null;

function openGallery() {
  buildWall();
  showScreen('sc-gallery');
  // small delay so display:block has taken effect before measuring
  setTimeout(() => { galGoTo(0, true); showNavHint('gal-hint'); }, 300);
}

function buildWall() {
  const wall = document.getElementById('gal-wall');
  wall.innerHTML = ''; galIdx = 0;

  imgFiles.forEach((file, i) => {
    const url   = `${RAW}/images/${file.name}`;
    const frame = document.createElement('div');
    frame.className = 'pic-frame ' + (i === 0 ? 'active' : 'dimmed');
    frame.dataset.idx = i;

    // hold progress ring
    const ring = document.createElement('div');
    ring.className = 'hold-ring';
    ring.appendChild(document.createElement('canvas'));
    frame.appendChild(ring);

    // mount
    const mount = document.createElement('div');
    mount.className = 'pic-mount';

    const img = document.createElement('img');
    img.className = 'pic-img';
    img.src = url; img.alt = file.name;
    img.loading = i === 0 ? 'eager' : 'lazy';
    img.draggable = false;
    mount.appendChild(img);

    // info panel
    const panel = document.createElement('div');
    panel.className = 'pic-info-panel';
    const desc = descs[file.name] || '';
    panel.innerHTML = desc
      ? `<p class="pic-info-desc">${desc}</p>`
      : `<p class="pic-info-empty">No description yet.</p>`;
    mount.appendChild(panel);

    // label strip
    const label = document.createElement('div');
    label.className = 'pic-mount-label';
    label.innerHTML = `
      <span class="pic-mount-title">${file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}</span>
      <span class="pic-mount-num">${String(i + 1).padStart(2, '0')}</span>`;
    mount.appendChild(label);

    frame.appendChild(mount);

    setupHold(frame, i);
    frame.addEventListener('click', e => {
      if (frame._holdFired) return;
      if (i !== galIdx) galGoTo(i);
    });

    wall.appendChild(frame);
  });
}

function galGoTo(idx, instant = false) {
  if (galLifted) dropFrame(galLifted);
  galIdx = ((idx % imgFiles.length) + imgFiles.length) % imgFiles.length;
  const wall   = document.getElementById('gal-wall');
  const frames = wall.querySelectorAll('.pic-frame');
  frames.forEach((f, i) => { f.classList.toggle('active', i === galIdx); f.classList.toggle('dimmed', i !== galIdx); });
  document.getElementById('gal-ctr').textContent  = String(galIdx + 1).padStart(2, '0') + ' / ' + String(imgFiles.length).padStart(2, '0');
  document.getElementById('gal-prog').style.width = ((galIdx + 1) / imgFiles.length * 100) + '%';
  if (!instant) playSlide();
  // use rAF to ensure layout is painted before measuring (fixes widescreen off-centre bug)
  const doPosition = () => {
    const frame = wall.children[galIdx];
    if (!frame) return;
    const targetX = Math.round(window.innerWidth / 2 - (frame.offsetLeft + frame.offsetWidth / 2));
    wall.style.transition = instant ? 'none' : 'transform .78s cubic-bezier(.16,1,.3,1)';
    wall.style.transform  = `translateX(${targetX}px)`;
    moveWallSpot(galIdx, instant);
  };
  doPosition();
}

function moveWallSpot(idx, instant = false) {
  const spot = document.getElementById('wall-spot');
  if (!spot) return;
  spot.style.transition = instant ? 'none' : 'left .78s cubic-bezier(.16,1,.3,1), top .6s cubic-bezier(.16,1,.3,1)';
  spot.style.left = (window.innerWidth / 2) + 'px';
  spot.style.top  = (window.innerHeight * 0.46) + 'px';
}

// recenter on window resize
window.addEventListener('resize', () => {
  if (document.getElementById('sc-gallery').classList.contains('on')) {
    galGoTo(galIdx, true);
  }
  if (document.getElementById('sc-tv').classList.contains('on')) {
    vidGoTo(vidIdx, true);
  }
});

document.getElementById('gal-prev').addEventListener('click', () => galGoTo(galIdx - 1));
document.getElementById('gal-next').addEventListener('click', () => galGoTo(galIdx + 1));

// swipe
let gDS = null, gDr = false;
document.getElementById('sc-gallery').addEventListener('pointerdown', e => { gDS = e.clientX; gDr = true; });
document.getElementById('sc-gallery').addEventListener('pointerup',   e => {
  if (!gDr) return; gDr = false;
  if (Math.abs(e.clientX - gDS) > 65) galGoTo(e.clientX < gDS ? galIdx + 1 : galIdx - 1);
  gDS = null;
});

/* ── 5. HOLD-TO-LIFT ── */
function setupHold(frame, idx) {
  let prog = 0, raf = null, startT = null;

  function startHold() {
    if (idx !== galIdx) { galGoTo(idx); return; }
    if (galLifted === frame) { dropFrame(frame); return; }
    frame._holdFired = false;
    frame.classList.add('holding');
    prog = 0; startT = Date.now();
    animRing();
  }

  function endHold() {
    if (!frame.classList.contains('holding')) return;
    frame.classList.remove('holding');
    cancelAnimationFrame(raf);
    if (prog < 1) prog = 0;
  }

  function animRing() {
    const ringCanvas = frame.querySelector('.hold-ring canvas');
    if (!ringCanvas) return;
    const mount = frame.querySelector('.pic-mount');
    const W = mount.offsetWidth + 20, H = mount.offsetHeight + 20;
    ringCanvas.width = W; ringCanvas.height = H;
    prog = Math.min(1, (Date.now() - startT) / 700);
    if (prog > .32 && prog < .35) playHoldTick();
    if (prog > .65 && prog < .68) playHoldTick();
    const ctx = ringCanvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const total = 2 * (W + H) - 8 * 8 + 2 * Math.PI * 8;
    const drawn = prog * total;
    ctx.strokeStyle = `rgba(247,37,133,${.4 + prog * .5})`;
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.setLineDash([drawn, total]);
    drawRoundedRectPath(ctx, 0, 0, W, H, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    if (prog >= 1) { playHoldReady(); frame.classList.remove('holding'); liftFrame(frame); return; }
    raf = requestAnimationFrame(animRing);
  }

  frame.addEventListener('pointerdown',  e => { wakeAudio(); startHold(); e.preventDefault(); });
  frame.addEventListener('pointerup',    endHold);
  frame.addEventListener('pointerleave', endHold);
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);   ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);   ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x, y + r);       ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

function liftFrame(frame) {
  if (galLifted && galLifted !== frame) dropFrame(galLifted);
  frame.classList.add('lifted', 'lifting');
  frame._holdFired = true;
  galLifted = frame;
  playLift();
  setTimeout(() => { frame._holdFired = false; }, 250);
}

function dropFrame(frame) {
  frame.classList.remove('lifted', 'lifting');
  galLifted = null;
}

/* ── 6. VIDEO GALLERY ── */
let vidIdx = 0, vidBusy = false, vidLifted = null;
let _vhRaf = null, _vhStart = null, _vhFrame = null, _vhProg = 0;
function _vhCancel() {
  if (_vhRaf) { cancelAnimationFrame(_vhRaf); _vhRaf = null; }
  if (_vhFrame) {
    _vhFrame.classList.remove('holding');
    const rc = _vhFrame.querySelector('.hold-ring canvas');
    if (rc) rc.getContext('2d').clearRect(0, 0, rc.width, rc.height);
  }
  _vhFrame = null; _vhStart = null; _vhProg = 0;
}

function openVideos() {
  buildVidWall();
  showScreen('sc-tv');
  setTimeout(() => { vidGoTo(0, true); showNavHint('vid-hint'); }, 300);
}

let vidMuted = true; // tracks audio state

function buildVidWall() {
  const wall = document.getElementById('vid-wall');
  wall.innerHTML = ''; vidIdx = 0;

  if (!vidFiles.length) {
    const empty = document.createElement('div');
    empty.className = 'vid-empty-msg show';
    empty.innerHTML = '<p>No videos yet.<br>Add files to <span>videos/</span></p>';
    wall.appendChild(empty);
    document.getElementById('vid-prev').style.visibility = 'hidden';
    document.getElementById('vid-next').style.visibility = 'hidden';
    document.getElementById('vid-controls').style.display = 'none';
    return;
  }
  document.getElementById('vid-prev').style.visibility = '';
  document.getElementById('vid-next').style.visibility = '';
  document.getElementById('vid-controls').style.display = 'flex';

  vidFiles.forEach((file, i) => {
    const url   = `${RAW}/videos/${file.name}`;
    const frame = document.createElement('div');
    frame.className = 'vid-frame ' + (i === 0 ? 'active' : 'dimmed');

    const mount = document.createElement('div');
    mount.className = 'vid-mount';

    const vid = document.createElement('video');
    vid.className = 'vid-el'; vid.src = url;
    vid.loop = true; vid.muted = true; vid.playsInline = true; vid.preload = 'metadata';
    mount.appendChild(vid);

    const scanlines = document.createElement('div');
    scanlines.className = 'vid-scanlines';
    mount.appendChild(scanlines);

    const sc = document.createElement('canvas');
    sc.className = 'vid-static-canvas';
    mount.appendChild(sc);

    const label = document.createElement('div');
    label.className = 'vid-mount-label';
    label.innerHTML = `
      <span class="vid-mount-ch">CH ${String(i + 1).padStart(2, '0')}</span>
      <span class="vid-mount-name">${file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}</span>`;
    mount.appendChild(label);

    // info panel (same as image gallery)
    const panel = document.createElement('div');
    panel.className = 'pic-info-panel';
    const desc = descs[file.name] || '';
    panel.innerHTML = desc
      ? `<p class="pic-info-desc">${desc}</p>`
      : `<p class="pic-info-empty">No description yet.</p>`;
    mount.appendChild(panel);
    frame.appendChild(mount);

    // hold ring sits outside mount, overlays the whole frame
    const ring = document.createElement('div');
    ring.className = 'hold-ring';
    ring.appendChild(document.createElement('canvas'));
    frame.dataset.idx = i;
    frame.appendChild(ring);
    wall.appendChild(frame);
  });

  // disable pointer events on children so hold reaches frame
  wall.querySelectorAll('video, .vid-scanlines, .vid-static-canvas, .vid-mount-label').forEach(el => {
    el.style.pointerEvents = 'none';
  });

  // ── VIDEO HOLD TO REVEAL ──
  function _vhAnimate() {
    if (!_vhFrame || !_vhStart) return;
    const mount = _vhFrame.querySelector('.vid-mount');
    const rc = _vhFrame.querySelector('.hold-ring canvas');
    if (!mount || !rc) return;
    const W = mount.offsetWidth + 20, H = mount.offsetHeight + 20;
    if (rc.width !== W || rc.height !== H) { rc.width = W; rc.height = H; }
    _vhProg = Math.min(1, (Date.now() - _vhStart) / 800);
    if (_vhProg > .32 && _vhProg < .36) playHoldTick();
    if (_vhProg > .65 && _vhProg < .69) playHoldTick();
    const ctx = rc.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    const total = 2 * (W + H) - 8 * 8 + 2 * Math.PI * 8;
    ctx.strokeStyle = `rgba(247,37,133,${0.4 + _vhProg * 0.5})`;
    ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.setLineDash([_vhProg * total, total]);
    drawRoundedRectPath(ctx, 0, 0, W, H, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    if (_vhProg >= 1) {
      playHoldReady();
      _vhFrame.classList.remove('holding');
      if (_vhFrame.classList.contains('lifted')) {
        _vhFrame.classList.remove('lifted', 'lifting'); vidLifted = null;
      } else {
        if (vidLifted) vidLifted.classList.remove('lifted', 'lifting');
        _vhFrame.classList.add('lifted', 'lifting'); vidLifted = _vhFrame; playLift();
      }
      _vhCancel(); return;
    }
    _vhRaf = requestAnimationFrame(_vhAnimate);
  }
  wall.addEventListener('pointerdown', e => {
    const frame = e.target.closest('.vid-frame');
    if (!frame || parseInt(frame.dataset.idx) !== vidIdx) return;
    wakeAudio(); _vhCancel();
    _vhFrame = frame; _vhStart = Date.now();
    frame.classList.add('holding');
    _vhRaf = requestAnimationFrame(_vhAnimate);
    e.preventDefault();
  }, { passive: false });
  wall.addEventListener('pointerup',    () => _vhCancel());
  wall.addEventListener('pointercancel',() => _vhCancel());
  wall.addEventListener('touchend',     () => _vhCancel());

  // audio toggle
  document.getElementById('vid-audio-btn').onclick = () => {
    vidMuted = !vidMuted;
    const vid = document.querySelector('.vid-frame.active video');
    if (vid) vid.muted = vidMuted;
    document.getElementById('vid-audio-btn').textContent = vidMuted ? '🔇' : '🔊';
  };

  // fullscreen toggle
  document.getElementById('vid-fs-btn').onclick = () => {
    const frame = document.querySelector('.vid-frame.active');
    const vid = frame ? frame.querySelector('video') : null;
    if (!vid) return;
    if (!document.fullscreenElement) {
      vid.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  // positioning handled by openVideos

}

function dropVidFrame(frame) {
  frame.classList.remove('lifted', 'lifting');
  vidLifted = null;
}

function vidGoTo(idx, instant = false) {
  if (vidBusy && !instant) return;
  if (vidLifted) dropVidFrame(vidLifted);
  vidIdx = ((idx % vidFiles.length) + vidFiles.length) % vidFiles.length;
  const wall   = document.getElementById('vid-wall');
  const frames = wall.querySelectorAll('.vid-frame');

  // pause all
  frames.forEach(f => { const v = f.querySelector('video'); if (v) { v.pause(); v.currentTime = 0; } });

  // no static effect — clean transition

  // update classes
  frames.forEach((f, i) => {
    f.classList.toggle('active', i === vidIdx);
    f.classList.toggle('dimmed', i !== vidIdx);
  });

  const frame = wall.children[vidIdx];
  if (!frame) return;

  const doPosition = () => {
    const targetX = -(frame.offsetLeft - (window.innerWidth - frame.offsetWidth) / 2);
    wall.style.transition = instant ? 'none' : 'transform .6s cubic-bezier(.16,1,.3,1)';
    wall.style.transform  = `translateX(${targetX}px)`;
    const spot = document.getElementById('vid-spot');
    spot.style.transition = instant ? 'none' : 'left .6s cubic-bezier(.16,1,.3,1)';
    spot.style.left = (frame.offsetLeft + frame.offsetWidth / 2 + targetX) + 'px';
  };

  if (instant) { requestAnimationFrame(() => requestAnimationFrame(doPosition)); }
  else { doPosition(); }

  document.getElementById('tv-ctr').textContent   = String(vidIdx + 1).padStart(2, '0') + ' / ' + String(vidFiles.length).padStart(2, '0');
  document.getElementById('vid-prog').style.width  = ((vidIdx + 1) / vidFiles.length * 100) + '%';

  // play new video after slide
  const delay = instant ? 0 : 300;
  setTimeout(() => {
    const newVid = frame.querySelector('video');
    if (newVid) {
      newVid.muted = vidMuted;
      newVid.play().catch(() => {});
    }
    vidBusy = false;
  }, delay);
}

// drop lifted frame on channel change
const _origVidGoTo = vidGoTo;

document.getElementById('vid-prev').addEventListener('click', () => { if(!vidBusy) { _vhCancel(); vidGoTo(vidIdx - 1); } });
document.getElementById('vid-next').addEventListener('click', () => { if(!vidBusy) { _vhCancel(); vidGoTo(vidIdx + 1); } });

// channel switching via nav buttons and swipe only

// swipe
let vDS = null, vDr = false;
document.getElementById('sc-tv').addEventListener('pointerdown', e => { vDS = e.clientX; vDr = true; });
document.getElementById('sc-tv').addEventListener('pointerup',   e => {
  if (!vDr) return; vDr = false;
  if (Math.abs(e.clientX - vDS) > 65) {
    vidGoTo(e.clientX < vDS ? vidIdx + 1 : vidIdx - 1);
  }
  vDS = null;
});

/* ── PREVENT LONG-PRESS SAVE IMAGE ON MOBILE ── */
document.addEventListener('contextmenu', e => {
  if (e.target.closest('#gal-wall, #vid-wall, .pic-frame, .vid-frame')) e.preventDefault();
});

/* ── INIT ── */
loadData().then(() => {
  // restore last screen after refresh
  const saved = sessionStorage.getItem('jw_screen');
  if (saved && saved !== 'sc-cat') {
    if (saved === 'sc-gallery') openGallery();
    else if (saved === 'sc-tv') openVideos();
  }
});
