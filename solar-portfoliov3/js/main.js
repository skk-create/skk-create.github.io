/* ============================================================
   main.js — shared, site-wide behavior:
     1) nebula + starfield background
     2) custom rocket cursor (desktop only) with speed-linked flame
     3) floating astronaut with slow drift + planet bumps
     4) satellite + debris ambient drifters
     5) occasional shooting stars + a rare alien ship flyby
     6) the sun's click-and-hold "supernova" easter egg
     7) generative star-portrait (index.html only, if present)
     8) shared footer
   ============================================================ */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* ---------- hide astronaut/drifters/passers-by over the portrait section ---------- */
  const portraitSectionEl = document.getElementById('portrait-section');
  if (portraitSectionEl) {
    const ambientObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        document.body.classList.toggle('hide-ambient', entry.isIntersecting);
      });
    }, { threshold: 0.1 });
    ambientObserver.observe(portraitSectionEl);
  }

  /* ---------- background depth ---------- */
  const nebulaEl = document.createElement('div');
  nebulaEl.id = 'nebula';
  document.body.appendChild(nebulaEl);
  const nebulaColors = ['rgba(90,60,150,0.16)', 'rgba(40,110,130,0.14)', 'rgba(120,50,110,0.12)', 'rgba(40,70,140,0.15)'];
  const nebulaSpots = [
    { x: '10%', y: '15%', size: 480 },
    { x: '80%', y: '10%', size: 380 },
    { x: '65%', y: '75%', size: 520 },
    { x: '20%', y: '80%', size: 420 },
  ];
  nebulaSpots.forEach((spot, i) => {
    const b = document.createElement('div');
    b.className = 'nebula-blob';
    b.style.left = spot.x; b.style.top = spot.y;
    b.style.width = b.style.height = spot.size + 'px';
    b.style.background = nebulaColors[i % nebulaColors.length];
    nebulaEl.appendChild(b);
  });

  const starsEl = document.createElement('div');
  starsEl.id = 'stars';
  document.body.appendChild(starsEl);
  for (let i = 0; i < 90; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 1.8 + 0.4;
    s.style.width = s.style.height = `${size}px`;
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    s.style.opacity = Math.random() * 0.7 + 0.2;
    starsEl.appendChild(s);
  }

  /* =========================================================
     1) CUSTOM ROCKET CURSOR + speed-linked flame
     ========================================================= */
  if (!isTouch) {
    const POSITION_EASE = 0.14;
    const ROTATION_EASE = 0.1;

    document.body.insertAdjacentHTML('beforeend', `
      <svg id="cursor" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="flameGrad" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stop-color="#fff6d0"/>
            <stop offset="35%" stop-color="#ffcf5c"/>
            <stop offset="70%" stop-color="#ff8a3d"/>
            <stop offset="100%" stop-color="rgba(255,90,40,0)"/>
          </radialGradient>
        </defs>
        <g id="flameWrap" style="transform-origin:32px 30px;">
          <g id="flame" style="transform-origin:32px 30px;">
            <path d="M32 30 C 26 38, 24 48, 32 54 C 40 48, 38 38, 32 30 Z" fill="url(#flameGrad)"/>
          </g>
        </g>

<g>
  <path d="M32 3 L38 30 L32 25 L26 30 Z" fill="#eef2fb"/>
  <path d="M26 27 L4 38 L24 33 Z" fill="#d8433a"/>
  <path d="M38 27 L60 38 L40 33 Z" fill="#d8433a"/>
  <circle cx="32" cy="14" r="3" fill="#33465e"/>
</g>
      </svg>`);

    const cursorEl = document.getElementById('cursor');
    const flameWrap = document.getElementById('flameWrap');
    let cx = innerWidth / 2, cy = innerHeight / 2;
    let mx = cx, my = cy;
    let prevCx = cx, prevCy = cy;
    let curAngle = 0, targetAngle = 0;

    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - mx, dy = e.clientY - my;
      if (Math.hypot(dx, dy) > 1.5) {
        targetAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      }
      mx = e.clientX; my = e.clientY;
    });

    function angleLerp(from, to, t) {
      const delta = ((to - from + 180) % 360 + 360) % 360 - 180;
      return from + delta * t;
    }

    (function tickCursor() {
      cx += (mx - cx) * POSITION_EASE;
      cy += (my - cy) * POSITION_EASE;
      curAngle = angleLerp(curAngle, targetAngle, ROTATION_EASE);

      const frameSpeed = Math.hypot(cx - prevCx, cy - prevCy);
      prevCx = cx; prevCy = cy;
      if (flameWrap) {
        const intensity = Math.min(frameSpeed / 6, 1);
        flameWrap.style.opacity = 0.15 + intensity * 0.85;
        flameWrap.style.transform = `scaleY(${0.6 + intensity * 0.9})`;
      }

      cursorEl.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%) rotate(${curAngle}deg)`;
      requestAnimationFrame(tickCursor);
    })();
  }

  /* =========================================================
     2) FLOATING ASTRONAUT
     BUG FIX: ax/ay used to be declared `const` and then reassigned
     inside the planet-collision block (`ax += nx * overlap`). That is
     an illegal reassignment in JS — it threw a silent TypeError the
     first time the astronaut ever touched a planet, which killed this
     requestAnimationFrame loop for good and froze the astronaut in
     place. Fixed by correcting the persistent perturbation (px/py)
     instead of trying to mutate ax/ay directly.
     ========================================================= */
  if (!reduceMotion) {
    document.body.insertAdjacentHTML('beforeend', `
      <svg id="astronaut" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="suitBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f5f8fc"/>
            <stop offset="100%" stop-color="#c7cfda"/>
          </linearGradient>
          <radialGradient id="visorGold" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stop-color="#ffe9a8"/>
            <stop offset="55%" stop-color="#e8b64a"/>
            <stop offset="100%" stop-color="#8a5f18"/>
          </radialGradient>
        </defs>
        <rect x="26" y="44" width="48" height="38" rx="10" fill="#8b93a3"/>
        <rect x="36" y="86" width="12" height="30" rx="6" fill="url(#suitBody)"/>
        <rect x="52" y="86" width="12" height="30" rx="6" fill="url(#suitBody)"/>
        <rect x="33" y="108" width="18" height="12" rx="5" fill="#dfe4ec"/>
        <rect x="49" y="108" width="18" height="12" rx="5" fill="#dfe4ec"/>
        <rect x="8"  y="50" width="30" height="13" rx="6.5" fill="url(#suitBody)"/>
        <rect x="62" y="50" width="30" height="13" rx="6.5" fill="url(#suitBody)"/>
        <circle cx="10" cy="56.5" r="8" fill="#dfe4ec"/>
        <circle cx="90" cy="56.5" r="8" fill="#dfe4ec"/>
        <rect x="30" y="42" width="40" height="46" rx="16" fill="url(#suitBody)"/>
        <rect x="41" y="60" width="18" height="14" rx="3" fill="#33465e"/>
        <circle cx="45" cy="67" r="1.6" fill="#ff6a3d"/>
        <circle cx="50" cy="67" r="1.6" fill="#5ec2ff"/>
        <circle cx="55" cy="67" r="1.6" fill="#8be08a"/>
        <rect x="41" y="34" width="18" height="9" rx="3" fill="#aeb6c2"/>
        <circle cx="50" cy="24" r="21" fill="url(#suitBody)"/>
        <circle cx="50" cy="25" r="15.5" fill="url(#visorGold)"/>
        <ellipse cx="44" cy="19" rx="4.5" ry="6.5" fill="#fff" opacity="0.35"/>
        <line x1="66" y1="10" x2="72" y2="2" stroke="#c7cfda" stroke-width="2" stroke-linecap="round"/>
        <circle cx="72" cy="2" r="2.2" fill="#ff6a3d"/>
      </svg>`);

    const astro = document.getElementById('astronaut');
    const sunEl = document.querySelector('.sun');
    const planetEls = Array.from(document.querySelectorAll('.planet'));

    const R = 14;
    const wx = 0.00022, wy = 0.00017, phase = 1.7;
    const ampX = innerWidth * 0.58, ampY = innerHeight * 0.34;
    let t = Math.random() * 100000;

    let px = 0, py = 0, pvx = 0, pvy = 0;
    let arot = Math.random() * 360, arotv = 0.1;

    function circleOf(el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, radius: r.width / 2 };
    }

    (function tickAstro() {
      t++;
      const baseX = innerWidth / 2 + Math.sin(t * wx) * ampX;
      const baseY = innerHeight / 2 + Math.sin(t * wy + phase) * ampY;

      pvx *= 0.985; pvy *= 0.985;
      px += pvx; py += pvy;

      const ax = baseX + px, ay = baseY + py;

      if (sunEl) {
        const sun = circleOf(sunEl);
        const sdx = ax - sun.x, sdy = ay - sun.y;
        const sdist = Math.hypot(sdx, sdy) || 1;
        const safeRadius = sun.radius + R + 90;
        if (sdist < safeRadius) {
          const strength = (1 - sdist / safeRadius) * 0.05;
          pvx += (sdx / sdist) * strength;
          pvy += (sdy / sdist) * strength;
        }
      }

      for (const p of planetEls) {
        const c = circleOf(p);
        const dx = ax - c.x, dy = ay - c.y;
        const dist = Math.hypot(dx, dy) || 1;
        const minDist = R + c.radius;
        if (dist < minDist) {
          const nx = dx / dist, ny = dy / dist;
          const dot = pvx * nx + pvy * ny;
          pvx -= 2 * dot * nx;
          pvy -= 2 * dot * ny;
          pvx += nx * 0.6; pvy += ny * 0.6;
          const overlap = minDist - dist;
          px += nx * overlap; py += ny * overlap; // fixed: correct px/py, never reassign ax/ay
          arotv += 1 + Math.random();
        }
      }

      arot += arotv;
      arotv += (0.1 - arotv) * 0.02;

      astro.style.transform = `translate(${ax - 15}px, ${ay - 19.5}px) rotate(${arot}deg)`;
      requestAnimationFrame(tickAstro);
    })();
  }

  /* =========================================================
     3) SATELLITE + DEBRIS
     BUG FIX: this reused the astronaut's pattern but the planet-bounce
     branch never separated the object from the planet afterward, so an
     object that clipped a planet's edge could stay inside the collision
     radius for several frames in a row — re-triggering the velocity
     reflection every single frame, which is what looked like "flying
     and going crazy." Added the same px/py correction as the fix
     above. Also eased amplitude/speed down slightly for a calmer feel.
     ========================================================= */
  if (!reduceMotion) {
    const sunElD = document.querySelector('.sun');
    const planetElsD = Array.from(document.querySelectorAll('.planet'));

    function circleOfNode(node) {
      const r = node.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, radius: r.width / 2 };
    }

    function makeDrifter(opts) {
      document.body.insertAdjacentHTML('beforeend',
        `<svg id="${opts.id}" class="drifter" viewBox="${opts.viewBox}" xmlns="http://www.w3.org/2000/svg" style="width:${opts.w}px;height:${opts.h}px;">${opts.svgInner}</svg>`);
      const el = document.getElementById(opts.id);

      let t = Math.random() * 100000;
      let px = 0, py = 0, pvx = 0, pvy = 0;
      let arot = Math.random() * 360, arotv = opts.spinBase;

      (function tick() {
        t++;
        const baseX = innerWidth * opts.startXF + Math.sin(t * opts.wx) * innerWidth * opts.ampXF;
        const baseY = innerHeight * opts.startYF + Math.sin(t * opts.wy + opts.phase) * innerHeight * opts.ampYF;
        pvx *= 0.985; pvy *= 0.985;
        px += pvx; py += pvy;
        const ax = baseX + px, ay = baseY + py;

        if (sunElD) {
          const sun = circleOfNode(sunElD);
          const sdx = ax - sun.x, sdy = ay - sun.y;
          const sdist = Math.hypot(sdx, sdy) || 1;
          const safeR = sun.radius + opts.collisionR + 70;
          if (sdist < safeR) {
            const strength = (1 - sdist / safeR) * 0.05;
            pvx += (sdx / sdist) * strength;
            pvy += (sdy / sdist) * strength;
          }
        }
        for (const p of planetElsD) {
          const c = circleOfNode(p);
          const dx = ax - c.x, dy = ay - c.y;
          const dist = Math.hypot(dx, dy) || 1;
          const minDist = opts.collisionR + c.radius;
          if (dist < minDist) {
            const nx = dx / dist, ny = dy / dist;
            const dot = pvx * nx + pvy * ny;
            pvx -= 2 * dot * nx; pvy -= 2 * dot * ny;
            pvx += nx * 0.4; pvy += ny * 0.4;
            const overlap = minDist - dist;
            px += nx * overlap; py += ny * overlap; // fixed: was missing, caused repeated re-collision
            arotv += 0.5 + Math.random() * 0.5;
          }
        }
        arot += arotv;
        arotv += (opts.spinBase - arotv) * 0.02;
        el.style.transform = `translate(${ax - opts.w / 2}px, ${ay - opts.h / 2}px) rotate(${arot}deg)`;
        requestAnimationFrame(tick);
      })();
    }

    makeDrifter({
      id: 'satellite1', w: 34, h: 28, viewBox: '0 0 48 40', collisionR: 16, spinBase: 0.05,
      wx: 0.00015, wy: 0.00021, phase: 0.4, ampXF: 0.36, ampYF: 0.22, startXF: 0.7, startYF: 0.65,
      svgInner: `<g fill="#c7cfda">
        <rect x="18" y="14" width="12" height="20" rx="2" fill="#e7ecf3"/>
        <rect x="2" y="18" width="14" height="10" rx="1" fill="#4a6fa5"/>
        <rect x="32" y="18" width="14" height="10" rx="1" fill="#4a6fa5"/>
        <rect x="16" y="10" width="16" height="3" fill="#8b93a3"/>
        <line x1="24" y1="6" x2="24" y2="12" stroke="#c7cfda" stroke-width="1.5"/>
        <circle cx="24" cy="5" r="1.5" fill="#ff6a3d"/>
      </g>`
    });

    makeDrifter({
      id: 'debris1', w: 20, h: 14, viewBox: '0 0 24 16', collisionR: 10, spinBase: 0.35,
      wx: 0.00021, wy: 0.00016, phase: 2.6, ampXF: 0.34, ampYF: 0.2, startXF: 0.2, startYF: 0.75,
      svgInner: `<rect x="2" y="2" width="20" height="12" rx="1" fill="#5a6a82" opacity="0.9"/>
        <rect x="4" y="4" width="16" height="8" fill="#3d4a5e" opacity="0.7"/>`
    });

    makeDrifter({
      id: 'debris2', w: 14, h: 22, viewBox: '0 0 18 28', collisionR: 9, spinBase: 0.3,
      wx: 0.00017, wy: 0.00023, phase: 4.1, ampXF: 0.3, ampYF: 0.24, startXF: 0.45, startYF: 0.8,
      svgInner: `<rect x="4" y="2" width="10" height="24" rx="5" fill="#9aa3b0"/>
        <rect x="4" y="10" width="10" height="4" fill="#6b7280"/>`
    });
  }

  /* =========================================================
     4) OCCASIONAL PASSERS-BY
     Shooting star: slowed down (was 1.2s across ~1.3 screens, now 2.4s
     across ~0.7 screens — a little under half the old speed).
     Alien ship: completely rewritten. It used to rely on a CSS
     `animation` plus a hardcoded setTimeout for cleanup — if timing
     ever drifted, or the scheduler fired again before a ship finished,
     copies could pile up without being removed, which is the "stuck at
     the bottom, way too big" stack in your screenshot. Now it's a
     single requestAnimationFrame loop, a `shipActive` flag guarantees
     only one ship exists at a time, removal happens exactly when it
     leaves the viewport (not a fixed timer), and it renders smaller.
     ========================================================= */
  if (!reduceMotion) {
    function spawnShootingStar() {
      if (document.body.classList.contains('hide-ambient')) return;
      const fromLeft = Math.random() < 0.5;
      const startX = fromLeft ? -40 : innerWidth * 0.2 + Math.random() * innerWidth * 0.6;
      const startY = fromLeft ? 20 + Math.random() * innerHeight * 0.4 : -40;
      const angle = 28 + Math.random() * 14;
      const dist = Math.max(innerWidth, innerHeight) * 0.7;
      const rad = angle * Math.PI / 180;

      const star = document.createElement('div');
      star.className = 'shooting-star';
      star.style.left = startX + 'px';
      star.style.top = startY + 'px';
      star.style.setProperty('--endX', (Math.cos(rad) * dist) + 'px');
      star.style.setProperty('--endY', (Math.sin(rad) * dist) + 'px');
      star.style.setProperty('--ang', angle + 'deg');
      document.body.appendChild(star);
      setTimeout(() => star.remove(), 2600);
    }
    (function scheduleShootingStar() {
      setTimeout(() => { spawnShootingStar(); scheduleShootingStar(); }, 8000 + Math.random() * 15000);
    })();

    let shipActive = false;
    function spawnAlienShip() {
      if (document.body.classList.contains('hide-ambient')) return;
      if (shipActive) return;
      shipActive = true;

      const goingRight = Math.random() < 0.5;
      const y = innerHeight * (0.15 + Math.random() * 0.5);
      const ship = document.createElement('div');
      ship.className = 'alien-ship';
      ship.innerHTML = `<svg viewBox="0 0 100 40" width="60" height="24" style="transform:${goingRight ? 'none' : 'scaleX(-1)'}">
        <ellipse cx="50" cy="26" rx="46" ry="10" fill="#5a7a6a"/>
        <ellipse cx="50" cy="26" rx="46" ry="10" fill="none" stroke="#a8d8c0" stroke-width="1.5" opacity="0.7"/>
        <path d="M25 22 Q50 2 75 22 Z" fill="#bfe8d8" opacity="0.85"/>
        <ellipse cx="50" cy="26" rx="10" ry="4" fill="#2f4a40"/>
      </svg>`;
      document.body.appendChild(ship);

      let x = goingRight ? -80 : innerWidth + 80;
      const speed = goingRight ? 2.2 : -2.2; // px/frame — slow, deliberate flyby
      let bob = 0;

      (function tick() {
        x += speed;
        bob += 0.045;
        ship.style.transform = `translate(${x}px, ${y + Math.sin(bob) * 10}px)`;
        const stillOnScreen = goingRight ? x < innerWidth + 100 : x > -100;
        if (stillOnScreen) {
          requestAnimationFrame(tick);
        } else {
          ship.remove();
          shipActive = false;
        }
      })();
    }
    (function scheduleAlienShip() {
      setTimeout(() => { spawnAlienShip(); scheduleAlienShip(); }, 45000 + Math.random() * 70000);
    })();
  }

  /* =========================================================
     5) SUN EASTER EGG
     ========================================================= */
  const sunHold = document.querySelector('.sun');
  if (sunHold) {
    const HOLD_TO_EXPLODE = 1800;
    const MAX_SCALE = 2.6;
    let holdStart = null;
    let holdRAF = null;
    let exploding = false;

    function updateHold() {
      if (holdStart === null || exploding) return;
      const elapsed = performance.now() - holdStart;
      const t = Math.min(elapsed / HOLD_TO_EXPLODE, 1);
      sunHold.style.transform = `scale(${1 + t * (MAX_SCALE - 1)})`;
      sunHold.style.filter = `brightness(${1 + t * 0.6})`;
      if (t >= 1) { triggerExplosion(); return; }
      holdRAF = requestAnimationFrame(updateHold);
    }

    function startHold(e) {
      if (exploding) return;
      e.preventDefault();
      holdStart = performance.now();
      sunHold.style.transition = 'none';
      holdRAF = requestAnimationFrame(updateHold);
    }

    function releaseHold() {
      if (exploding || holdStart === null) return;
      holdStart = null;
      cancelAnimationFrame(holdRAF);
      sunHold.style.transition = 'transform 0.4s ease-out, filter 0.4s ease-out';
      sunHold.style.transform = 'scale(1)';
      sunHold.style.filter = 'brightness(1)';
    }

    function triggerExplosion() {
      exploding = true;
      holdStart = null;
      cancelAnimationFrame(holdRAF);

      const rect = sunHold.getBoundingClientRect();
      const wave = document.createElement('div');
      wave.className = 'sun-shockwave';
      wave.style.left = `${rect.left + rect.width / 2}px`;
      wave.style.top = `${rect.top + rect.height / 2}px`;
      document.body.appendChild(wave);

      sunHold.style.transition = 'transform 0.25s ease-in, opacity 0.25s ease-in';
      sunHold.style.transform = 'scale(3.2)';
      sunHold.style.opacity = '0';

      // the whole site fades to black, then the page does a full reload —
      // no more "reset back to normal" step, since reloading wipes state anyway
      const blackout = document.createElement('div');
      blackout.id = 'sun-blackout';
      document.body.appendChild(blackout);
      setTimeout(() => blackout.classList.add('is-active'), 80);

      setTimeout(() => { window.location.reload(); }, 550);
    }

    sunHold.addEventListener('mousedown', startHold);
    sunHold.addEventListener('touchstart', startHold, { passive: false });
    ['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((evt) =>
      sunHold.addEventListener(evt, releaseHold)
    );
  }

  const flareHost = document.querySelector('.sun');
if (flareHost) {
  const FLARE_COUNT = 3;
  const SUN_RADIUS = 65; // matches .sun's own 130px width/height

  function repositionFlare(el) {
    const angle = Math.random() * Math.PI * 2;
    const dist = SUN_RADIUS * (0.85 + Math.random() * 0.15);
    const size = 16 + Math.random() * 14;
    el.style.width = el.style.height = `${size}px`;
    el.style.left = `${SUN_RADIUS + Math.cos(angle) * dist - size / 2}px`;
    el.style.top = `${SUN_RADIUS + Math.sin(angle) * dist - size / 2}px`;
  }

  for (let i = 0; i < FLARE_COUNT; i++) {
    const flare = document.createElement('div');
    flare.className = 'solar-flare';
    flareHost.appendChild(flare);
    repositionFlare(flare);
    flare.style.animationDelay = `${i * 1.1}s`;
    setInterval(() => repositionFlare(flare), 4000 + Math.random() * 3000);
  }
}

  /* =========================================================
     6) STAR PORTRAIT — index.html only, if #portraitStars exists
     ========================================================= */
     const portraitStars = document.getElementById('portraitStars');
  if (portraitStars) {
    const COUNT = 260;
    for (let i = 0; i < COUNT; i++) {
      const x = 10 + Math.random() * 280;
      const y = 30 + Math.random() * 375;
      const r = Math.random() * 1.6 + 0.4;
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', x.toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      c.setAttribute('r', r.toFixed(2));
      c.setAttribute('fill', '#eef2fb');
      c.setAttribute('opacity', (Math.random() * 0.7 + 0.3).toFixed(2));
      portraitStars.appendChild(c);
    }
  }

  /* =========================================================
     7) FOOTER — injected on every page
     ========================================================= */
  document.body.insertAdjacentHTML('beforeend', `
    <footer id="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <span class="footer-logo">Shaquille Kempes</span>
          <p class="footer-tagline">"I have no past. I only have the future".</p>
        </div>
        <nav class="footer-links">
          <a href="index.html">Home</a>
          <a href="skills.html">Skills</a>
          <a href="about.html">About</a>
          <a href="work.html">Work</a>
          <a href="contact.html">Contact</a>
        
        </nav>

      </div>
      <p class="footer-copyright">&copy; 2026 Hyperspace Gate. All rights reserved.</p>
    </footer>
  `);
})();
