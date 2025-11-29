// --- ANIMATION QUEUE SYSTEM ---
class AnimationQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    add(action) {
        this.queue.push(action);
        if (!this.isProcessing) this.processNext();
    }

    processNext() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            state.isAnimating = false;
            if (state.challengeData && state.challengeData.triggerGhost) {
                 state.challengeData.triggerGhost = false;
                 setTimeout(() => startGhostReplay(), 1000);
            }
            return;
        }
        this.isProcessing = true;
        state.isAnimating = true;
        const action = this.queue.shift();
        const isGhost = action.isGhost || false;

        if (action.type === 'WALK') this.animWalk(action, isGhost);
        else if (action.type === 'FLIP') this.animFlip(action, isGhost);
        else if (action.type === 'JUMP') this.animJump(action, isGhost);
        else if (action.type === 'DELAY') {
            showFeedback(action.msg, isGhost ? 'ghost' : 'neutral');
            setTimeout(() => this.processNext(), action.duration);
        }
        else if (action.type === 'RESET') {
            resetCharacter(isGhost);
            setTimeout(() => this.processNext(), 500);
        }
    }

    animWalk(a, isGhost) {
        showFeedback(a.msg, isGhost ? 'ghost' : 'neutral');
        if(!isGhost) state.charFacing = a.facing;
        const duration = Math.abs(a.to - a.from) * 400;
        const startTime = performance.now();
        let lastAudioTime = 0;

        const loop = (time) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const cur = a.from + (a.to - a.from) * progress;
            
            // Audio Trigger (Step SFX throttled)
            if (window.audioManager && time - lastAudioTime > 300) {
                audioManager.playStep();
                lastAudioTime = time;
            }

            drawCharacter(cur, a.facing, false, 0, isGhost);
            centerViewOn(cur); 

            if (progress < 1) requestAnimationFrame(loop);
            else {
                if(!isGhost) state.charPos = a.to;
                this.processNext();
            }
        };
        requestAnimationFrame(loop);
    }

    animFlip(a, isGhost) {
        showFeedback(a.msg, isGhost ? 'ghost' : 'neutral');
        if(window.audioManager) audioManager.playSlide();
        
        const duration = 500;
        const startTime = performance.now();
        const startPos = isGhost ? a.atPos : state.charPos;

        const loop = (time) => {
            const progress = Math.min((time - startTime) / duration, 1);
            let scale = a.fromFacing * (1 - progress * 2);
            if (progress >= 0.5) scale = a.toFacing * ((progress - 0.5) * 2);

            drawCharacter(startPos, scale, false, 0, isGhost);

            if (progress < 1) requestAnimationFrame(loop);
            else {
                if(!isGhost) state.charFacing = a.toFacing;
                drawCharacter(startPos, a.toFacing, false, 0, isGhost);
                this.processNext();
            }
        };
        requestAnimationFrame(loop);
    }

    animJump(a, isGhost) {
        showFeedback(a.msg, isGhost ? 'ghost' : 'neutral');
        if(window.audioManager) audioManager.playSlide();
        if(!isGhost) state.charFacing = a.facing;
        
        const duration = 800;
        const startTime = performance.now();

        const loop = (time) => {
            const progress = Math.min((time - startTime) / duration, 1);
            const jumpY = 4 * 100 * progress * (1 - progress);
            const cur = a.from + (a.to - a.from) * progress;

            drawCharacter(cur, a.facing, true, jumpY, isGhost);
            centerViewOn(cur);

            if (progress < 1) requestAnimationFrame(loop);
            else {
                if(!isGhost) state.charPos = a.to;
                drawCharacter(a.to, a.facing, false, 0, isGhost);
                this.processNext();
            }
        };
        requestAnimationFrame(loop);
    }
}

const animator = new AnimationQueue();

window.startGhostReplay = function() {
    state.isGhostMode = true;
    const { a, b, op } = state.challengeData;
    showFeedback("KOREKSI SISTEM... MENJALANKAN GHOST PROTOCOL", "ghost");
    window.queueOperationAnimation(a, b, op, true);
}

window.queueOperationAnimation = function(a, b, op, isGhost = false) {
    a = parseInt(a);
    b = parseInt(b);

    if (isGhost) {
        animator.add({ type: 'RESET', isGhost: true }); 
    } else {
        animator.add({ type: 'RESET' });
    }

    const q = (action) => animator.add({ ...action, isGhost });

    if (op === 'add' || op === '+' || op === 'subtract' || op === '-') {
        if (a !== 0) {
            q({
                type: 'WALK', from: 0, to: a, facing: a >= 0 ? 1 : -1,
                msg: `Langkah 1: Gerak ke posisi awal ${a}`
            });
        } else {
            q({ type: 'DELAY', duration: 500, msg: "Langkah 1: Mulai dari Nol." });
        }

        if (op === 'add' || op === '+') {
            q({
                type: 'FLIP', fromFacing: a >= 0 ? 1 : -1, toFacing: 1, atPos: a,
                msg: "Langkah 2: TAMBAH (+) artinya hadap arah POSITIF (Kanan)"
            });
            const target = a + b;
            const dirText = b >= 0 ? "MAJU" : "MUNDUR";
            q({ type: 'DELAY', duration: 300, msg: "Bersiap bergerak..." });
            q({
                type: 'WALK', from: a, to: target, facing: 1,
                msg: `Langkah 3: Jalan ${dirText} ${Math.abs(b)} langkah`
            });
        } else { // Subtract
            if (a >= 0) {
                 q({
                    type: 'FLIP', fromFacing: 1, toFacing: -1, atPos: a,
                    msg: "Langkah 2: KURANG (-) membalikkan arah! Hadap Negatif."
                });
            } else {
                 q({
                    type: 'FLIP', fromFacing: -1, toFacing: -1, atPos: a, 
                    msg: "Langkah 2: KURANG (-) artinya hadap arah Negatif."
                });
            }
            
            const target = a - b;
            const dirText = b >= 0 ? "MAJU" : "MUNDUR";
            q({ type: 'DELAY', duration: 300, msg: "Bersiap bergerak..." });
            q({
                type: 'WALK', from: a, to: target, facing: -1,
                msg: `Langkah 3: Jalan ${dirText} ${Math.abs(b)} langkah (Relatif hadapan)`
            });
        }
    } else if (op === 'multiply' || op === '×') {
        const faceA = a >= 0 ? 1 : -1;
        const absA = Math.abs(a);
        q({
            type: 'FLIP', fromFacing: 1, toFacing: faceA, atPos: 0,
            msg: `Vektor A (${a}): Menentukan arah hadap ${a >= 0 ? 'Kanan' : 'Kiri'}`
        });
        let current = 0;
        const step = faceA * b;
        for (let i = 0; i < absA; i++) {
            q({
                type: 'JUMP', from: current, to: current + step, facing: faceA,
                msg: `Lompatan ${i + 1}/${absA}: Besar ${b}`
            });
            current += step;
        }
        q({ type: 'DELAY', duration: 1000, msg: `Hasil Kalkulasi: ${a * b}` });
    } else if (op === 'divide' || op === '÷') {
        if (b === 0) return;
        q({
            type: 'WALK', from: 0, to: a, facing: a >= 0 ? 1 : -1,
            msg: `Target dikunci: ${a}`
        });
        q({ type: 'RESET', isGhost: true }); 
        
        const result = a / b;
        let current = 0;
        const facing = b >= 0 ? 1 : -1;
        q({
            type: 'FLIP', fromFacing: 1, toFacing: facing, atPos: 0,
            msg: `Besar langkah: ${b}.`
        });
        const count = Math.abs(result);
        const jumpDirText = result >= 0 ? "Positif" : "Negatif";
        for (let i = 0; i < count; i++) {
            const step = a / count;
            const nextP = current + step;
            q({
                type: 'JUMP', from: current, to: nextP, facing: facing,
                msg: `Langkah ${i + 1}: Inkremen ${jumpDirText}`
            });
            current = nextP;
        }
        q({ type: 'DELAY', duration: 1000, msg: `Total Langkah: ${result}` });
    }
}

window.runSandbox = function() {
    if (state.isAnimating) return;
    const a = document.getElementById('input-a').value;
    const b = document.getElementById('input-b').value;
    const op = document.getElementById('input-op').value;
    window.queueOperationAnimation(a, b, op);
}