import { WORLD, platforms, createCat, stepCat, canRead } from './physics.js';
const $ = id => document.getElementById(id), canvas = $('game'), ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;
const cat = createCat(), input = { left: false, right: false, jump: false }, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let ready = false, paused = false, last = 0, elapsed = 0, speechUntil = 5, nextSpeech = 10, readReady = false, letterRead = false, soundOn = false, audio, frames = [], room, sprites, walkSound = 0;
const LETTER = { x: 746, y: 334 };
// Midnight in Peru (UTC-5), independent of the phone's selected time zone.
const LETTER_UNLOCK_AT = Date.parse('2026-09-28T00:00:00-05:00');
// Only this URL bypasses the date; nothing is saved on the device.
const manualUnlock = new URLSearchParams(location.search).get('llave') === 'frase-secreta';
const readLabel = $('read').innerHTML;
let letterUnlocked = null;
function isLetterUnlocked() { return manualUnlock || Date.now() >= LETTER_UNLOCK_AT }
function updateLetterAccess(near) {
    const unlocked = isLetterUnlocked(), changed = unlocked !== letterUnlocked;
    if (changed) {
        letterUnlocked = unlocked;
        $('read').disabled = !unlocked;
        $('read').innerHTML = unlocked ? readLabel : '28 de septiembre · 00:00 ♡';
        $('read').title = unlocked ? '' : 'La carta se abre el 28 de septiembre de 2026 a las 00:00, hora de Perú.';
    }
    if (near && (!readReady || changed)) {
        $('status').textContent = unlocked ? 'Estás junto a la carta. Pulsa E para leer.' : $('read').title;
    }
    readReady = near;
    $('read').hidden = !near;
}
// The world stays 960 × 640; portrait phones only change the camera window.
const portraitView = matchMedia('(max-width: 900px) and (orientation: portrait)');
const camera = { x: 0, width: WORLD.width };
function updateCamera(dt = 0, snap = false) {
    const bounds = canvas.getBoundingClientRect();
    const width = portraitView.matches ? Math.min(WORLD.width, WORLD.height * bounds.width / Math.max(1, bounds.height)) : WORLD.width;
    const resized = Math.abs(width - camera.width) > .01;
    camera.width = width;
    const target = Math.max(0, Math.min(WORLD.width - width, cat.x - width / 2));
    camera.x = snap || resized || reduced ? target : camera.x + (target - camera.x) * (1 - Math.exp(-12 * dt));
    camera.x = Math.max(0, Math.min(WORLD.width - width, camera.x));
    const pixels = Math.round(width);
    if (canvas.width !== pixels) {
        canvas.width = pixels;
        ctx.imageSmoothingEnabled = false;
    }
}
function positionOverlay(element, x, y) {
    if (portraitView.matches) {
        const bounds = canvas.getBoundingClientRect();
        const margin = Math.min(bounds.width / 2, element.offsetWidth / 2 + 8);
        const left = (x - camera.x) / camera.width * bounds.width;
        element.style.left = `${Math.max(margin, Math.min(bounds.width - margin, left))}px`;
    } else {
        element.style.left = `${element.id === 'speech' ? Math.max(16, Math.min(84, x / WORLD.width * 100)) : x / WORLD.width * 100}%`;
    }
    element.style.top = `${y / WORLD.height * 100}%`;
}
new ResizeObserver(() => {
    updateCamera(0, true);
    if (ready) draw();
}).observe($('room-frame'));
const thoughts = ['prrr…', '¿Estoy… soñando?', 'Tengo patitas… ♡', 'Ese brillo… ¿es para mí?']; let thoughtIndex = 0;
function nextThought() {
    if (letterRead && thoughtIndex % thoughts.length === thoughts.length - 1) thoughtIndex++;
    return thoughts[thoughtIndex++ % thoughts.length];
}
function say(text, duration = 3.8) { $('speech').textContent = text; speechUntil = elapsed + duration; $('speech').classList.add('visible') }
function clearControls() { input.left = false; input.right = false; input.jump = false }
function tone(freq = 440, duration = .12, volume = .025, type = 'sine') { if (!soundOn) return; try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const oscillator = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime; oscillator.type = type; oscillator.frequency.setValueAtTime(freq, t); oscillator.frequency.exponentialRampToValueAtTime(freq * .8, t + duration); gain.gain.setValueAtTime(volume, t); gain.gain.exponentialRampToValueAtTime(.001, t + duration); oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(t); oscillator.stop(t + duration) } catch { } }
function chime() { [523, 659, 784].forEach((n, i) => setTimeout(() => tone(n, .5, .025), i * 130)) }
$('sound').onclick = () => { soundOn = !soundOn; $('sound').setAttribute('aria-pressed', String(soundOn)); $('sound').setAttribute('aria-label', soundOn ? 'Desactivar sonido' : 'Activar sonido'); $('sound').style.color = soundOn ? '#ffd17f' : ''; chime() };
$('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen() } catch { say('Este sueño también cabe aquí.') } };
if (!document.fullscreenEnabled) $('fullscreen').hidden = true;
function loadImage(src) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error(src)); image.src = src }) }
function spriteFrames(img) { const off = document.createElement('canvas'); off.width = img.width; off.height = img.height; const c = off.getContext('2d', { willReadFrequently: true }); c.drawImage(img, 0, 0); const result = [], cw = img.width / 4, ch = img.height / 3; for (let row = 0; row < 3; row++)for (let col = 0; col < 4; col++) { const x = Math.round(col * cw), y = Math.round(row * ch), w = Math.floor(cw), h = Math.floor(ch), data = c.getImageData(x, y, w, h).data; let minX = w, minY = h, maxX = 0, maxY = 0; for (let yy = 0; yy < h; yy++)for (let xx = 0; xx < w; xx++)if (data[(yy * w + xx) * 4 + 3] > 100) { minX = Math.min(minX, xx); maxX = Math.max(maxX, xx); minY = Math.min(minY, yy); maxY = Math.max(maxY, yy) } result.push({ x: x + minX, y: y + minY, w: maxX - minX + 1, h: maxY - minY + 1 }) } return result }
function drawCat() { let frame; if (!cat.grounded) frame = cat.vy < -100 ? 9 : 10; else if (cat.landTime > 0) frame = 11; else if (cat.vx) frame = 4 + Math.floor(cat.walkTime * 9) % 4; else frame = Math.floor(elapsed * 2) % 4; const f = frames[frame]; if (!f) return; const scale = 69 / Math.max(...frames.map(a => a.w)); const dw = Math.round(f.w * scale), dh = Math.round(f.h * scale); ctx.save(); ctx.translate(Math.round(cat.x), Math.round(cat.y)); ctx.scale(cat.facing, 1); ctx.drawImage(sprites, f.x, f.y, f.w, f.h, -Math.round(dw / 2), -dh, dw, dh); ctx.restore(); ctx.fillStyle = '#fff0d0'; ctx.font = '12px "Pixelify Sans",monospace'; ctx.textAlign = 'center'; ctx.shadowColor = '#322139'; ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 2; ctx.fillText('Belén', Math.round(cat.x), Math.round(cat.y + 17)); ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0 }
function drawLetter() { const x = LETTER.x, y = LETTER.y - 15; const pulse = reduced ? 1 : .8 + Math.sin(elapsed * 2) * .2; const g = ctx.createRadialGradient(x, y, 2, x, y, 43); g.addColorStop(0, `rgba(255,224,146,${.44 * pulse})`); g.addColorStop(1, 'rgba(255,210,123,0)'); ctx.fillStyle = g; ctx.fillRect(x - 45, y - 45, 90, 90); ctx.save(); ctx.translate(x, Math.round(y + (reduced ? 0 : Math.sin(elapsed * 2) * 2))); ctx.shadowBlur = 12; ctx.shadowColor = '#ffe3a0'; ctx.fillStyle = '#694052'; ctx.fillRect(-17, -10, 34, 23); ctx.shadowBlur = 0; ctx.fillStyle = '#ffe9bb'; ctx.fillRect(-15, -8, 30, 18); ctx.strokeStyle = '#bb846a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(0, 3); ctx.lineTo(14, -7); ctx.stroke(); ctx.fillStyle = '#b76273'; ctx.fillRect(-3, 0, 6, 5); ctx.restore(); for (let i = 0; i < 4; i++) { const a = elapsed * .7 + i * 1.6, px = x + Math.cos(a) * 30, py = y - 15 + Math.sin(a) * 24; ctx.fillStyle = `rgba(255,230,160,${.4 + Math.sin(elapsed * 2 + i) * .3})`; ctx.fillRect(Math.round(px), Math.round(py), 3, 3) } }
function draw() { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save(); ctx.scale(canvas.width / camera.width, 1); ctx.translate(-camera.x, 0); ctx.drawImage(room, 0, 0, WORLD.width, WORLD.height); if (!reduced) { for (let i = 0; i < 22; i++) { const x = (i * 127 + elapsed * (2 + i % 3)) % WORLD.width, y = (i * 83 + Math.sin(elapsed * .3 + i) * 12) % 480; ctx.fillStyle = `rgba(255,231,175,${.12 + (Math.sin(elapsed + i) + 1) * .12})`; ctx.fillRect(Math.round(x), Math.round(y), i % 3 === 0 ? 2 : 1, 2) } } drawLetter(); ctx.fillStyle = '#39243f30'; ctx.beginPath(); ctx.ellipse(cat.x, cat.grounded ? cat.y + 2 : WORLD.floor + 2, 22, 4, 0, 0, Math.PI * 2); ctx.fill(); drawCat(); ctx.restore(); positionOverlay($('speech'), cat.x, cat.y - 72); $('speech').classList.toggle('visible', elapsed < speechUntil); positionOverlay($('read'), LETTER.x, LETTER.y - 75) }
function tick(now) { const dt = Math.min((now - last) / 1000 || 0, .025); last = now; if (ready && !paused) { elapsed += dt; const wasGrounded = cat.grounded; stepCat(cat, input, dt); input.jump = false; if (wasGrounded && !cat.grounded && cat.vy < 0) tone(500, .16, .015, 'triangle'); if (!wasGrounded && cat.grounded) tone(110, .08, .025, 'triangle'); if (cat.grounded && cat.vx && elapsed - walkSound > .2) { tone(160 + Math.random() * 40, .035, .008, 'triangle'); walkSound = elapsed } updateLetterAccess(canRead(cat)); if (elapsed > nextSpeech) { say(nextThought()); nextSpeech = elapsed + 10 + Math.random() * 6 } if (elapsed > 8) $('goal').classList.add('quiet'); updateCamera(dt); draw() } requestAnimationFrame(tick) }
function activeDialog() { return $('letter-modal').open }
window.addEventListener('keydown', e => { if (activeDialog()) return; const key = e.key.toLowerCase(); if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w', 'e'].includes(key)) e.preventDefault(); if (key === 'arrowleft' || key === 'a') input.left = true; if (key === 'arrowright' || key === 'd') input.right = true; if ([' ', 'arrowup', 'w'].includes(key) && !e.repeat) input.jump = true; if (key === 'e' && !e.repeat && readReady) openLetter() }); window.addEventListener('keyup', e => { const key = e.key.toLowerCase(); if (key === 'arrowleft' || key === 'a') input.left = false; if (key === 'arrowright' || key === 'd') input.right = false }); window.addEventListener('blur', clearControls); document.addEventListener('visibilitychange', () => { clearControls(); last = performance.now() });
for (const button of document.querySelectorAll('[data-control]')) { const key = button.dataset.control; button.addEventListener('pointerdown', e => { e.preventDefault(); button.setPointerCapture(e.pointerId); input[key] = true }); const release = () => { input[key] = false }; button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release) }
function pause() { paused = true; clearControls() }
function resume() { paused = false; last = performance.now(); canvas.focus({ preventScroll: true }) }
function openLetter() { if (!isLetterUnlocked()) return; pause(); $('letter-modal').showModal(); $('letter-modal').scrollTop = 0; letterRead = true; speechUntil = elapsed; $('speech').classList.remove('visible'); chime() }
$('read').onclick = openLetter;
$('close-letter').onclick = () => $('letter-modal').close();
$('letter-modal').addEventListener('close', resume);
Promise.all([loadImage('room.png'), loadImage('belen-sprites.png')]).then(([r, s]) => { room = r; sprites = s; frames = spriteFrames(s); ready = true; $('loading').hidden = true; say('¿Estoy… soñando?', 5); requestAnimationFrame(tick) }).catch(() => { $('loading').innerHTML = '<span>☾</span>No pudimos abrir el sueño.<button class="pixel-button" id="retry">Volver a intentar</button>'; $('retry').onclick = () => location.reload() });
