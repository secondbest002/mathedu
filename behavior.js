// --- CONFIG & STATE ---
const CONFIG = { minVal: -15, maxVal: 15, stepSize: 60, axisY: 250 };
let state = { 
    mode: 'sandbox', 
    charPos: 0, 
    charFacing: 1, // 1 = Right, -1 = Left
    isAnimating: false,
    challengeData: null,
    streak: 0
};

// --- INITIALIZATION ---
window.onload = function() { init(); };

function init() {
    setupSVG();
    drawNumberLine();
    drawCharacter(0, 1);
    centerViewOn(0, false);
}

// --- THEME & UI ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    const isDark = body.getAttribute('data-theme') === 'dark';
    if (isDark) { body.removeAttribute('data-theme'); icon.className = 'fa-solid fa-moon text-xl'; }
    else { body.setAttribute('data-theme', 'dark'); icon.className = 'fa-solid fa-sun text-xl text-yellow-400'; }
}

function navTo(pageId) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    setTimeout(() => document.getElementById(pageId).classList.add('active'), 100);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function showFeedback(text, type='neutral') {
    const el = document.getElementById('feedback-text');
    el.innerText = text;
    el.style.opacity = 1; el.style.transform = 'translateY(0)';
    el.style.backgroundColor = type === 'error' ? 'var(--accent-red)' : 'var(--accent-primary)';
    setTimeout(() => el.style.opacity = 0, 3000);
}

// --- VISUAL ENGINE ---
function setupSVG() {
    const totalUnits = CONFIG.maxVal - CONFIG.minVal + 8;
    document.getElementById('game-svg').style.width = `${totalUnits * CONFIG.stepSize}px`;
}
function getXForValue(val) { return (val - CONFIG.minVal + 4) * CONFIG.stepSize; }

function drawNumberLine() {
    let html = `<line x1="0" y1="${CONFIG.axisY}" x2="5000" y2="${CONFIG.axisY}" stroke="var(--text-main)" stroke-width="2" />`;
    for (let i = CONFIG.minVal; i <= CONFIG.maxVal; i++) {
        const x = getXForValue(i);
        const isZero = i === 0;
        const color = isZero ? 'var(--accent-orange)' : 'var(--text-muted)';
        const h = isZero ? 20 : 10;
        html += `<line x1="${x}" y1="${CONFIG.axisY - h}" x2="${x}" y2="${CONFIG.axisY + h}" stroke="${color}" stroke-width="2" />`;
        html += `<text x="${x}" y="${CONFIG.axisY + 40}" text-anchor="middle" font-family="JetBrains Mono" font-size="14" font-weight="${isZero?'bold':'normal'}" fill="${color}">${i}</text>`;
    }
    document.getElementById('grid-layer').innerHTML = html;
}

function drawCharacter(pos, facing) {
    const x = getXForValue(pos);
    const y = CONFIG.axisY - 45;
    // Robot with clearer EYE indicator for facing
    const svgContent = `
        <g transform="translate(${x}, ${y}) scale(${facing}, 1)">
            <line x1="0" y1="0" x2="0" y2="45" stroke="var(--text-main)" stroke-width="2" stroke-dasharray="4 2"/>
            <circle cx="0" cy="45" r="4" fill="var(--text-main)" />
            <rect x="-20" y="-20" width="40" height="30" rx="8" fill="var(--bg-body)" stroke="var(--text-main)" stroke-width="2"/>
            <rect x="-12" y="-12" width="24" height="14" rx="2" fill="var(--panel-bg)" stroke="var(--panel-border)" />
            <!-- EYE INDICATOR (Important for Lecture Logic) -->
            <path d="M 15 -5 L 28 0 L 15 5 Z" fill="var(--accent-orange)" />
            <circle cx="15" cy="-5" r="3" fill="var(--accent-green)" class="animate-pulse" />
        </g>
    `;
    document.getElementById('character-layer').innerHTML = svgContent;
}

function centerViewOn(val, smooth = true) {
    const x = getXForValue(val);
    const container = document.getElementById('stage-container');
    container.scrollTo({ left: x - container.clientWidth / 2, behavior: smooth ? 'smooth' : 'auto' });
}

// --- LOGIC ENGINE (THE LECTURER PROTOCOL) ---
function startExploreMode(subMode) {
    state.mode = 'sandbox';
    const select = document.getElementById('input-op');
    select.innerHTML = subMode === 'basic' 
        ? `<option value="add">TAMBAH (+)</option><option value="sub">KURANG (-)</option>`
        : `<option value="mul">KALI (×)</option><option value="div">BAGI (÷)</option>`;
    
    document.getElementById('system-mode-label').innerText = "MODE EKSPLORASI";
    document.getElementById('controls-sandbox').classList.remove('hidden');
    navTo('page-app');
    init();
}

// THE CORE LOGIC: REWRITTEN FOR DUAL-STEP ANIMATION
async function runSandbox() {
    if(state.isAnimating) return;
    state.isAnimating = true;

    const a = parseInt(document.getElementById('input-a').value);
    const b = parseInt(document.getElementById('input-b').value);
    const op = document.getElementById('input-op').value;

    // STEP 1: Process First Number (A)
    // Rule: Sign determines Facing. Move forward.
    const faceA = a >= 0 ? 1 : -1;
    const dirAText = a >= 0 ? "Positif (Kanan)" : "Negatif (Kiri)";
    
    // Reset to 0 first
    drawCharacter(0, 1);
    centerViewOn(0);
    await delay(500);

    showFeedback(`Nilai A (${a}): Hadap ${dirAText}`);
    drawCharacter(0, faceA); // Just Flip
    await delay(800);

    showFeedback(`Maju ${Math.abs(a)} langkah`);
    await animateMove(0, a, faceA); // Move to A
    await delay(500);

    // STEP 2: Process Operation & Second Number
    if (op === 'add' || op === 'sub') {
        const faceB = b >= 0 ? 1 : -1; 
        const dirBText = b >= 0 ? "Positif (Kanan)" : "Negatif (Kiri)";
        
        // 2a. Face according to B's sign (Lecturer Rule: Sign = Facing)
        showFeedback(`Nilai B (${b}): Hadap ${dirBText}`);
        drawCharacter(a, faceB); // Flip at current pos
        state.charFacing = faceB;
        await delay(1000);

        // 2b. Move according to Op (Lecturer Rule: Op = Direction)
        const moveDir = op === 'add' ? 1 : -1; // 1=Forward, -1=Backward
        const opText = op === 'add' ? "TAMBAH: Maju" : "KURANG: Mundur";
        
        // Calculate Target
        // Logic: if facing Right (1) and Add (Maju), x increases. 
        // If facing Left (-1) and Add (Maju), x decreases (technically moves 'forward' relative to robot).
        // Target = Current + (Facing * MoveDir * Distance)
        const distance = Math.abs(b);
        const target = a + (faceB * moveDir * distance);
        
        showFeedback(`${opText} ${distance} langkah`);
        await animateMove(a, target, faceB);
        
        showFeedback(`Posisi Akhir: ${target}`, 'success');
    }
    
    state.isAnimating = false;
}

// Animation Helper
function animateMove(from, to, facing) {
    return new Promise(resolve => {
        const duration = 1000;
        const start = performance.now();
        function loop(time) {
            const p = Math.min((time - start) / duration, 1);
            const cur = from + (to - from) * p;
            drawCharacter(cur, facing);
            centerViewOn(cur);
            if(p < 1) requestAnimationFrame(loop);
            else resolve();
        }
        requestAnimationFrame(loop);
    });
}

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
function playClick() { /* Audio Placeholder */ }