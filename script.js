/*
 * ভিত্তি (Bhitti) — single-page luxury brick store.
 * Wrapped in a single IIFE so nothing leaks onto window. The public surface
 * is window.Bhitti — a tiny facade used by:
 *   - consent gating (analytics stays off until the user grants it)
 *   - event tracking (firebase-config.js turns this into Firestore writes;
 *     if Firebase isn't configured it is a no-op, and the user has locked
 *     Firestore writes — see firebase-config.js)
 *   - a tiny session id for analytics join keys
 *
 * Module map (all invoked in order from boot()):
 *   initReveal()        IntersectionObserver scroll reveals
 *   initReadProgress()  Goal-Gradient reading bar
 *   initScarcity()      Urgency/Scarcity ticker + 23:59:59 countdown
 *   initCraftScroll()   GSAP ScrollTrigger sticky word swap (মাটি→আগুন→সময়→ভরসা)
 *   initBrick3D()       Three.js draggable hero object (singleton texture cache)
 *   initCartBrick3D()   Tiny Three.js instance for the cart drawer
 *   initGame()          Mini-game (Goal Gradient) — single Canvas2D sprite
 *   initCart()          Cart + Zeigarnik nudge + Labor-Illusion checkout
 *   initMobileNav()     Hamburger drawer
 *   initCursorGlow()    Ambient cursor follow (desktop only)
 *   initMagnetic()      CTA hover lean
 *   initConsent()       Consent banner + analytics opt-in
 *   initZeigarnik()     Idle-25s dynamic-island + exit-intent save-the-cart modal
 *   initGoalGradient()  Micro-progress on hero CTA hover
 *   initErrorTracking() window.onerror → console only
 */
'use strict';
(function (window, document) {
  // ---------- Bangla numeral formatter ----------
  function bn(n) {
    var d = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return String(n).replace(/[0-9]/g, function (m) { return d[+m]; });
  }

  // ---------- Bhitti singleton facade ----------
  // Always installed; analytics is a no-op by design until initConsent()
  // flips the flag, AND firebase-config.js itself is a no-op unless real
  // Firebase config is provided. We never block UX on these.
  // ---------- Bhitti singleton facade ----------
  var ns = 'bhitti.';
  var ls;
  try { ls = window.localStorage; } catch (e) { ls = null; }
  function setItem(key, val) { try { ls && ls.setItem(ns + key, JSON.stringify(val)); } catch (e) {} }
  function getItem(key, def) {
    try {
      var raw = ls && ls.getItem(ns + key);
      return raw == null ? def : JSON.parse(raw);
    } catch (e) { return def; }
  }

  // Local high scores database
  function getLeaderboard() {
    var defaultBoard = [
      { name: "আমিনুল ইসলাম", score: 45 },
      { name: "খলিফা আল আমিন", score: 40 },
      { name: "মোঃ জসিম", score: 30 },
      { name: "আব্দুর রহমান", score: 25 },
      { name: "রিপন মিয়া", score: 15 }
    ];
    try {
      var board = localStorage.getItem('bhitti-leaderboard');
      return board ? JSON.parse(board) : defaultBoard;
    } catch (e) {
      return defaultBoard;
    }
  }

  function saveLeaderboard(board) {
    try {
      localStorage.setItem('bhitti-leaderboard', JSON.stringify(board));
    } catch (e) {}
  }

  function renderLeaderboardUI() {
    var listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;
    var board = getLeaderboard();
    listEl.innerHTML = board.map(function (entry, i) {
      var isHighlight = entry.isUser ? ' class="highlight"' : '';
      return '<li' + isHighlight + '><span>' + bn(i + 1) + '. ' + entry.name + '</span><b>' + bn(entry.score) + ' পিস</b></li>';
    }).join('');
  }

  var Bhitti = {
    bn: bn,
    ns: ns,
    ready: true,
    consent: false, // analytics stays off until user grants consent
    track: function () {}, // replaced in initConsent
    submitScore: function (name, score) {
      var userName = name || prompt("আপনার নাম লিখুন (সর্বোচ্চ ১২ অক্ষর):") || "অতিথি";
      userName = userName.trim().slice(0, 12) || "অতিথি";
      var board = getLeaderboard();
      
      // Remove any existing user entry
      board = board.filter(function (e) { return !e.isUser; });
      
      board.push({ name: userName, score: score, isUser: true });
      board.sort(function (a, b) { return b.score - a.score; });
      board = board.slice(0, 5); // Keep top 5
      
      saveLeaderboard(board);
      renderLeaderboardUI();
      if (typeof showDynamicIsland === 'function') {
        showDynamicIsland('লিডারবোর্ডে আপনার স্থান হয়েছে!');
      }
    },
    session: { id: null },
    storage: { set: setItem, get: getItem }
  };
  // session id is a one-time random tag, persisted for cross-tab join.
  (function () {
    var sid = getItem('session.id', null);
    if (!sid) {
      sid = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      setItem('session.id', sid);
    }
    Bhitti.session.id = sid;
  })();

  // ---------- Reduced motion helper ----------
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Boot orchestrator ----------
  function boot() {
    setTimeout(function () {
      var l = document.getElementById('loader');
      if (l) l.classList.add('hide');
    }, 900);
    renderLeaderboardUI();
    initReveal();
    initReadProgress();
    initScarcity();
    initCraftScroll();
    initBrick3D();
    initCartBrick3D();
    initGame();
    initCart();
    initMobileNav();
    initCursorGlow();
    initMagnetic();
    initConsent();
    initZeigarnik();
    initGoalGradient();
    initErrorTracking();
    Bhitti.track('page_view');
  }
  if (document.readyState === 'complete') boot();
  else window.addEventListener('load', boot);

/* Mobile navigation drawer. */
function initMobileNav() {
  var burger = document.getElementById('nav-burger');
  var links = document.getElementById('nav-links');
  if (!burger || !links) return;
  function setOpen(open) {
    burger.classList.toggle('open', open);
    links.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  burger.addEventListener('click', function () { setOpen(!links.classList.contains('open')); });
  links.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
}

/* Ambient cursor glow that follows the pointer (desktop only). */
function initCursorGlow() {
  var glow = document.getElementById('cursor-glow');
  if (!glow || window.matchMedia('(hover:none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;
  window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); }, { passive: true });
  (function follow() {
    gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12;
    glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px) translate(-50%,-50%)';
    requestAnimationFrame(follow);
  })();
}

/* Magnetic CTAs: buttons gently lean toward the cursor for a tactile feel. */
function initMagnetic() {
  if (window.matchMedia('(hover:none)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.cta').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      var mx = e.clientX - r.left - r.width / 2;
      var my = e.clientY - r.top - r.height / 2;
      btn.style.transform = 'translate(' + (mx * 0.18) + 'px,' + (my * 0.28) + 'px)';
    });
    btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
  });
}

function initReveal() {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal').forEach(function (el, i) {
    el.style.transitionDelay = (i % 5 * 0.08) + 's';
    obs.observe(el);
  });
}

/* Goal Gradient: a reading progress bar makes completion feel within reach. */
function initReadProgress() {
  var bar = document.getElementById('read-progress');
  if (!bar) return;
  function update() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* Urgency/Scarcity: limited stock + live countdown to the next batch. */
function initScarcity() {
  var stockEl = document.getElementById('stock');
  var cdEl = document.getElementById('countdown');
  if (stockEl) {
    var stored = +localStorage.getItem('bhitti-stock');
    var stock = (stored >= 7 && stored <= 17) ? stored : 17;
    stockEl.textContent = bn(stock);
    // Occasionally tick stock down to imply real demand (floor at 7).
    setInterval(function () {
      if (stock > 7 && Math.random() < 0.5) {
        stock--; stockEl.textContent = bn(stock);
        localStorage.setItem('bhitti-stock', stock);
      }
    }, 9000);
  }
  if (cdEl) {
    // Countdown to the end of today (next batch).
    setInterval(function () {
      var now = new Date();
      var end = new Date(now); end.setHours(23, 59, 59, 999);
      var diff = Math.max(0, end - now);
      var hh = Math.floor(diff / 3.6e6);
      var mm = Math.floor(diff % 3.6e6 / 6e4);
      var ss = Math.floor(diff % 6e4 / 1000);
      function p(x) { return bn((x < 10 ? '0' : '') + x); }
      cdEl.textContent = p(hh) + ':' + p(mm) + ':' + p(ss);
    }, 1000);
  }
}

function initCraftScroll() {
  var words = document.querySelectorAll('.craft-word');
  var panels = document.querySelectorAll('.craft-panel');
  if (!(window.gsap && window.ScrollTrigger)) return;
  gsap.registerPlugin(ScrollTrigger);
  panels.forEach(function (panel, i) {
    ScrollTrigger.create({
      trigger: panel, start: 'top center', end: 'bottom center',
      onToggle: function (self) {
        if (self.isActive) {
          words.forEach(function (w) { w.classList.remove('active'); });
          if (words[i]) words[i].classList.add('active');
        }
      }
    });
  });
}

/* ===== Procedural ultra-realistic brick textures with embossed branding ===== */
function makeBrickTextures() {
  var size = 2048;
  var c = document.createElement('canvas'); c.width = c.height = size;
  var g = c.getContext('2d');
  
  var base = g.createLinearGradient(0, 0, size, size);
  base.addColorStop(0, '#8c3121'); base.addColorStop(0.5, '#7a291a'); base.addColorStop(1, '#611f12');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  
  for (var i = 0; i < 80000; i++) {
    var x = Math.random() * size, y = Math.random() * size, r = Math.random() * 2.5;
    g.fillStyle = Math.random() > 0.5 ? 'rgba(30,10,5,' + (Math.random() * 0.4) + ')'
                                      : 'rgba(230,160,120,' + (Math.random() * 0.3) + ')';
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  for (var j = 0; j < 200; j++) {
    g.strokeStyle = 'rgba(20,10,5,' + (0.1 + Math.random() * 0.3) + ')';
    g.lineWidth = Math.random() * 3;
    g.beginPath(); g.moveTo(Math.random() * size, Math.random() * size);
    g.lineTo(Math.random() * size, Math.random() * size); g.stroke();
  }
  
  var b = document.createElement('canvas'); b.width = b.height = size;
  var bgc = b.getContext('2d');
  bgc.fillStyle = '#808080'; bgc.fillRect(0, 0, size, size);
  for (var k = 0; k < 150000; k++) {
    var v = 80 + Math.random() * 100;
    bgc.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
    bgc.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  var rm = document.createElement('canvas'); rm.width = rm.height = size;
  var rmc = rm.getContext('2d');
  rmc.fillStyle = '#e0e0e0'; rmc.fillRect(0, 0, size, size);
  for (var k = 0; k < 100000; k++) {
    var rv = 180 + Math.random() * 75;
    rmc.fillStyle = 'rgb(' + rv + ',' + rv + ',' + rv + ')';
    rmc.fillRect(Math.random() * size, Math.random() * size, 3, 3);
  }

  var text = "লাল ইট";
  var fontStr = "bold 340px 'Tiro Bangla', serif";
  g.font = fontStr; g.textAlign = "center"; g.textBaseline = "middle";
  bgc.font = fontStr; bgc.textAlign = "center"; bgc.textBaseline = "middle";
  rmc.font = fontStr; rmc.textAlign = "center"; rmc.textBaseline = "middle";

  var cx = size / 2, cy = size / 2;
  
  bgc.fillStyle = '#101010'; 
  bgc.fillText(text, cx, cy);
  bgc.shadowColor = 'rgba(255,255,255,0.5)';
  bgc.shadowBlur = 12;
  bgc.shadowOffsetX = -6; bgc.shadowOffsetY = -6;
  bgc.fillText(text, cx, cy);
  bgc.shadowColor = 'transparent';

  g.fillStyle = 'rgba(30,10,5,0.6)';
  g.fillText(text, cx, cy);
  
  rmc.fillStyle = '#b0b0b0';
  rmc.fillText(text, cx, cy);

  var colorTex = new THREE.CanvasTexture(c); colorTex.anisotropy = 16;
  var bumpTex = new THREE.CanvasTexture(b); bumpTex.anisotropy = 16;
  var roughTex = new THREE.CanvasTexture(rm); roughTex.anisotropy = 16;
  return { colorTex: colorTex, bumpTex: bumpTex, roughTex: roughTex };
}

function roundedBox(w, h, d, r, seg) {
  var shape = new THREE.Shape();
  var x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  var geo = new THREE.ExtrudeGeometry(shape, {
    depth: d, bevelEnabled: true, bevelThickness: r * 0.6, bevelSize: r * 0.6,
    bevelSegments: seg, steps: 1, curveSegments: 6
  });
  geo.center();
  return geo;
}

function createAuthenticBrickGroup(mat) {
  var group = new THREE.Group();
  
  var baseMesh = new THREE.Mesh(roundedBox(2.6, 1.15, 0.4, 0.04, 2), mat);
  baseMesh.position.z = -0.1;
  baseMesh.receiveShadow = true; baseMesh.castShadow = true;
  group.add(baseMesh);

  var frogBaseMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.85), mat);
  frogBaseMesh.position.z = 0.101; 
  frogBaseMesh.receiveShadow = true; frogBaseMesh.castShadow = true;
  group.add(frogBaseMesh);

  var tb = new THREE.Mesh(roundedBox(2.6, 0.15, 0.15, 0.02, 1), mat);
  tb.position.set(0, 0.5, 0.175);
  tb.receiveShadow = true; tb.castShadow = true;
  group.add(tb);

  var bb = new THREE.Mesh(roundedBox(2.6, 0.15, 0.15, 0.02, 1), mat);
  bb.position.set(0, -0.5, 0.175);
  bb.receiveShadow = true; bb.castShadow = true;
  group.add(bb);

  var lb = new THREE.Mesh(roundedBox(0.3, 0.85, 0.15, 0.02, 1), mat);
  lb.position.set(-1.15, 0, 0.175);
  lb.receiveShadow = true; lb.castShadow = true;
  group.add(lb);

  var rb = new THREE.Mesh(roundedBox(0.3, 0.85, 0.15, 0.02, 1), mat);
  rb.position.set(1.15, 0, 0.175);
  rb.receiveShadow = true; rb.castShadow = true;
  group.add(rb);

  return group;
}

function initBrick3D() {
  var mount = document.getElementById('three-bg-container');
  var interactiveArea = document.getElementById('brick-canvas');
  if (!mount || !window.THREE) return;
  // Graceful fallback when WebGL is unavailable (old devices / blocked GPU).
  try {
    var probe = document.createElement('canvas');
    if (!(probe.getContext('webgl') || probe.getContext('experimental-webgl'))) throw 0;
  } catch (err) {
    if (interactiveArea) {
      interactiveArea.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#8a8077;font-size:.9rem;text-align:center;padding:1rem">আপনার ফোনে থ্রিডি দেখা যাচ্ছে না। তবে কোনো সমস্যা নেই, আমাদের ইট একদম খাঁটি।</div>';
    }
    return;
  }
  var w = window.innerWidth, h = window.innerHeight;
  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x141110, 0.06);
  var camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
  camera.position.set(0, 0, 6.8);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  mount.appendChild(renderer.domElement);

  var group = new THREE.Group(); scene.add(group);
  
  var dustGeo = new THREE.BufferGeometry();
  var dustCount = 800;
  var posArray = new Float32Array(dustCount * 3);
  for(var i=0; i<dustCount*3; i++) posArray[i] = (Math.random() - 0.5) * 15;
  dustGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  var dustMat = new THREE.PointsMaterial({ size: 0.04, color: 0xdddddd, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
  var dustParticles = new THREE.Points(dustGeo, dustMat);
  scene.add(dustParticles);

  var tex = makeBrickTextures();
  var mat = new THREE.MeshStandardMaterial({ 
    map: tex.colorTex, 
    bumpMap: tex.bumpTex, bumpScale: 0.05, 
    roughnessMap: tex.roughTex, roughness: 1.0, 
    metalness: 0.02,
    transparent: true,
    opacity: 1
  });
  var brick = createAuthenticBrickGroup(mat); group.add(brick);
  var pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.3, 0.18, 64), new THREE.MeshStandardMaterial({ color: 0x0c0a09, roughness: 0.25, metalness: 0.6 }));
  pedestal.position.y = -1.15; pedestal.receiveShadow = true; group.add(pedestal);

  var s = document.createElement('canvas'); s.width = s.height = 128;
  var sc = s.getContext('2d');
  var grad = sc.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
  sc.fillStyle = grad; sc.fillRect(0, 0, 128, 128);
  var blob = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(s), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = -1.05; group.add(blob);

  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  var key = new THREE.DirectionalLight(0xffefe0, 1.7);
  key.position.set(5, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 25; scene.add(key);
  var rim = new THREE.DirectionalLight(0x7fb8ff, 1.4); rim.position.set(-7, 2, -6); scene.add(rim);
  var fill = new THREE.PointLight(0xffcba3, 0.8, 20); fill.position.set(-2, -1, 4); scene.add(fill);

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth <= 820;

  var brickParams = {
    x: 0,
    y: 0.2,
    z: 0,
    rx: -0.25,
    ry: 0.6,
    rz: 0,
    scale: isMobile ? 0.85 : 1.1,
    clayProgress: 0,
    fireProgress: 0,
    opacity: 1,
    pedestalY: -1.15,
    blobOpacity: 1
  };

  window.addEventListener('resize', function () {
    isMobile = window.innerWidth <= 820;
    var nw = window.innerWidth, nh = window.innerHeight;
    camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    // Hero -> Clay (panel-earth)
    gsap.timeline({
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    })
    .to(brickParams, {
      scale: function() { return isMobile ? 1.0 : 1.4; },
      y: 0,
      clayProgress: 1,
      rx: 0.1,
      ry: 1.8,
      duration: 1
    });

    // Clay -> Fire (panel-fire)
    gsap.timeline({
      scrollTrigger: {
        trigger: "#panel-fire",
        start: "top bottom",
        end: "top center",
        scrub: true
      }
    })
    .to(brickParams, {
      clayProgress: 0,
      fireProgress: 1,
      rx: -0.2,
      ry: 3.2,
      duration: 1
    });

    // Fire -> Cool (panel-time)
    gsap.timeline({
      scrollTrigger: {
        trigger: "#panel-time",
        start: "top bottom",
        end: "top center",
        scrub: true
      }
    })
    .to(brickParams, {
      fireProgress: 0,
      rx: 0.3,
      ry: 4.8,
      duration: 1
    });

    // Cool -> Finished (panel-trust)
    gsap.timeline({
      scrollTrigger: {
        trigger: "#panel-trust",
        start: "top bottom",
        end: "top center",
        scrub: true
      }
    })
    .to(brickParams, {
      rx: -0.15,
      ry: 6.8,
      scale: function() { return isMobile ? 0.95 : 1.3; },
      duration: 1
    });

    // Craft -> Object Section (Specs)
    gsap.timeline({
      scrollTrigger: {
        trigger: "#object",
        start: "top bottom",
        end: "top center",
        scrub: true,
        onEnter: function() { mount.classList.add('interactive'); },
        onLeaveBack: function() { mount.classList.remove('interactive'); },
        onEnterBack: function() { mount.classList.add('interactive'); },
        onLeave: function() { mount.classList.remove('interactive'); }
      }
    })
    .to(brickParams, {
      x: function() { return isMobile ? 0 : 1.5; },
      y: function() { return isMobile ? -0.5 : 0; },
      scale: function() { return isMobile ? 0.8 : 1.0; },
      rx: -0.25,
      ry: 0.6,
      pedestalY: -1.15,
      blobOpacity: 1,
      duration: 1
    });

    // Object -> Game (play)
    gsap.timeline({
      scrollTrigger: {
        trigger: "#play",
        start: "top bottom",
        end: "top center",
        scrub: true
      }
    })
    .to(brickParams, {
      y: -6,
      scale: 0.1,
      opacity: 0,
      blobOpacity: 0,
      pedestalY: -5,
      duration: 1
    });

    // Game -> Checkout (own)
    gsap.timeline({
      scrollTrigger: {
        trigger: "#own",
        start: "top bottom",
        end: "top center",
        scrub: true
      }
    })
    .to(brickParams, {
      x: function() { return isMobile ? 0 : -1.5; },
      y: function() { return isMobile ? 0.7 : 0.2; },
      scale: function() { return isMobile ? 0.65 : 0.95; },
      opacity: 1,
      blobOpacity: 0.8,
      pedestalY: -1.15,
      rx: 0.1,
      ry: 1.2,
      duration: 1
    });
  }

  var dragging = false, autoSpin = !reduceMotion, px = 0, py = 0, vel = 0, tracked = false;
  var dragTargetX = brickParams.rx, dragTargetY = brickParams.ry;
  var hint = interactiveArea ? interactiveArea.querySelector('.drag-hint') : null;

  function down(x, y) { 
    if (!mount.classList.contains('interactive')) return;
    dragging = true; 
    autoSpin = false; 
    px = x; py = y; 
    if (hint) hint.classList.add('gone'); 
    if (!tracked) { 
      tracked = true; 
      Bhitti.track('brick_rotate'); 
    } 
  }
  function move(x, y) { 
    if (!dragging) return; 
    var dx = (x - px) * 0.01; 
    dragTargetY += dx; 
    dragTargetX += (y - py) * 0.01; 
    vel = dx; px = x; py = y; 
  }
  function up() { dragging = false; }

  function onMove(e) { move(e.clientX, e.clientY); }
  function onUp() { up(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }
  
  if (interactiveArea) {
    interactiveArea.addEventListener('mousedown', function (e) { 
      down(e.clientX, e.clientY); 
      window.addEventListener('mousemove', onMove); 
      window.addEventListener('mouseup', onUp); 
    });
    
    var onTMove = function(e) { var t = e.touches[0]; if (t) move(t.clientX, t.clientY); };
    var onTEnd = function() { up(); window.removeEventListener('touchmove', onTMove); window.removeEventListener('touchend', onTEnd); };
    
    interactiveArea.addEventListener('touchstart', function (e) { 
      var t = e.touches[0]; 
      down(t.clientX, t.clientY); 
      window.addEventListener('touchmove', onTMove, { passive: true }); 
      window.addEventListener('touchend', onTEnd); 
    }, { passive: true });
  }

  var mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', function(e) {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  var clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    
    var time = clock.getElapsedTime();
    var isInteractive = mount.classList.contains('interactive');

    if (isInteractive) {
      if (dragging) {
        brickParams.rx = dragTargetX;
        brickParams.ry = dragTargetY;
      } else {
        if (autoSpin) dragTargetY += 0.004;
        else { dragTargetY += vel; vel *= 0.94; }
        brickParams.rx += (dragTargetX - brickParams.rx) * 0.08;
        brickParams.ry += (dragTargetY - brickParams.ry) * 0.08;
      }
    } else {
      dragTargetX = brickParams.rx;
      dragTargetY = brickParams.ry;
    }

    brick.position.set(brickParams.x, brickParams.y, brickParams.z);
    
    var isOwnActive = Math.abs(brickParams.x - (isMobile ? 0 : -1.5)) < 0.1 && Math.abs(brickParams.y - (isMobile ? 0.7 : 0.2)) < 0.2;
    var floatVal = (reduceMotion) ? 0 : Math.sin(time * 0.8) * (isOwnActive ? 0.08 : 0.04);
    brick.position.y += floatVal;

    brick.rotation.x = brickParams.rx + (mouseY * 0.06);
    brick.rotation.y = brickParams.ry + (mouseX * 0.06);
    brick.scale.setScalar(brickParams.scale);
    
    // Clay / Fire Material Interpolations
    mat.color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0x8a7f72), brickParams.clayProgress);
    var fireIntensity = brickParams.fireProgress;
    mat.emissive.setHex(0xff3a00);
    mat.emissiveIntensity = fireIntensity * 3.5;
    
    mat.opacity = brickParams.opacity;
    pedestal.material.opacity = brickParams.opacity;
    blob.material.opacity = brickParams.blobOpacity * 0.55;

    pedestal.position.y = brickParams.pedestalY;
    blob.position.y = brickParams.pedestalY + 0.1;

    // Dust particles kiln embers animation
    var positions = dustParticles.geometry.attributes.position.array;
    for (var i = 0; i < dustCount; i++) {
      if (fireIntensity > 0.4) {
        positions[i * 3 + 1] += 0.03 * (1 + Math.random());
        if (positions[i * 3 + 1] > 6) positions[i * 3 + 1] = -4;
        dustMat.color.setHex(0xffaa44);
        dustMat.opacity = fireIntensity * 0.7;
      } else {
        positions[i * 3 + 1] += 0.003;
        if (positions[i * 3 + 1] > 6) positions[i * 3 + 1] = -6;
        dustMat.color.setHex(0xdddddd);
        dustMat.opacity = 0.3 * (1 - brickParams.opacity * 0.5);
      }
    }
    dustParticles.geometry.attributes.position.needsUpdate = true;
    dustParticles.rotation.y += 0.0006;

    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', function () {
    var nw = mount.clientWidth, nh = mount.clientHeight;
    if (!nw || !nh) return;
    camera.aspect = nw / nh; camera.updateProjectionMatrix(); renderer.setSize(nw, nh);
  });
}

/* ===== Stacking mini-game with Goal-Gradient milestones ===== */
function initGame() {
  var canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  // Responsive, DPR-aware canvas: logical size stays 400x560 for game logic,
  // while the backing store and CSS size adapt to the device.
  var W = 400, H = 560, BRICK_H = 30;
  function fit() {
    var maxW = Math.min(400, (canvas.parentElement ? canvas.parentElement.clientWidth : 400) || 400);
    var scale = maxW / 400;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = (400 * scale) + 'px';
    canvas.style.height = (560 * scale) + 'px';
    canvas.width = Math.round(400 * dpr);
    canvas.height = Math.round(560 * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit();
  window.addEventListener('resize', function () { fit(); draw(); });
  var MILESTONES = [5, 10, 20, 35, 50];
  var stack, current, dir, speed, score, playing = false, raf;
  var best = +(localStorage.getItem('bhitti-best') || 0);
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var msgEl = document.getElementById('game-msg');
  // Sound: tiny WebAudio blips (respect a user toggle + reduced-motion).
  var soundOn = localStorage.getItem('bhitti-sound') !== 'off';
  var AC = window.AudioContext || window.webkitAudioContext;
  var actx = null;
  function beep(freq, dur) {
    if (!soundOn || !AC) return;
    try {
      if (!actx) actx = new AC();
      var o = actx.createOscillator(), gnode = actx.createGain();
      o.frequency.value = freq; o.type = 'sine';
      gnode.gain.setValueAtTime(0.06, actx.currentTime);
      gnode.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (dur || 0.12));
      o.connect(gnode); gnode.connect(actx.destination);
      o.start(); o.stop(actx.currentTime + (dur || 0.12));
    } catch (e) {}
  }
  var soundBtn = document.getElementById('sound-toggle');
  if (soundBtn) {
    soundBtn.textContent = soundOn ? '\ud83d\udd0a' : '\ud83d\udd07';
    soundBtn.addEventListener('click', function () {
      soundOn = !soundOn; localStorage.setItem('bhitti-sound', soundOn ? 'on' : 'off');
      soundBtn.textContent = soundOn ? '\ud83d\udd0a' : '\ud83d\udd07';
    });
  }
  var startBtn = document.getElementById('game-start');
  var goalTargetEl = document.getElementById('goal-target');
  var goalFillEl = document.getElementById('goal-fill');
  bestEl.textContent = bn(best);

  // Pre-render a single static brick texture so it never flickers per frame.
  var brickTile = document.createElement('canvas');
  brickTile.width = 200; brickTile.height = BRICK_H;
  (function () {
    var t = brickTile.getContext('2d');
    var gr = t.createLinearGradient(0, 0, 0, BRICK_H);
    gr.addColorStop(0, '#9e3b28'); gr.addColorStop(1, '#7a2c1e');
    t.fillStyle = gr; t.fillRect(0, 0, 200, BRICK_H);
    t.fillStyle = 'rgba(40,15,8,.22)';
    for (var i = 0; i < 90; i++) t.fillRect(Math.random() * 200, Math.random() * BRICK_H, 1.4, 1.4);
    t.fillStyle = 'rgba(255,255,255,.08)'; t.fillRect(0, 0, 200, 4);
  })();

  function nextMilestone() {
    for (var i = 0; i < MILESTONES.length; i++) if (MILESTONES[i] > score) return MILESTONES[i];
    return MILESTONES[MILESTONES.length - 1] + 15;
  }
  function updateGoal() {
    var target = nextMilestone();
    var prev = 0;
    for (var i = 0; i < MILESTONES.length; i++) { if (MILESTONES[i] >= target) break; prev = MILESTONES[i]; }
    var pct = Math.min(100, (score - prev) / (target - prev) * 100);
    if (goalTargetEl) goalTargetEl.textContent = bn(target);
    if (goalFillEl) goalFillEl.style.width = pct + '%';
  }

  // Matter.js Physics integration
  var Engine = Matter.Engine, World = Matter.World, Bodies = Matter.Bodies, Body = Matter.Body;
  var engine = Engine.create();
  var world = engine.world;
  var debris = [];

  function reset() {
    World.clear(world); Engine.clear(engine); debris = [];
    var baseW = 160;
    stack = [{ x: (W - baseW) / 2, w: baseW }];
    score = 0; speed = 2.2; dir = 1;
    current = { x: 0, w: baseW, y: H - (stack.length + 1) * BRICK_H };
    scoreEl.textContent = bn(0); msgEl.textContent = ''; updateGoal();
  }
  function spawn() {
    var top = stack[stack.length - 1];
    current = { x: 0, w: top.w, y: H - (stack.length + 1) * BRICK_H };
    dir = 1; speed = Math.min(2.2 + score * 0.12, 6);
  }
  function drawBrick(x, y, w, active) {
    ctx.drawImage(brickTile, 0, 0, Math.max(1, Math.min(200, w)), BRICK_H, x, y, w, BRICK_H - 3);
    if (active) { ctx.fillStyle = 'rgba(218,179,98,.35)'; ctx.fillRect(x, y, w, BRICK_H - 3); }
    ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeRect(x, y, w, BRICK_H - 3);
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    stack.forEach(function (b, i) { drawBrick(b.x, H - (i + 1) * BRICK_H, b.w); });
    if (playing) drawBrick(current.x, current.y, current.w, true);
    
    Engine.update(engine, 1000/60);
    debris.forEach(function(b) {
       ctx.save();
       ctx.translate(b.position.x, b.position.y);
       ctx.rotate(b.angle);
       drawBrick(-b.renderW/2, -BRICK_H/2, b.renderW, false);
       ctx.restore();
    });
  }
  function loop() {
    if (playing) {
      current.x += speed * dir;
      if (current.x + current.w >= W) { current.x = W - current.w; dir = -1; }
      if (current.x <= 0) { current.x = 0; dir = 1; }
    }
    draw(); raf = requestAnimationFrame(loop);
  }
  function drop() {
    if (!playing) return;
    var top = stack[stack.length - 1];
    var overlapL = Math.max(current.x, top.x);
    var overlapR = Math.min(current.x + current.w, top.x + top.w);
    var overlap = overlapR - overlapL;
    if (overlap <= 0) { gameOver(); return; }
    var prevTarget = nextMilestone();
    
    // Physics body for sliced off part
    var cutW = current.w - overlap;
    if (cutW > 0) {
       var dropX = (current.x < top.x) ? current.x + cutW/2 : current.x + current.w - cutW/2;
       var body = Bodies.rectangle(dropX, current.y + BRICK_H/2, cutW, BRICK_H, { restitution: 0.5, friction: 0.1 });
       body.renderW = cutW;
       World.add(world, body);
       debris.push(body);
    }
    
    stack.push({ x: overlapL, w: overlap });
    score++; scoreEl.textContent = bn(score); updateGoal(); beep(440 + score * 8, 0.1);
    if (score === prevTarget) { msgEl.textContent = bn(score) + ' টা ইট! দারুণ হাত আপনার।'; beep(880, 0.18); }
    if (stack.length * BRICK_H > H - BRICK_H * 3) stack.shift();
    spawn();
  }
  function gameOver() {
    playing = false; cancelAnimationFrame(raf);
    // Explode the tower with physics
    stack.forEach(function(b, i) {
      if(i === 0) return; // Keep base
      var body = Bodies.rectangle(b.x + b.w/2, H - (i+1)*BRICK_H + BRICK_H/2, b.w, BRICK_H, { restitution: 0.4 });
      Body.setVelocity(body, { x: (Math.random()-0.5)*8, y: -Math.random()*6 });
      Body.setAngularVelocity(body, (Math.random()-0.5)*0.3);
      body.renderW = b.w;
      World.add(world, body);
      debris.push(body);
    });
    stack = [stack[0]];
    loop(); // Keep physics running

    if (score > best) {
      best = score; localStorage.setItem('bhitti-best', best); bestEl.textContent = bn(best);
      msgEl.textContent = 'নতুন রেকর্ড! আপনার হাত তো দারুণ পাকা।';
      if (window.Bhitti) Bhitti.submitScore(null, best);
    } else {
      msgEl.textContent = 'টাওয়ার ধসে পড়লো! কোনো ব্যাপার না, আবার শুরু করুন।';
    }
    if (window.Bhitti) Bhitti.track('game_over', { score: score });
    beep(160, 0.3);
    startBtn.textContent = 'আবার খেলি'; draw();
  }
  function start() {
    reset(); spawn(); playing = true; startBtn.textContent = 'আবার খেলি';
    cancelAnimationFrame(raf); loop();
    if (window.Bhitti) Bhitti.track('game_start');
  }

  startBtn.addEventListener('click', start);
  canvas.addEventListener('click', drop);
  canvas.addEventListener('touchstart', function (e) { e.preventDefault(); drop(); }, { passive: false });
  window.addEventListener('keydown', function (e) { if (e.code === 'Space') { e.preventDefault(); if (playing) drop(); else start(); } });
  reset(); draw();
}

function showDynamicIsland(text) {
  var di = document.getElementById('dynamic-island');
  var dt = document.getElementById('di-text');
  if(!di || !dt) return;
  dt.textContent = text;
  di.classList.add('show');
  if(di.timeout) clearTimeout(di.timeout);
  di.timeout = setTimeout(function() { di.classList.remove('show'); }, 3500);
}

function initCartBrick3D() {
  var mount = document.getElementById('cart-brick-container');
  if (!mount || !window.THREE) return;
  mount.innerHTML = '';
  var w = mount.clientWidth || 300, h = mount.clientHeight || 180;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, w/h, 0.1, 100);
  camera.position.set(0, 0, 4);
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(w, h);
  mount.appendChild(renderer.domElement);
  var tex = makeBrickTextures();
  var mat = new THREE.MeshStandardMaterial({ map: tex.colorTex, bumpMap: tex.bumpTex, bumpScale: 0.03, roughnessMap: tex.roughTex, roughness: 1.0 });
  var brick = createAuthenticBrickGroup(mat);
  brick.scale.set(0.5, 0.5, 0.5);
  scene.add(brick);
  var key = new THREE.DirectionalLight(0xffefe0, 1.8); key.position.set(3, 4, 3); scene.add(key);
  var fill = new THREE.AmbientLight(0xffffff, 0.8); scene.add(fill);
  var clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    brick.rotation.y += 0.01;
    brick.rotation.x = Math.sin(clock.getElapsedTime()) * 0.1 + 0.2;
    renderer.render(scene, camera);
  })();
}

/* ===== Cart: Zeigarnik reminder + Labor-Illusion checkout ===== */
function initCart() {
  var PRICE = 126000;
  var buyBtn = document.getElementById('buy-btn');
  var navCart = document.getElementById('nav-cart');
  var countEl = document.getElementById('cart-count');
  var drawer = document.getElementById('cart-drawer');
  var overlay = document.getElementById('cart-overlay');
  var closeBtn = document.getElementById('cart-close');
  var bodyEl = document.getElementById('cart-body');
  var totalEl = document.getElementById('cart-total');
  var checkoutBtn = document.getElementById('checkout-btn');
  var stepsEl = document.getElementById('checkout-steps');
  if (!buyBtn || !drawer) return;

  var qty = +(localStorage.getItem('bhitti-cart') || 0);

  function group(n) { var s = String(n), o = '', c = 0; for (var i = s.length - 1; i >= 0; i--) { o = s[i] + o; if (++c % 3 === 0 && i > 0) o = ',' + o; } return o; }
  function money(n) { return bn(group(n)) + ' টাকা'; }
  function persist() { localStorage.setItem('bhitti-cart', qty); }
  function render() {
    countEl.textContent = bn(qty);
    if (qty === 0) {
      bodyEl.innerHTML = '<p class="cart-empty">আপনার কার্ট এখন খালি। একটা ইট কিনে শুরু করে দিন।</p>';
      totalEl.textContent = money(0);
      return;
    }
    bodyEl.innerHTML =
      '<div class="cart-item"><div>লাল ইট <small>খাঁটি × ' + bn(qty) + '</small></div>' +
      '<div>' + money(PRICE * qty) + ' <button id="cart-remove">সরান</button></div></div>';
    totalEl.textContent = money(PRICE * qty);
    var rm = document.getElementById('cart-remove');
    if (rm) rm.addEventListener('click', function () { qty = 0; persist(); render(); });
  }
  function openCart() {
    render(); overlay.hidden = false;
    requestAnimationFrame(function () { overlay.classList.add('show'); drawer.classList.add('open'); });
    drawer.setAttribute('aria-hidden', 'false');
  }
  function closeCart() {
    overlay.classList.remove('show'); drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    setTimeout(function () { overlay.hidden = true; }, 350);
  }
  function addOne() {
    qty++; persist(); render();
    navCart.classList.remove('bump'); void navCart.offsetWidth; navCart.classList.add('bump');
    showDynamicIsland('কার্টে ' + bn(qty) + 'টি ইট যোগ হয়েছে');
    if (window.Bhitti) Bhitti.track('add_to_cart', { qty: qty });
  }

  initCartBrick3D();

  buyBtn.addEventListener('click', function () {
    addOne();
    buyBtn.textContent = 'কার্টে যোগ হয়েছে ✓';
    setTimeout(function () { buyBtn.textContent = 'কার্টে যোগ করুন'; }, 1800);
    openCart();
  });
  navCart.addEventListener('click', openCart);
  closeBtn.addEventListener('click', closeCart);
  overlay.addEventListener('click', closeCart);
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });

  // Labor Illusion: visible "work" makes the checkout feel trustworthy.
  checkoutBtn.addEventListener('click', function () {
    if (qty === 0) { stepsEl.textContent = 'আগে অন্তত একটা ইট কার্টে রাখুন।'; return; }
    if (window.Bhitti) Bhitti.track('checkout_start', { qty: qty });
    checkoutBtn.disabled = true;
    var steps = ['একটা একটা করে ইট চেক করছি', 'গাড়িতে তোলার প্রস্তুতি নিচ্ছি', 'আপনার ঠিকানায় পাঠানোর ব্যবস্থা করছি', 'সবকিছু রেডি!'];
    stepsEl.innerHTML = steps.map(function (s, i) {
      return '<div class="step" data-i="' + i + '"><span class="spin"></span><span>' + s + '</span></div>';
    }).join('');
    var nodes = stepsEl.querySelectorAll('.step');
    var i = 0;
    (function run() {
      if (i > 0) { nodes[i - 1].classList.remove('active'); nodes[i - 1].classList.add('done'); nodes[i - 1].querySelector('.spin').textContent = '✓'; nodes[i - 1].querySelector('.spin').classList.remove('spin'); }
      if (i < nodes.length) {
        nodes[i].classList.add('active');
        i++; setTimeout(run, 850 + Math.random() * 500);
      } else {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = '✓ অর্ডার হয়ে গেছে';
        if (window.Bhitti) Bhitti.track('checkout_complete', { qty: qty });
      }
    })();
  });

  render();
  // Zeigarnik: if an item was left in the cart from a past visit, gently nudge.
  if (qty > 0) {
    setTimeout(function () {
      navCart.classList.add('bump');
      var t = document.getElementById('ticker');
      if (t) t.querySelector('span:last-child').innerHTML = 'আপনার কার্টে একটা ইট রয়ে গেছে | অর্ডারটা শেষ করুন';
    }, 2500);
  }
}

  // ============================================================
  // 12. initConsent — analytics opt-in
  // ============================================================
  // The site works fully without this. We never block UX on the banner.
  // The banner appears 1.5s after load, only if consent has not been recorded.
  // "অনুমতি দিন" flips Bhitti.consent and swaps track() to a real implementation.
  // "পরে" hides the banner without setting a preference — we'll ask again next visit.
  function initConsent () {
    var banner = document.getElementById('consent-banner');
    if (!banner) return;
    var ok = document.getElementById('consent-ok');
    var later = document.getElementById('consent-later');
    if (!ok || !later) return;

    var recorded = getItem('consent', null);
    if (recorded === true) { Bhitti.consent = true; enableTracking(); return; }
    if (recorded === false) { Bhitti.consent = false; return; }

    setTimeout(function () { banner.classList.add('show'); }, 1500);

    ok.addEventListener('click', function () {
      Bhitti.consent = true;
      setItem('consent', true);
      setItem('consent.ts', Date.now());
      enableTracking();
      banner.classList.remove('show');
    });
    later.addEventListener('click', function () {
      banner.classList.remove('show');
      // intentionally do NOT persist — we'll ask again next visit
    });

    function enableTracking () {
      Bhitti.track = function (name, payload) {
        if (!Bhitti.consent) return;
        var p = Object.assign({}, payload || {});
        p.name = name;
        p.sid = Bhitti.session.id;
        p.ts = Date.now();
        
        if (console && console.log) {
          console.log('%c[Bhitti Local Analytics]', 'color: #A43820; font-weight: bold;', name, p);
        }
        
        try {
          var events = JSON.parse(localStorage.getItem('bhitti-events') || '[]');
          events.push(p);
          if (events.length > 100) events.shift();
          localStorage.setItem('bhitti-events', JSON.stringify(events));
        } catch (e) {}
      };
    }
  }

  // ============================================================
  // 13. initZeigarnik — unfinished-task tension
  // ============================================================
  // Two complementary nudges:
  //  (a) Idle timer: if the user is idle for ~25s AND has items in the cart,
  //      surface a dynamic-island reminder (very small, non-blocking).
  //  (b) Exit-intent: on desktop, when the cursor leaves the viewport upward,
  //      open a soft modal offering a 5% discount to save the cart.
  // Both nudges are silent (no analytics) and respect prefers-reduced-motion.
  function initZeigarnik () {
    var IDLE_MS = 25000;
    var cartQty = 0;
    try {
      var c = JSON.parse((ls && ls.getItem(ns + 'cart')) || 'null');
      if (c && typeof c.qty === 'number') cartQty = c.qty;
    } catch (e) {}

    var idleTimer = null;
    function resetIdle () {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(function () {
        if (cartQty > 0 && typeof showDynamicIsland === 'function') {
          showDynamicIsland('আপনার কার্টে ' + bn(cartQty) + 'টি ইট অপেক্ষা করছে');
        }
      }, IDLE_MS);
    }
    ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, resetIdle, { passive: true });
    });
    resetIdle();

    // (b) Exit-intent — desktop only
    if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var modal = document.getElementById('exit-modal');
      if (!modal) return;
      var dismiss = document.getElementById('exit-dismiss');
      var accept = document.getElementById('exit-accept');
      var shown = false;
      document.addEventListener('mouseleave', function (e) {
        if (shown) return;
        if (e.clientY <= 0 && cartQty > 0) {
          shown = true;
          modal.classList.add('show');
          modal.setAttribute('aria-hidden', 'false');
        }
      });
      function close () {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
      }
      if (dismiss) dismiss.addEventListener('click', close);
      if (accept) accept.addEventListener('click', function () {
        setItem('discount.applied', 'bhitti5');
        close();
        if (typeof showDynamicIsland === 'function') {
          showDynamicIsland('৫% ছাড়! কোড: bhitti5');
        }
      });
    }
  }

  // ============================================================
  // 14. initGoalGradient — micro-progress on hero CTA
  // ============================================================
  // As the user hovers/focuses the primary CTA, a thin progress fill grows
  // from 0 → 100% over ~1.2s. This is a low-cost "investment" cue that
  // makes the click feel earned. Respects prefers-reduced-motion.
  function initGoalGradient () {
    if (prefersReduced) return;
    var cta = document.querySelector('.cta-primary');
    if (!cta) return;
    var fill = cta.querySelector('.cta-progress-fill');
    if (!fill) return;
    var t = null;
    function start () {
      if (t) return;
      var startTs = Date.now();
      t = setInterval(function () {
        var p = Math.min(1, (Date.now() - startTs) / 1200);
        fill.style.width = (p * 100) + '%';
        if (p >= 1) { clearInterval(t); t = null; }
      }, 30);
    }
    function stop () {
      if (t) { clearInterval(t); t = null; }
      fill.style.width = '0%';
    }
    cta.addEventListener('mouseenter', start);
    cta.addEventListener('mouseleave', stop);
    cta.addEventListener('focus', start);
    cta.addEventListener('blur', stop);
  }

  // ============================================================
  // 15. initErrorTracking — last-resort safety net
  // ============================================================
  // We don't ship an analytics sink for errors. This is a console-only
  // surface so we can debug issues during development. Production users
  // are not affected.
  function initErrorTracking () {
    window.addEventListener('error', function (e) {
      if (console && console.error) {
        console.error('[bhitti]', e.message, '@', e.filename + ':' + e.lineno);
      }
    });
    window.addEventListener('unhandledrejection', function (e) {
      if (console && console.error) {
        console.error('[bhitti] unhandled promise rejection:', e.reason);
      }
    });
  }
})(window, document);

