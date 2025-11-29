    // --- TAILWIND CONFIG ---
    tailwind.config = {
        theme: {
            extend: {
                fontFamily: {
                    sans: ['Inter', 'sans-serif'],
                    mono: ['JetBrains Mono', 'monospace'],
                },
            }
        }
    };

    // --- GAME CONFIG & STATE ---
    const CONFIG = {
        minVal: -25,
        maxVal: 25,
        stepSize: 80,
        tickHeight: 20,
        axisY: 250,
    };

    let state = {
        mode: 'sandbox',
        subMode: 'basic',
        charPos: 0,
        charFacing: 1,
        isAnimating: false,
        challengeTarget: null,
        userFlagPos: null,
        challengeData: null,
        streak: 0,
        isGhostMode: false,
        hasSeenTutorial: false
    };

    // --- LOGIC FUNCTIONS (TRANSLATED) ---
    function generateLocalExplanation(a, b, op) {
        a = parseInt(a);
        b = parseInt(b);

        if (op === 'add') {
            const dir = b >= 0 ? "KANAN (Positif)" : "KIRI (Negatif)";
            return `Mulai di ${a}. Operasi TAMBAH artinya tetap menghadap arah standar (Positif). Bergerak ke ${dir} sebanyak ${Math.abs(b)} langkah.`;
        }

        if (op === 'subtract') {
            const dir = b >= 0 ? "MAJU" : "MUNDUR";
            return `Mulai di ${a}. Operasi KURANG artinya berbalik arah (menghadap Negatif). Lalu berjalan ${dir} sebanyak ${Math.abs(b)} langkah dari hadapanmu sekarang.`;
        }

        if (op === 'multiply') {
            const dir = a >= 0 ? "KANAN" : "KIRI";
            const result = a * b;
            return `Vektor A (${a}) menentukan arah hadap: ${dir}. Vektor B (${b}) menentukan besar lompatan. Lakukan ${Math.abs(a)} lompatan sebesar ${b}. Hasil: ${result}.`;
        }

        if (op === 'divide') {
            const result = a / b;
            return `Target koordinat: ${a}. Besar langkah: ${b}. Menghitung jumlah langkah yang dibutuhkan dari nol ke target... Hasil: ${result} langkah.`;
        }

        return "Kalkulasi selesai.";
    }

    function generateLocalMission(a, b, opSym) {
        const scenarios = [
            "Kalibrasi katup tekanan.",
            "Sesuaikan tegangan struktural.",
            "Hitung vektor beban.",
            "Sinkronisasi rasio roda gigi.",
            "Tentukan tekanan material."
        ];
        const sc = scenarios[Math.floor(Math.random() * scenarios.length)];
        return `TUGAS: ${sc} VAR_A: ${a}, VAR_B: ${b}. OP: ${opSym}. Hitung hasil akhir.`;
    }