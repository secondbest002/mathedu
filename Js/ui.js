// --- DOM ELEMENTS ---
let svg, gridLayer, charLayer, effectsLayer, stageContainer, feedbackEl;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    svg = document.getElementById('game-svg');
    gridLayer = document.getElementById('grid-layer');
    charLayer = document.getElementById('character-layer');
    effectsLayer = document.getElementById('effects-layer');
    stageContainer = document.getElementById('stage-container');
    feedbackEl = document.getElementById('feedback-text');

    setupSVG();
    drawNumberLine();
    drawCharacter(0, 1);
    
    stageContainer.addEventListener('click', handleStageClick);
    
    setTimeout(() => centerViewOn(0, false), 100);

    if (!localStorage.getItem('tutorial_seen')) {
        setTimeout(showOnboarding, 1000);
    }
});

// --- ONBOARDING SYSTEM (INDONESIAN) ---
function showOnboarding() {
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.className = 'absolute inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-500';
    overlay.innerHTML = `
        <div class="bg-white p-8 rounded-xl max-w-md text-center shadow-2xl border-2 border-orange-500 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
            <h3 class="text-2xl font-bold text-slate-800 mb-4 font-mono">SELAMAT DATANG, INSINYUR</h3>
            <p class="text-slate-600 mb-6">Ini adalah Logic Core. Gunakan panel kontrol untuk memasukkan vektor dan amati perilaku drone.</p>
            <div class="flex justify-center gap-4 text-left text-sm bg-slate-50 p-4 rounded mb-6 border border-slate-200">
                <div>
                    <strong class="text-blue-600 block mb-1">1. INPUT</strong>
                    Atur Nilai A & B
                </div>
                <div>
                    <strong class="text-indigo-600 block mb-1">2. OPERASI</strong>
                    Pilih (+ - × ÷)
                </div>
                <div>
                    <strong class="text-slate-800 block mb-1">3. EKSEKUSI</strong>
                    Lihat jalur logika
                </div>
            </div>
            <button onclick="closeOnboarding(); audioManager.playClick()" class="btn-engineer px-8 py-3 rounded text-lg w-full">INISIALISASI_</button>
        </div>
    `;
    document.body.appendChild(overlay);
}

window.closeOnboarding = function() {
    const ov = document.getElementById('tutorial-overlay');
    if (ov) {
        ov.style.opacity = '0';
        setTimeout(() => ov.remove(), 500);
    }
    localStorage.setItem('tutorial_seen', 'true');
    const controls = document.getElementById('controls-sandbox');
    if (controls) {
        controls.classList.add('ring-4', 'ring-orange-400', 'transition-all');
        setTimeout(() => controls.classList.remove('ring-4', 'ring-orange-400'), 1000);
    }
}

// --- VISUAL ENGINE ---
function setupSVG() {
    const totalUnits = CONFIG.maxVal - CONFIG.minVal + 10;
    const width = totalUnits * CONFIG.stepSize;
    svg.style.width = `${width}px`;
}

function getXForValue(val) {
    return (val - CONFIG.minVal + 5) * CONFIG.stepSize;
}

function drawNumberLine() {
    let html = '';
    const startX = getXForValue(CONFIG.minVal);
    const endX = getXForValue(CONFIG.maxVal);
    html += `<line x1="${startX}" y1="${CONFIG.axisY}" x2="${endX}" y2="${CONFIG.axisY}" stroke="#1E293B" stroke-width="3" stroke-linecap="square" />`;

    for (let i = CONFIG.minVal; i <= CONFIG.maxVal; i++) {
        const x = getXForValue(i);
        const isZero = i === 0;
        const color = isZero ? '#F97316' : '#94A3B8'; 
        const tickH = isZero ? 30 : 15;
        const strokeW = isZero ? 3 : 2;
        const textSize = isZero ? 18 : 14;
        const textFill = isZero ? '#0F172A' : '#64748B';
        const fontWeight = isZero ? 'bold' : 'normal';

        html += `<line x1="${x}" y1="${CONFIG.axisY - tickH}" x2="${x}" y2="${CONFIG.axisY + tickH}" stroke="${color}" stroke-width="${strokeW}" />`;
        html += `<text x="${x}" y="${CONFIG.axisY + 40}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="${textSize}" font-weight="${fontWeight}" fill="${textFill}" style="pointer-events: none; user-select: none;">${i}</text>`;
    }
    gridLayer.innerHTML = html;
}

function drawCharacter(pos, facing, isJump = false, jumpY = 0, isGhost = false) {
    const x = getXForValue(pos);
    const y = CONFIG.axisY - 50 - jumpY;
    const transform = `translate(${x}, ${y}) scale(${facing}, 1)`;
    const opacity = isGhost ? 0.4 : 1;
    const bodyColor = isGhost ? '#DBEAFE' : '#FFFFFF';
    const strokeColor = isGhost ? '#3B82F6' : '#0F172A';
    const lensColor = isGhost ? '#60A5FA' : '#F97316';
    const filter = isGhost ? 'grayscale(0.5)' : 'none';

    const droneSVG = `
        <g transform="${transform}" opacity="${opacity}" style="filter: ${filter}">
            ${!isGhost ? `<ellipse cx="0" cy="50" rx="20" ry="4" fill="#000" opacity="0.1" />` : ''}
            <line x1="0" y1="20" x2="0" y2="50" stroke="${strokeColor}" stroke-width="2" stroke-dasharray="2 2" />
            <circle cx="0" cy="50" r="4" fill="${strokeColor}" />
            <rect x="-25" y="-15" width="50" height="30" rx="6" fill="${bodyColor}" stroke="${strokeColor}" stroke-width="2"/>
            <line x1="-15" y1="-15" x2="-15" y2="15" stroke="#CBD5E1" stroke-width="1"/>
            <line x1="-5" y1="-15" x2="-5" y2="15" stroke="#CBD5E1" stroke-width="1"/>
            <path d="M 25 -8 L 32 0 L 25 8 Z" fill="${strokeColor}" />
            <circle cx="15" cy="0" r="8" fill="${strokeColor}" />
            <circle cx="15" cy="0" r="5" fill="${lensColor}" />
            <circle cx="16" cy="-2" r="2" fill="white" opacity="0.8" />
            <line x1="0" y1="-15" x2="0" y2="-25" stroke="${strokeColor}" stroke-width="2"/>
            <circle cx="0" cy="-25" r="3" fill="${state.isAnimating ? '#10B981' : '#CBD5E1'}" class="${state.isAnimating && !isGhost ? 'animate-pulse' : ''}"/>
            ${isGhost ? `<text x="0" y="-35" text-anchor="middle" font-size="10" fill="${strokeColor}" font-weight="bold">JALUR BENAR</text>` : ''}
        </g>
    `;
    
    if (isGhost) {
        let ghostG = document.getElementById('ghost-group');
        if (!ghostG) {
            ghostG = document.createElementNS("http://www.w3.org/2000/svg", "g");
            ghostG.id = 'ghost-group';
            charLayer.appendChild(ghostG);
        }
        ghostG.innerHTML = droneSVG;
    } else {
        let mainG = document.getElementById('main-char-group');
        if (!mainG) {
            mainG = document.createElementNS("http://www.w3.org/2000/svg", "g");
            mainG.id = 'main-char-group';
            charLayer.appendChild(mainG);
        }
        mainG.innerHTML = droneSVG;
    }
}

function centerViewOn(val, smooth = true) {
    const x = getXForValue(val);
    const containerWidth = stageContainer.clientWidth;
    const scrollPos = x - (containerWidth / 2);
    stageContainer.scrollTo({
        left: scrollPos,
        behavior: smooth ? 'smooth' : 'auto'
    });
}

function showFeedback(text, type = 'neutral') {
    feedbackEl.innerText = `>> ${text}`;
    feedbackEl.style.opacity = '1';
    feedbackEl.style.transform = 'translateY(0)';

    if (type === 'error') {
        feedbackEl.style.borderLeftColor = '#DC2626'; 
        feedbackEl.style.backgroundColor = '#1E293B';
    } else if (type === 'success') {
        feedbackEl.style.borderLeftColor = '#10B981';
        feedbackEl.style.backgroundColor = '#1E293B';
    } else if (type === 'ghost') {
        feedbackEl.style.borderLeftColor = '#3B82F6';
        feedbackEl.style.backgroundColor = '#EFF6FF'; 
        feedbackEl.style.color = '#1E3A8A';
    } else {
        feedbackEl.style.borderLeftColor = '#F97316'; 
        feedbackEl.style.backgroundColor = '#1E293B';
        feedbackEl.style.color = 'white';
    }
}

function typeWriter(element, text, i = 0) {
    if (i === 0) element.innerHTML = "";
    if (i < text.length) {
        element.innerHTML += text.charAt(i);
        setTimeout(() => typeWriter(element, text, i + 1), 15);
    }
}

// --- NAVIGATION & GAME MODES ---
window.navTo = function(pageId) {
    document.querySelectorAll('.page-section').forEach(el => {
        el.classList.remove('active');
    });
    setTimeout(() => {
        document.getElementById(pageId).classList.add('active');
        if (pageId === 'page-app' && !localStorage.getItem('tutorial_seen')) {
            setTimeout(showOnboarding, 500);
        }
    }, 100);
}

window.validateInput = function(input) {
    let val = parseInt(input.value);
    if (val > 12) input.value = 12;
    if (val < -12) input.value = -12;
}

window.updateOpVisual = function() { }

window.startExploreMode = function(subMode) {
    state.mode = 'sandbox';
    state.subMode = subMode;
    const select = document.getElementById('input-op');
    select.innerHTML = '';
    if (subMode === 'basic') {
        select.innerHTML = `<option value="add">TAMBAH (+)</option><option value="subtract">KURANG (-)</option>`;
    } else {
        select.innerHTML = `<option value="multiply">KALI (×)</option><option value="divide">BAGI (÷)</option>`;
    }
    document.getElementById('system-mode-label').innerText = "MODE: EKSPLORASI";
    document.getElementById('controls-sandbox').classList.remove('hidden');
    document.getElementById('controls-challenge').classList.add('hidden');
    document.getElementById('streak-container').classList.add('hidden');
    document.getElementById('challenge-story').classList.add('hidden');
    resetCharacter();
    window.navTo('page-app');
}

window.startQuizMode = function() {
    state.mode = 'challenge';
    document.getElementById('system-mode-label').innerText = "MODE: KOMPETENSI";
    document.getElementById('controls-sandbox').classList.add('hidden');
    document.getElementById('controls-challenge').classList.remove('hidden');
    document.getElementById('challenge-story').classList.add('hidden');
    document.getElementById('streak-container').classList.remove('hidden');
    resetCharacter();
    generateChallenge();
    window.navTo('page-app');
}

function resetCharacter(isGhost = false) {
    if (!isGhost) {
        state.charPos = 0;
        state.charFacing = 1;
        state.isGhostMode = false;
        const ghostG = document.getElementById('ghost-group');
        if (ghostG) ghostG.innerHTML = '';
        drawCharacter(0, 1);
        centerViewOn(0);
        effectsLayer.innerHTML = '';
        showFeedback("Unit Terinisialisasi.");
        window.closeAiTerminal();
    } else {
        const ghostG = document.getElementById('ghost-group');
        if (ghostG) ghostG.innerHTML = '';
        drawCharacter(0, 1, false, 0, true);
    }
}

function generateChallenge() {
    const a = Math.floor(Math.random() * 9) * (Math.random() > 0.5 ? 1 : -1);
    const b = Math.floor(Math.random() * 9) * (Math.random() > 0.5 ? 1 : -1);
    const ops = ['+', '-', '×'];
    const opSym = ops[Math.floor(Math.random() * 3)];
    let res;
    if (opSym === '+') res = a + b;
    if (opSym === '-') res = a - b;
    if (opSym === '×') {
        const smallA = Math.max(-5, Math.min(5, a));
        const smallB = Math.max(-4, Math.min(4, b));
        res = smallA * smallB;
        state.challengeData = { a: smallA, b: smallB, op: opSym, target: res };
        document.getElementById('challenge-question').innerText = `${smallA < 0 ? '(' + smallA + ')' : smallA} ${opSym} ${smallB < 0 ? '(' + smallB + ')' : smallB}`;
        return;
    }
    state.challengeData = { a, b, op: opSym, target: res };
    document.getElementById('challenge-question').innerText = `${a < 0 ? '(' + a + ')' : a} ${opSym} ${b < 0 ? '(' + b + ')' : b}`;
    showFeedback("Target Baru Terkunci. Pilih pada grid.", "neutral");
    document.getElementById('btn-check').disabled = true;
    state.userFlagPos = null;
}

window.generateAiMission = async function() {
    const storyEl = document.getElementById('challenge-story');
    const qEl = document.getElementById('challenge-question');
    storyEl.classList.remove('hidden');
    storyEl.innerHTML = `<span class="animate-pulse">Memuat parameter...</span>`;
    qEl.innerText = "...";
    setTimeout(() => {
        const a = Math.floor(Math.random() * 9) * (Math.random() > 0.5 ? 1 : -1);
        const b = Math.floor(Math.random() * 9) * (Math.random() > 0.5 ? 1 : -1);
        const ops = ['+', '-'];
        const opSym = ops[Math.floor(Math.random() * 2)];
        const story = generateLocalMission(a, b, opSym);
        let res = opSym === '+' ? a + b : a - b;
        state.challengeData = { a, b, op: opSym, target: res };
        storyEl.innerText = `// ${story}`;
        qEl.innerText = `${a < 0 ? '(' + a + ')' : a} ${opSym} ${b < 0 ? '(' + b + ')' : b}`;
        showFeedback("Misi Dimuat. Menunggu Input.", "neutral");
        document.getElementById('btn-check').disabled = true;
        state.userFlagPos = null;
    }, 500);
}

function handleStageClick(e) {
    if (state.mode !== 'challenge' || state.isAnimating) return;
    if (e.target.closest('svg')) {
        const clickX = e.offsetX;
        const val = Math.round((clickX / CONFIG.stepSize) - 5 + CONFIG.minVal);
        state.userFlagPos = val;
        
        // Trigger Click Sound
        if(window.audioManager) audioManager.playClick();

        const fx = getXForValue(val);
        effectsLayer.innerHTML = `
            <g transform="translate(${fx}, ${CONFIG.axisY})">
                <line x1="0" y1="0" x2="0" y2="-40" stroke="#F97316" stroke-width="2"/>
                <circle cx="0" cy="-40" r="4" fill="#F97316"/>
                <rect x="0" y="-40" width="20" height="12" fill="#F97316" opacity="0.8"/>
                <circle cx="0" cy="0" r="4" fill="#fff" stroke="#F97316" stroke-width="2"/>
            </g>
        `;
        document.getElementById('btn-check').disabled = false;
        showFeedback(`Koordinat Dipilih: ${val}`, 'neutral');
    }
}

window.checkChallenge = function() {
    if (state.userFlagPos === null) return;
    const correct = state.challengeData.target;
    const { a, b, op } = state.challengeData;

    if (state.userFlagPos === correct) {
        showFeedback("CEK TOLERANSI: LULUS. EKSEKUSI VISUAL.", "success");
        if(window.audioManager) audioManager.playSuccess();
        createConfetti(getXForValue(correct));
        state.streak++;
        updateStreakDisplay();
        setTimeout(() => {
            window.queueOperationAnimation(a, b, op);
        }, 1000);
    } else {
        showFeedback(`GAGAL. TARGET: ${correct}. REPLAY GHOST DIMULAI.`, "error");
        if(window.audioManager) audioManager.playError();
        state.streak = 0;
        updateStreakDisplay();
        state.challengeData.triggerGhost = true;
        setTimeout(() => {
             state.challengeData.triggerGhost = false; 
             window.startGhostReplay();
        }, 1500);
    }
}

function updateStreakDisplay() {
    const el = document.getElementById('streak-count');
    if(el) el.innerText = state.streak;
}

window.askAiExplain = async function() {
    const a = document.getElementById('input-a').value;
    const b = document.getElementById('input-b').value;
    const op = document.getElementById('input-op').value;
    const term = document.getElementById('ai-terminal');
    const out = document.getElementById('ai-output');
    term.classList.remove('hidden');
    out.innerHTML = `<span class="animate-pulse">Menghitung...</span>`;
    setTimeout(() => {
        const explanation = generateLocalExplanation(a, b, op);
        typeWriter(out, explanation);
    }, 600);
}
window.closeAiTerminal = function() { document.getElementById('ai-terminal').classList.add('hidden'); }
window.createConfetti = function(x) {
    let html = '';
    for (let i = 0; i < 20; i++) {
        const dx = (Math.random() - 0.5) * 80;
        const dy = (Math.random() - 1) * 80;
        const color = ['#10B981', '#F97316', '#0F172A'][Math.floor(Math.random() * 3)];
        html += `<rect x="${dx}" y="${dy}" width="4" height="4" fill="${color}" class="animate-ping" style="animation-duration: ${0.4 + Math.random()}s" />`;
    }
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("transform", `translate(${x}, ${CONFIG.axisY - 50})`);
    group.innerHTML = html;
    document.getElementById('effects-layer').appendChild(group);
}