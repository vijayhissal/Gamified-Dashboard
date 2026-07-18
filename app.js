// ==========================================
// CENTRAL STATE MANAGEMENT
// ==========================================

const DEFAULT_STATE = {
    profile: {
        level: 1,
        currentXp: 0,
        xpNeeded: 100,
        petName: "Cyber-Slime",
        userName: "Hero Adventurer",
        gender: "girl"
    },
    habits: [
        { id: "h-1", name: "Drink 2L of water", completedToday: false, streak: 0, lastCompleted: null },
        { id: "h-2", name: "30-min daily exercise", completedToday: false, streak: 0, lastCompleted: null },
        { id: "h-3", name: "Read a book for 15 mins", completedToday: false, streak: 0, lastCompleted: null }
    ],
    quests: [
        { id: "q-1", text: "Organize office desk layout", completed: false },
        { id: "q-2", text: "Walk 10,000 steps today", completed: false }
    ],
    wellness: {
        waterMl: 0,
        sleepHours: 8.0,
        sleepRating: 3,
        sleepLogged: false
    },
    currentDate: "", // Initialized dynamically to today
    history: [
        { date: "2026-07-12", completionRate: 60, waterMl: 1250, sleepHours: 7.0 },
        { date: "2026-07-13", completionRate: 80, waterMl: 1500, sleepHours: 6.5 },
        { date: "2026-07-14", completionRate: 100, waterMl: 2000, sleepHours: 8.0 },
        { date: "2026-07-15", completionRate: 33, waterMl: 750, sleepHours: 5.5 },
        { date: "2026-07-16", completionRate: 100, waterMl: 1750, sleepHours: 7.5 },
        { date: "2026-07-17", completionRate: 66, waterMl: 2000, sleepHours: 8.2 }
    ],
    totalQuestsCompleted: 0
};

let state = null;

// Initialize State
function initState() {
    const stored = localStorage.getItem("habit_rpg_state");
    const todayStr = getTodayDateStr();
    
    if (stored) {
        try {
            state = JSON.parse(stored);
            // Ensure necessary fields are populated in case of older schemas
            if (!state.history) state.history = DEFAULT_STATE.history;
            if (!state.currentDate) state.currentDate = todayStr;
            if (state.totalQuestsCompleted === undefined) state.totalQuestsCompleted = 0;
            if (!state.profile.userName) state.profile.userName = "Hero Adventurer";
            if (!state.profile.gender) state.profile.gender = "girl";
        } catch (e) {
            console.error("Error loading state from localStorage, resetting to default.", e);
            state = JSON.parse(JSON.stringify(DEFAULT_STATE));
            state.currentDate = todayStr;
        }
    } else {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        state.currentDate = todayStr;
    }
    
    saveState();
}

function saveState() {
    localStorage.setItem("habit_rpg_state", JSON.stringify(state));
}

// ==========================================
// DATE HELPERS
// ==========================================

function getTodayDateStr() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function getYesterdayDateStr(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

function formatDateDisplay(dateStr) {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString('en-US', options);
}

// ==========================================
// RPG ENGINE & XP SYSTEM
// ==========================================

function calculateXpNeeded(level) {
    // Formula: 100 * (Level)^1.2
    return Math.round(100 * Math.pow(level, 1.2));
}

function addXp(amount, event) {
    state.profile.currentXp += amount;
    
    // Spawn floating XP indicator
    let spawnX = window.innerWidth / 2;
    let spawnY = window.innerHeight / 2;
    
    if (event && event.clientX && event.clientY) {
        spawnX = event.clientX;
        spawnY = event.clientY;
    }
    
    spawnXpParticle(spawnX, spawnY, amount);
    
    // Check level up condition
    let leveledUp = false;
    while (state.profile.currentXp >= state.profile.xpNeeded) {
        state.profile.currentXp -= state.profile.xpNeeded;
        state.profile.level += 1;
        state.profile.xpNeeded = calculateXpNeeded(state.profile.level);
        leveledUp = true;
    }
    
    saveState();
    
    if (leveledUp) {
        triggerLevelUpCelebration();
    } else {
        showToast(`+${amount} XP Gained!`, "purple");
    }
    
    renderApp();
}

function triggerLevelUpCelebration() {
    // Show Modal
    const modal = document.getElementById("celebration-modal");
    const levelText = document.getElementById("modal-level-text");
    
    levelText.textContent = state.profile.level;
    modal.classList.remove("pointer-events-none", "opacity-0");
    modal.querySelector(".bg-slate-900").classList.add("level-up-glow");
    modal.querySelector(".bg-slate-900").style.transform = "scale(1)";
    
    // Confetti
    triggerConfetti();
    
    // Add custom celebratory audio synthesized using Web Audio API
    playLevelUpSound();
    
    showToast(`LEVEL UP! Reached Level ${state.profile.level}! 🎉`, "gold");
    updateHeroBubble(`LEVEL UP! Reached Level ${state.profile.level}! Outstanding achievements, adventurer! 🏆🎉`);
}

function closeLevelUpModal() {
    const modal = document.getElementById("celebration-modal");
    modal.classList.add("pointer-events-none", "opacity-0");
    modal.querySelector(".bg-slate-900").classList.remove("level-up-glow");
    modal.querySelector(".bg-slate-900").style.transform = "scale(0.9)";
}

// Synthesize Web Audio API sound for level up
function playLevelUpSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        // Sequence of ascending notes
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
            
            gain.gain.setValueAtTime(0.1, ctx.currentTime + index * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.1 + 0.3);
            
            osc.start(ctx.currentTime + index * 0.1);
            osc.stop(ctx.currentTime + index * 0.1 + 0.35);
        });
    } catch (e) {
        console.log("Audio synthesis disabled or blocked by browser policies.");
    }
}

// ==========================================
// PET & AVATAR RENDERING
// ==========================================

function getPetMood() {
    const totalHabits = state.habits.length;
    const completedHabits = state.habits.filter(h => h.completedToday).length;
    const completionRate = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 100;
    
    // Excited: Hydrated and completed all habits
    if (state.wellness.waterMl >= 2000 && completionRate >= 80) {
        return "EXCITED";
    }
    // Sleepy: Logged sleep, late night or highly hydrated but tired
    if (state.wellness.sleepLogged && state.wellness.sleepHours >= 8.5) {
        return "SLEEPY";
    }
    // Tired: dehydration and low completions
    if (state.wellness.waterMl < 500 && completionRate < 35) {
        return "TIRED";
    }
    return "HAPPY";
}

function renderSlimeEyes(mood) {
    if (mood === "EXCITED") {
        return `
            <path d="M35 52 L40 48 L40 56 M40 48 L45 52" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M65 52 L60 48 L60 56 M60 48 L55 52" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        `;
    } else if (mood === "SLEEPY") {
        return `
            <path d="M34 52 Q40 57, 46 52" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
            <path d="M54 52 Q60 57, 66 52" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
        `;
    } else if (mood === "TIRED") {
        return `
            <line x1="34" y1="52" x2="44" y2="52" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" />
            <line x1="56" y1="52" x2="66" y2="52" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" />
        `;
    } else {
        // HAPPY
        return `
            <circle cx="40" cy="52" r="3.5" fill="#10b981" class="animate-pulse" />
            <circle cx="60" cy="52" r="3.5" fill="#10b981" class="animate-pulse" />
        `;
    }
}

function renderRoboEyes(mood) {
    if (mood === "EXCITED") {
        return `
            <path d="M38 39 L43 35 L43 43" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M62 39 L57 35 L57 43" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        `;
    } else if (mood === "SLEEPY") {
        return `
            <path d="M38 40 Q43 45, 48 40" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
            <path d="M52 40 Q57 45, 62 40" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
        `;
    } else if (mood === "TIRED") {
        return `
            <line x1="37" y1="40" x2="47" y2="40" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" />
            <line x1="53" y1="40" x2="63" y2="40" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" />
        `;
    } else {
        // HAPPY
        return `
            <rect x="40" y="37" width="6" height="6" rx="1.5" fill="#10b981" />
            <rect x="54" y="37" width="6" height="6" rx="1.5" fill="#10b981" />
        `;
    }
}

function renderAvatar() {
    const lvl = state.profile.level;
    const mood = getPetMood();
    let svgContent = "";

    if (lvl === 1) {
        // EGG STAGE
        svgContent = `
            <svg viewBox="0 0 100 100" class="w-full h-full">
                <defs>
                    <linearGradient id="eggGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#c084fc" />
                        <stop offset="50%" stop-color="#8b5cf6" />
                        <stop offset="100%" stop-color="#4c1d95" />
                    </linearGradient>
                </defs>
                <!-- Ground reflection shadow -->
                <ellipse cx="50" cy="85" rx="22" ry="5.5" fill="#000000" opacity="0.45" />
                <!-- Incubator base elements -->
                <path d="M35 83 L65 83 L60 88 L40 88 Z" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
                
                <!-- Egg body -->
                <path d="M50 15 C30 15, 22 45, 22 68 C22 80, 32 83, 50 83 C68 83, 78 80, 78 68 C78 45, 70 15, 50 15 Z" 
                      fill="url(#eggGrad)" stroke="#a78bfa" stroke-width="2" class="animate-[bounce_3s_infinite_ease-in-out]" style="transform-origin: bottom center;" />
                
                <!-- Incubator lights and details -->
                <path d="M32 72 Q50 64, 68 72" fill="none" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" opacity="0.8" />
                <path d="M26 56 Q50 48, 74 56" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-linecap="round" opacity="0.5" />
                
                <!-- Visor overlay showing baby eyes -->
                <rect x="42" y="32" width="16" height="8" rx="4" fill="#020617" stroke="#8b5cf6" stroke-width="1" />
                <circle cx="47" cy="36" r="1.5" fill="#06b6d4" class="animate-pulse" />
                <circle cx="53" cy="36" r="1.5" fill="#06b6d4" class="animate-pulse" />
            </svg>
        `;
    } else if (lvl >= 2 && lvl <= 4) {
        // SLIME STAGE
        svgContent = `
            <svg viewBox="0 0 100 100" class="w-full h-full">
                <defs>
                    <linearGradient id="slimeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#34d399" />
                        <stop offset="60%" stop-color="#10b981" />
                        <stop offset="100%" stop-color="#064e3b" />
                    </linearGradient>
                    <filter id="slimeGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#10b981" flood-opacity="0.4"/>
                    </filter>
                </defs>
                <!-- Ground shadow -->
                <ellipse cx="50" cy="85" rx="30" ry="7" fill="#000000" opacity="0.4" />
                
                <!-- Slime body -->
                <path d="M50 22 C26 22, 16 48, 16 75 C16 85, 30 85, 50 85 C70 85, 84 85, 84 75 C84 48, 74 22, 50 22 Z" 
                      fill="url(#slimeGrad)" stroke="#6ee7b7" stroke-width="1.5" filter="url(#slimeGlow)"
                      class="animate-[bounce_2s_infinite_ease-in-out]" style="transform-origin: bottom center;" />
                
                <!-- Cyber Visor -->
                <rect x="28" y="44" width="44" height="15" rx="7.5" fill="#020617" stroke="#10b981" stroke-width="1.5" />
                
                <!-- Visor Reflection -->
                <path d="M32 46.5 L68 46.5" fill="none" stroke="#ffffff" stroke-width="1" opacity="0.25" stroke-linecap="round" />
                
                <!-- Interactive Eyes -->
                ${renderSlimeEyes(mood)}
                
                <!-- Cute Cheek Blush -->
                <circle cx="25" cy="62" r="3" fill="#f43f5e" opacity="0.5" />
                <circle cx="75" cy="62" r="3" fill="#f43f5e" opacity="0.5" />
                
                <!-- Cute Slime Core Kernel -->
                <circle cx="50" cy="68" r="4.5" fill="#a78bfa" opacity="0.7" class="animate-pulse" />
            </svg>
        `;
    } else {
        // ROBO-DRAGON HERO STAGE (Level 5+)
        svgContent = `
            <svg viewBox="0 0 100 100" class="w-full h-full">
                <defs>
                    <linearGradient id="roboGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#a78bfa" />
                        <stop offset="60%" stop-color="#6366f1" />
                        <stop offset="100%" stop-color="#312e81" />
                    </linearGradient>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fbbf24" />
                        <stop offset="100%" stop-color="#ea580c" />
                    </linearGradient>
                </defs>
                <!-- Shadows -->
                <ellipse cx="50" cy="88" rx="26" ry="6" fill="#000000" opacity="0.45" />
                
                <!-- Jet Thruster Fire -->
                <path d="M44 80 L50 97 L56 80 Z" fill="url(#goldGrad)" class="animate-[pulse_0.4s_infinite]" />
                <path d="M47 80 L50 90 L53 80 Z" fill="#ffffff" opacity="0.8" class="animate-[pulse_0.3s_infinite]" />
                
                <!-- Hovering Wings -->
                <g class="animate-[bounce_1.8s_infinite_ease-in-out]" style="transform-origin: 30px 48px;">
                    <path d="M25 48 L5 32 L8 60 L28 55 Z" fill="url(#roboGrad)" stroke="#a78bfa" stroke-width="1.5" opacity="0.85" />
                    <line x1="12" y1="38" x2="22" y2="48" stroke="#a78bfa" stroke-width="1.5" />
                </g>
                <g class="animate-[bounce_1.8s_infinite_ease-in-out]" style="animation-delay: 0.3s; transform-origin: 70px 48px;">
                    <path d="M75 48 L95 32 L92 60 L72 55 Z" fill="url(#roboGrad)" stroke="#a78bfa" stroke-width="1.5" opacity="0.85" />
                    <line x1="88" y1="38" x2="78" y2="48" stroke="#a78bfa" stroke-width="1.5" />
                </g>
                
                <!-- Robot Chassis Body -->
                <g class="animate-[bounce_2.5s_infinite_ease-in-out]">
                    <!-- Main Body -->
                    <rect x="28" y="24" width="44" height="38" rx="14" fill="url(#roboGrad)" stroke="#c084fc" stroke-width="2.5" />
                    
                    <!-- Ears / Side antennas -->
                    <rect x="22" y="32" width="6" height="15" rx="3" fill="#4f46e5" stroke="#a78bfa" stroke-width="1" />
                    <rect x="72" y="32" width="6" height="15" rx="3" fill="#4f46e5" stroke="#a78bfa" stroke-width="1" />
                    <circle cx="25" cy="29" r="3" fill="#fbbf24" class="animate-pulse" />
                    <circle cx="75" cy="29" r="3" fill="#fbbf24" class="animate-pulse" />
                    
                    <!-- Gold Head Crown / Horn -->
                    <path d="M42 24 L50 10 L58 24 Z" fill="url(#goldGrad)" stroke="#f59e0b" stroke-width="1" />
                    
                    <!-- Cyber Visor -->
                    <rect x="34" y="32" width="32" height="14" rx="7" fill="#020617" stroke="#fbbf24" stroke-width="1.5" />
                    
                    <!-- Interactive Eyes -->
                    ${renderRoboEyes(mood)}
                    
                    <!-- Core chest light -->
                    <circle cx="50" cy="52" r="5" fill="#22d3ee" stroke="#e0f2fe" stroke-width="1.5" class="animate-pulse" />
                </g>
            </svg>
        `;
    }

    document.getElementById("avatar-svg-container").innerHTML = svgContent;
    
    // Set pet name & label
    let evolutionStage = "Incubated Egg";
    if (lvl >= 2 && lvl <= 4) evolutionStage = "Cyber Slime";
    if (lvl >= 5) evolutionStage = "Robo-Companion";
    document.getElementById("pet-mood-badge").textContent = `${mood} | ${evolutionStage}`;
}

// ==========================================
// TOAST & PARTICLES INTERACTIVITY
// ==========================================

function showToast(message, type = "purple") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    
    const toast = document.createElement("div");
    // Class combinations based on type
    let colorClasses = "bg-slate-900 border-purple-500 text-purple-200";
    let iconClass = "fa-solid fa-bell";
    
    if (type === "emerald") {
        colorClasses = "bg-slate-900 border-emerald-500 text-emerald-300";
        iconClass = "fa-regular fa-circle-check";
    } else if (type === "blue") {
        colorClasses = "bg-slate-900 border-blue-500 text-blue-300";
        iconClass = "fa-solid fa-droplet";
    } else if (type === "gold") {
        colorClasses = "bg-slate-900 border-yellow-500 text-yellow-300";
        iconClass = "fa-solid fa-trophy";
    } else if (type === "red") {
        colorClasses = "bg-slate-900 border-red-500 text-red-300";
        iconClass = "fa-solid fa-triangle-exclamation";
    }
    
    toast.className = `flex items-center gap-3 px-4.5 py-3 rounded-2xl border-2 shadow-lg shadow-black/50 ${colorClasses} transform translate-y-2 opacity-0 transition-all duration-300 max-w-sm`;
    toast.innerHTML = `
        <i class="${iconClass} text-lg flex-shrink-0"></i>
        <div class="text-xs font-bold leading-tight">${message}</div>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove("translate-y-2", "opacity-0");
    }, 10);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.add("translate-y-2", "opacity-0");
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

function spawnXpParticle(x, y, amount) {
    const container = document.getElementById("particles-container");
    if (!container) return;
    
    const particle = document.createElement("div");
    let colorClass = "text-emerald-400";
    if (amount >= 25) colorClass = "text-purple-400";
    else if (amount <= 2) colorClass = "text-blue-400";
    
    particle.className = `xp-particle ${colorClass}`;
    particle.textContent = `+${amount} XP`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    
    container.appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 1200);
}

// ==========================================
// RENDER INTERFACES
// ==========================================

function renderApp() {
    // 1. Date Header
    document.getElementById("date-display").textContent = formatDateDisplay(state.currentDate);
    
    // 2. Stats & Profiles
    document.getElementById("level-display").textContent = `Lvl ${state.profile.level}`;
    document.getElementById("pet-name").innerHTML = `
        ${state.profile.petName}
        <button id="rename-pet-btn" onclick="renamePetPrompt(event)" class="text-slate-550 hover:text-emerald-400 transition-colors" title="Rename Pet">
            <i class="fa-solid fa-pen text-xs"></i>
        </button>
    `;
    
    // Render Human Hero Name
    document.getElementById("user-name-display").innerHTML = `
        ${escapeHtml(state.profile.userName)}
        <button id="rename-user-btn" onclick="renameUserPrompt(event)" class="text-slate-500 hover:text-purple-400 transition-colors mr-1" title="Rename Character">
            <i class="fa-solid fa-pen text-xs"></i>
        </button>
        <button id="toggle-gender-btn" onclick="toggleGender(event)" class="text-slate-500 hover:text-purple-400 transition-colors text-[9px] font-extrabold ml-1.5 border border-slate-800 hover:border-purple-500/30 px-1.5 py-0.5 rounded bg-slate-950/80 uppercase tracking-wider" title="Toggle Character Model">
            ${state.profile.gender === 'boy' ? '👧 Girl' : '👦 Boy'}
        </button>
    `;
    
    // Render Human Hero SVG Goggles/Visor character
    document.getElementById("hero-svg-container").innerHTML = drawHeroAvatar();
    
    // XP Bar Width
    const xpPercent = Math.min(100, Math.round((state.profile.currentXp / state.profile.xpNeeded) * 100));
    document.getElementById("xp-bar").style.width = `${xpPercent}%`;
    document.getElementById("xp-text").textContent = `${state.profile.currentXp} / ${state.profile.xpNeeded} XP`;
    document.getElementById("xp-percentage").textContent = `${xpPercent}%`;
    
    // Badges
    const maxStreak = state.habits.length > 0 ? Math.max(...state.habits.map(h => h.streak)) : 0;
    document.getElementById("streak-display").textContent = maxStreak;
    document.getElementById("quests-done-display").textContent = state.totalQuestsCompleted;
    
    // 3. Render Habits
    renderHabits();
    
    // 4. Render Quests
    renderQuests();
    
    // 5. Render Water hydration
    renderWater();
    
    // 6. Render Sleep logger
    renderSleep();
    
    // 7. Render Avatar
    renderAvatar();
    
    // 8. Render SVG Chart
    renderAnalyticsChart();

    // 9. Update Analytics Modal if open
    const modal = document.getElementById("analytics-modal");
    if (modal && !modal.classList.contains("opacity-0")) {
        renderModalAnalytics();
    }
}

// RENDER HABITS
function renderHabits() {
    const list = document.getElementById("habits-list");
    const countBadge = document.getElementById("habits-count-badge");
    
    if (state.habits.length === 0) {
        countBadge.textContent = "0 Active";
        list.innerHTML = `
            <div class="text-center py-8 text-slate-500 text-sm">
                <i class="fa-regular fa-clipboard text-2xl mb-2 block opacity-40"></i>
                No habits defined. Add a habit above to begin!
            </div>
        `;
        return;
    }
    
    countBadge.textContent = `${state.habits.length} Active`;
    list.innerHTML = "";
    
    state.habits.forEach((habit) => {
        const item = document.createElement("div");
        const completed = habit.completedToday;
        
        item.className = `flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-slate-900/80 border ${completed ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-slate-800/80'} rounded-xl transition-all duration-300`;
        
        item.innerHTML = `
            <div class="flex items-center gap-3 flex-grow">
                <label class="relative flex items-center justify-center cursor-pointer select-none">
                    <input type="checkbox" ${completed ? 'checked' : ''} onchange="toggleHabit('${habit.id}', event)" class="habit-checkbox w-5 h-5 flex-shrink-0 bg-slate-950 border border-slate-800 rounded-lg text-emerald-500 focus:ring-0 focus:ring-offset-0 focus:outline-none accent-emerald-500 cursor-pointer">
                </label>
                <span class="text-sm font-semibold tracking-wide ${completed ? 'line-through text-slate-500' : 'text-slate-200'} transition-all">${escapeHtml(habit.name)}</span>
            </div>
            
            <div class="flex items-center gap-3">
                <!-- Streak Badge -->
                <div class="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-800/60 text-xs font-bold ${habit.streak > 0 ? 'text-amber-500' : 'text-slate-500'}">
                    <i class="fa-solid fa-fire text-[10px]"></i>
                    <span>${habit.streak}d</span>
                </div>
                <!-- Delete Button -->
                <button onclick="deleteHabit('${habit.id}', event)" class="text-slate-500 hover:text-red-400 border border-transparent hover:border-slate-800 p-1.5 rounded-lg transition-all" title="Delete Habit">
                    <i class="fa-regular fa-trash-can text-xs"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

// RENDER QUESTS
function renderQuests() {
    const list = document.getElementById("quests-list");
    const countBadge = document.getElementById("quests-count-badge");
    
    if (state.quests.length === 0) {
        countBadge.textContent = "0 Active";
        list.innerHTML = `
            <div class="text-center py-8 text-slate-500 text-sm">
                <i class="fa-solid fa-scroll text-2xl mb-2 block opacity-40"></i>
                No active quests. Create one for some extra XP!
            </div>
        `;
        return;
    }
    
    countBadge.textContent = `${state.quests.length} Active`;
    list.innerHTML = "";
    
    state.quests.forEach((quest) => {
        const item = document.createElement("div");
        const completed = quest.completed;
        
        item.className = `flex items-center justify-between p-3.5 bg-slate-900/40 hover:bg-slate-900/80 border ${completed ? 'border-purple-500/20 bg-purple-950/5' : 'border-slate-800/80'} rounded-xl transition-all duration-300`;
        item.id = `quest-item-${quest.id}`;
        
        item.innerHTML = `
            <div class="flex items-center gap-3 flex-grow">
                <label class="relative flex items-center justify-center cursor-pointer select-none">
                    <input type="checkbox" ${completed ? 'checked' : ''} onchange="toggleQuest('${quest.id}', event)" class="habit-checkbox w-5 h-5 flex-shrink-0 bg-slate-950 border border-slate-800 rounded-lg text-purple-500 focus:ring-0 focus:ring-offset-0 focus:outline-none accent-purple-500 cursor-pointer">
                </label>
                <span class="text-sm font-semibold tracking-wide ${completed ? 'line-through text-slate-500' : 'text-slate-200'} transition-all">${escapeHtml(quest.text)}</span>
            </div>
            
            <button onclick="deleteQuest('${quest.id}', event)" class="text-slate-500 hover:text-red-400 border border-transparent hover:border-slate-800 p-1.5 rounded-lg transition-all" title="Delete Quest">
                <i class="fa-regular fa-trash-can text-xs"></i>
            </button>
        `;
        list.appendChild(item);
    });
}

// RENDER WATER
function renderWater() {
    const levelElement = document.getElementById("water-level");
    const progressText = document.getElementById("water-progress-text");
    
    const ml = state.wellness.waterMl;
    progressText.textContent = `${ml} / 2000 ml`;
    
    // Height calculation (cap at 100%)
    const heightPercent = Math.min(100, Math.round((ml / 2000) * 100));
    levelElement.style.height = `${heightPercent}%`;
}

// RENDER SLEEP
function renderSleep() {
    const statusDiv = document.getElementById("sleep-status-display");
    const valText = document.getElementById("logged-sleep-val");
    const starsSpan = document.getElementById("logged-sleep-stars");
    
    const hoursSpan = document.getElementById("sleep-hours-input");
    hoursSpan.textContent = state.wellness.sleepHours.toFixed(1);
    
    // Star rating highlight
    const starContainer = document.getElementById("sleep-star-rating");
    const stars = starContainer.querySelectorAll("i");
    stars.forEach((star, index) => {
        if (index < state.wellness.sleepRating) {
            star.classList.add("active");
            star.classList.remove("text-slate-600");
        } else {
            star.classList.remove("active");
            star.classList.add("text-slate-600");
        }
    });
    
    if (state.wellness.sleepLogged) {
        statusDiv.classList.remove("hidden");
        valText.textContent = state.wellness.sleepHours.toFixed(1);
        
        let starsHtml = "";
        for (let i = 0; i < state.wellness.sleepRating; i++) {
            starsHtml += '<i class="fa-solid fa-star text-[10px]"></i> ';
        }
        starsSpan.innerHTML = starsHtml;
        
        document.getElementById("save-sleep-btn").textContent = "Update Sleep Logs";
    } else {
        statusDiv.classList.add("hidden");
        document.getElementById("save-sleep-btn").textContent = "Log Sleep";
    }
}

// ==========================================
// INTERACTIVE LOGIC & OPERATIONS
// ==========================================

// Habits Operations
function toggleHabit(id, event) {
    const habit = state.habits.find(h => h.id === id);
    if (!habit) return;
    
    const isChecked = event.target.checked;
    habit.completedToday = isChecked;
    
    if (isChecked) {
        // Adjust streaks
        const yesterday = getYesterdayDateStr(state.currentDate);
        if (habit.lastCompleted === yesterday) {
            habit.streak += 1;
        } else if (habit.lastCompleted !== state.currentDate) {
            // Skips are reset to 1
            habit.streak = 1;
        }
        habit.lastCompleted = state.currentDate;
        
        // Add XP (+10)
        addXp(10, event);
        showToast(`Habit completed! +10 XP 🔥`, "emerald");
        updateHeroBubble("Nice! Habit complete. +10 XP added to our pool! 🔥");
    } else {
        // Uncheck adjustments
        if (habit.streak > 0) habit.streak -= 1;
        habit.lastCompleted = habit.streak > 0 ? getYesterdayDateStr(state.currentDate) : null;
        
        // Deduct XP (don't go below 0)
        state.profile.currentXp = Math.max(0, state.profile.currentXp - 10);
        showToast("Habit unchecked. -10 XP deducted.", "red");
        updateHeroBubble("Habit unchecked. Let's stay disciplined, adventurer! ⚠️");
        saveState();
        renderApp();
    }
}

function deleteHabit(id, event) {
    event.stopPropagation();
    if (confirm("Are you sure you want to delete this habit?")) {
        state.habits = state.habits.filter(h => h.id !== id);
        saveState();
        renderApp();
        showToast("Habit deleted.", "red");
    }
}

// Quests Operations
function toggleQuest(id, event) {
    const quest = state.quests.find(q => q.id === id);
    if (!quest) return;
    
    const isChecked = event.target.checked;
    quest.completed = isChecked;
    
    if (isChecked) {
        state.totalQuestsCompleted += 1;
        
        // Add XP (+25)
        addXp(25, event);
        showToast("Quest completed! +25 XP 📜", "purple");
        updateHeroBubble("Incredible! Quest finished. +25 XP in the bag! 📜✨");
        
        // Animate fading away
        const element = document.getElementById(`quest-item-${id}`);
        if (element) {
            setTimeout(() => {
                element.style.opacity = "0";
                element.style.transform = "translateX(50px)";
                // After CSS transition finishes (300ms) remove from state list
                setTimeout(() => {
                    state.quests = state.quests.filter(q => q.id !== id);
                    saveState();
                    renderApp();
                }, 300);
            }, 600);
        } else {
            // Fallback if elements not in DOM
            state.quests = state.quests.filter(q => q.id !== id);
            saveState();
            renderApp();
        }
    } else {
        // Reverse quest completions (if custom logic needs it)
        state.totalQuestsCompleted = Math.max(0, state.totalQuestsCompleted - 1);
        state.profile.currentXp = Math.max(0, state.profile.currentXp - 25);
        saveState();
        renderApp();
        updateHeroBubble("Quest unchecked. Let's make sure we get it done!");
    }
}

function deleteQuest(id, event) {
    event.stopPropagation();
    state.quests = state.quests.filter(q => q.id !== id);
    saveState();
    renderApp();
    showToast("Quest removed.", "red");
}

// Water Actions
document.getElementById("add-water-btn").addEventListener("click", (e) => {
    state.wellness.waterMl += 250;
    
    // Check if goal just reached
    if (state.wellness.waterMl === 2000) {
        addXp(2 + 10, e); // Give 2 XP plus a 10 XP bonus!
        showToast("Water Target Achieved! +12 XP! 💧🎉", "blue");
    } else {
        addXp(2, e);
        showToast("Logged 250ml water. +2 XP 💧", "blue");
    }
    
    saveState();
    renderApp();
});

document.getElementById("reset-water-btn").addEventListener("click", () => {
    state.wellness.waterMl = 0;
    saveState();
    renderApp();
    showToast("Hydration logger reset.", "red");
});

// Sleep Controls
document.getElementById("sleep-dec-btn").addEventListener("click", () => {
    state.wellness.sleepHours = Math.max(1.0, state.wellness.sleepHours - 0.5);
    renderSleep();
});

document.getElementById("sleep-inc-btn").addEventListener("click", () => {
    state.wellness.sleepHours = Math.min(16.0, state.wellness.sleepHours + 0.5);
    renderSleep();
});

// Stars selection
document.getElementById("sleep-star-rating").addEventListener("click", (e) => {
    const star = e.target.closest("i");
    if (!star) return;
    
    state.wellness.sleepRating = parseInt(star.getAttribute("data-star"));
    renderSleep();
});

// Save sleep entry
document.getElementById("save-sleep-btn").addEventListener("click", (e) => {
    const isFirstTimeToday = !state.wellness.sleepLogged;
    state.wellness.sleepLogged = true;
    
    if (isFirstTimeToday) {
        // Sleep log awards +15 XP
        addXp(15, e);
        showToast(`Sleep logged! +15 XP 🌙`, "purple");
    } else {
        saveState();
        renderApp();
        showToast("Sleep log updated.", "purple");
    }
});

// Rename Pet
function renamePetPrompt(event) {
    event.stopPropagation();
    const newName = prompt("Rename your Pet Companion:", state.profile.petName);
    if (newName && newName.trim() !== "") {
        state.profile.petName = newName.trim().substring(0, 18);
        saveState();
        renderApp();
        showToast("Pet renamed!", "gold");
    }
}

// Add Custom Habit Submission
document.getElementById("add-habit-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("habit-name-input");
    const name = input.value.trim();
    if (!name) return;
    
    const newHabit = {
        id: "h-" + Date.now(),
        name: name,
        completedToday: false,
        streak: 0,
        lastCompleted: null
    };
    
    state.habits.push(newHabit);
    input.value = "";
    saveState();
    renderApp();
    showToast("New habit added!", "emerald");
});

// Add Custom Quest Submission
document.getElementById("add-quest-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = document.getElementById("quest-text-input");
    const text = input.value.trim();
    if (!text) return;
    
    const newQuest = {
        id: "q-" + Date.now(),
        text: text,
        completed: false
    };
    
    state.quests.push(newQuest);
    input.value = "";
    saveState();
    renderApp();
    showToast("New quest posted!", "purple");
});

// ==========================================
// SIMULATE NEW DAY & RESET DATA
// ==========================================

document.getElementById("simulate-day-btn").addEventListener("click", () => {
    // 1. Calculate and Log Today's Stats to History
    const totalHabits = state.habits.length;
    const completedHabits = state.habits.filter(h => h.completedToday).length;
    const completionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 100;
    
    // Check history length limit
    if (state.history.length >= 30) {
        state.history.shift(); // remove oldest
    }
    
    // Add today's log entry
    state.history.push({
        date: state.currentDate,
        completionRate: completionRate,
        waterMl: state.wellness.waterMl,
        sleepHours: state.wellness.sleepLogged ? state.wellness.sleepHours : 0.0
    });
    
    // 2. Streaks Break check
    // For habits not completed today, their streak breaks (sets to 0)
    state.habits.forEach((habit) => {
        if (!habit.completedToday) {
            habit.streak = 0;
        }
        habit.completedToday = false; // Reset daily completions
    });
    
    // 3. Clear quests that were finished (already deleted on toggle, but clean up double checks)
    state.quests = state.quests.filter(q => !q.completed);
    
    // 4. Reset Wellness Trackers
    state.wellness.waterMl = 0;
    state.wellness.sleepLogged = false;
    // Sleep ratings and standard hours remain set as preset templates, but logs are cleared
    
    // 5. Increment Date
    const d = new Date(state.currentDate + "T12:00:00");
    d.setDate(d.getDate() + 1);
    state.currentDate = d.toISOString().split('T')[0];
    
    saveState();
    renderApp();
    
    // Celebrating new day
    triggerConfetti();
    showToast("New Day Simulated! Streaks processed.", "gold");
});

document.getElementById("reset-data-btn").addEventListener("click", () => {
    if (confirm("WARNING: Are you sure you want to reset all data? This clears your level, streaks, habits, and history!")) {
        localStorage.removeItem("habit_rpg_state");
        initState();
        renderApp();
        showToast("All data reset to default.", "red");
    }
});

document.getElementById("modal-close-btn").addEventListener("click", () => {
    closeLevelUpModal();
});

// ==========================================
// CHART GENERATION (SVG SCALING)
// ==========================================

function renderAnalyticsChart() {
    const svg = document.getElementById("analytics-chart");
    if (!svg) return;
    
    // Clean SVG
    svg.innerHTML = "";
    
    // Get last 7 entries
    const logs = state.history.slice(-7);
    if (logs.length === 0) {
        svg.innerHTML = '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#64748b" font-size="12" font-weight="bold">No history logged yet.</text>';
        return;
    }
    
    const svgWidth = svg.clientWidth || 300;
    const svgHeight = svg.clientHeight || 140;
    
    // Boundaries & Margins
    const mLeft = 32;
    const mRight = 12;
    const mTop = 15;
    const mBottom = 22;
    
    const chartWidth = svgWidth - mLeft - mRight;
    const chartHeight = svgHeight - mTop - mBottom;
    
    // Draw Y-Axis labels and grid lines
    const gridDivisions = 4; // 0%, 25%, 50%, 75%, 100%
    for (let i = 0; i <= gridDivisions; i++) {
        const percent = (i / gridDivisions) * 100;
        const y = mTop + chartHeight - (i / gridDivisions) * chartHeight;
        
        // Grid Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", mLeft);
        line.setAttribute("y1", y);
        line.setAttribute("x2", svgWidth - mRight);
        line.setAttribute("y2", y);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);
        
        // Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", mLeft - 6);
        text.setAttribute("y", y + 4);
        text.setAttribute("text-anchor", "end");
        text.setAttribute("fill", "#64748b");
        text.setAttribute("font-size", "9");
        text.setAttribute("font-weight", "bold");
        text.textContent = `${percent}%`;
        svg.appendChild(text);
    }
    
    // Calculate points
    const points = [];
    logs.forEach((log, index) => {
        const x = mLeft + (index / (logs.length - 1 || 1)) * chartWidth;
        const y = mTop + chartHeight - (log.completionRate / 100) * chartHeight;
        points.push({ x, y, date: log.date, rate: log.completionRate });
    });
    
    // Draw line connecting points
    if (points.length > 1) {
        // Gradient fill area under the line
        const gradPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let dArea = `M ${points[0].x} ${mTop + chartHeight}`;
        points.forEach((p) => {
            dArea += ` L ${p.x} ${p.y}`;
        });
        dArea += ` L ${points[points.length - 1].x} ${mTop + chartHeight} Z`;
        
        // Define gradient if it doesn't exist
        let defs = svg.querySelector("defs");
        if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            defs.innerHTML = `
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.0" />
                </linearGradient>
            `;
            svg.appendChild(defs);
        }
        
        gradPath.setAttribute("d", dArea);
        gradPath.setAttribute("fill", "url(#chartGrad)");
        gradPath.setAttribute("class", "chart-area");
        svg.appendChild(gradPath);
        
        // Line Stroke
        const strokePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let dStroke = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            dStroke += ` L ${points[i].x} ${points[i].y}`;
        }
        
        strokePath.setAttribute("d", dStroke);
        strokePath.setAttribute("fill", "none");
        strokePath.setAttribute("stroke", "#8b5cf6");
        strokePath.setAttribute("class", "chart-line");
        svg.appendChild(strokePath);
    }
    
    // Draw points and X labels
    points.forEach((p) => {
        // Dot marker
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#c084fc");
        circle.setAttribute("stroke", "#0f172a");
        circle.setAttribute("stroke-width", "1.5");
        circle.setAttribute("class", "chart-point");
        
        // Simple tooltip description
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${formatShortDate(p.date)}: ${p.rate}% completed`;
        circle.appendChild(title);
        
        svg.appendChild(circle);
        
        // X Label
        const xText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        xText.setAttribute("x", p.x);
        xText.setAttribute("y", mTop + chartHeight + 14);
        xText.setAttribute("text-anchor", "middle");
        xText.setAttribute("fill", "#64748b");
        xText.setAttribute("font-size", "9");
        xText.setAttribute("font-weight", "bold");
        xText.textContent = formatShortDate(p.date);
        svg.appendChild(xText);
    });
}

function formatShortDate(dateStr) {
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Escaping helper
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

// ==========================================
// CONFETTI GENERATOR
// ==========================================

function triggerConfetti() {
    const canvas = document.getElementById("confetti-canvas");
    if (!canvas) return;
    canvas.classList.remove("hidden");
    const ctx = canvas.getContext("2d");
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const colors = ["#8b5cf6", "#3b82f6", "#10b981", "#fbbf24", "#f43f5e", "#22d3ee"];
    const particles = [];
    
    for (let i = 0; i < 140; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * canvas.height,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0,
            speed: Math.random() * 3 + 2.5
        });
    }
    
    let animationId;
    let frames = 0;
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let active = false;
        particles.forEach((p) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2 * p.speed;
            p.x += Math.sin(p.tiltAngle);
            p.tilt = Math.sin(p.tiltAngle - p.r / 2) * 12;
            
            if (p.y <= canvas.height) {
                active = true;
            }
            
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();
        });
        
        frames++;
        if (active && frames < 200) {
            animationId = requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.classList.add("hidden");
            cancelAnimationFrame(animationId);
        }
    }
    
    draw();
}

// ==========================================
// ANALYTICS MODAL METHODS
// ==========================================

function openAnalyticsModal() {
    const modal = document.getElementById("analytics-modal");
    if (!modal) return;
    
    modal.classList.remove("pointer-events-none", "opacity-0");
    modal.querySelector(".bg-slate-900").style.transform = "scale(1)";
    
    renderModalAnalytics();
}

function closeAnalyticsModal() {
    const modal = document.getElementById("analytics-modal");
    if (!modal) return;
    
    modal.classList.add("pointer-events-none", "opacity-0");
    modal.querySelector(".bg-slate-900").style.transform = "scale(0.95)";
}

function renderModalAnalytics() {
    const logs = state.history.slice(-7);
    const tbody = document.getElementById("history-table-body");
    
    if (logs.length === 0) {
        document.getElementById("modal-avg-habits").textContent = "0%";
        document.getElementById("modal-avg-water").textContent = "0 ml";
        document.getElementById("modal-avg-sleep").textContent = "0.0 hrs";
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">No logs saved yet. Log a day to view trends!</td></tr>`;
        return;
    }
    
    // 1. Calculate Averages
    let totalHabitRate = 0;
    let totalWater = 0;
    let totalSleep = 0;
    let loggedSleepDays = 0;
    
    logs.forEach(log => {
        totalHabitRate += log.completionRate;
        totalWater += log.waterMl;
        if (log.sleepHours > 0) {
            totalSleep += log.sleepHours;
            loggedSleepDays++;
        }
    });
    
    const avgHabit = Math.round(totalHabitRate / logs.length);
    const avgWater = Math.round(totalWater / logs.length);
    const avgSleep = loggedSleepDays > 0 ? (totalSleep / loggedSleepDays).toFixed(1) : "0.0";
    
    document.getElementById("modal-avg-habits").textContent = `${avgHabit}%`;
    document.getElementById("modal-avg-water").textContent = `${avgWater} ml`;
    document.getElementById("modal-avg-sleep").textContent = `${avgSleep} hrs`;
    
    // 2. Render History Table Rows (Reverse order - newest first)
    tbody.innerHTML = "";
    [...logs].reverse().forEach(log => {
        const row = document.createElement("tr");
        row.className = "border-b border-slate-800/40 hover:bg-slate-900/35 transition-colors";
        
        row.innerHTML = `
            <td class="p-3 font-semibold">${formatShortDate(log.date)}</td>
            <td class="p-3 text-center font-bold text-emerald-400">${log.completionRate}%</td>
            <td class="p-3 text-center font-bold text-blue-400">${log.waterMl} ml</td>
            <td class="p-3 text-center text-slate-400">${log.sleepHours > 0 ? log.sleepHours.toFixed(1) + ' hrs' : '<span class="opacity-30">-</span>'}</td>
        `;
        tbody.appendChild(row);
    });
    
    // 3. Render Large SVG Chart in Modal (Dual-Line: Habits & Water)
    renderModalChart(logs);
}

function renderModalChart(logs) {
    const svg = document.getElementById("modal-analytics-chart");
    if (!svg) return;
    
    svg.innerHTML = "";
    
    const svgWidth = svg.clientWidth || 550;
    const svgHeight = svg.clientHeight || 200;
    
    const mLeft = 32;
    const mRight = 15;
    const mTop = 15;
    const mBottom = 22;
    
    const chartWidth = svgWidth - mLeft - mRight;
    const chartHeight = svgHeight - mTop - mBottom;
    
    // Grid lines
    const gridDivisions = 4;
    for (let i = 0; i <= gridDivisions; i++) {
        const percent = (i / gridDivisions) * 100;
        const y = mTop + chartHeight - (i / gridDivisions) * chartHeight;
        
        // Grid Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", mLeft);
        line.setAttribute("y1", y);
        line.setAttribute("x2", svgWidth - mRight);
        line.setAttribute("y2", y);
        line.setAttribute("class", "chart-grid-line");
        svg.appendChild(line);
        
        // Label
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", mLeft - 6);
        text.setAttribute("y", y + 4);
        text.setAttribute("text-anchor", "end");
        text.setAttribute("fill", "#64748b");
        text.setAttribute("font-size", "9");
        text.setAttribute("font-weight", "bold");
        text.textContent = `${percent}%`;
        svg.appendChild(text);
    }
    
    // Calculate coordinates for both curves
    const pointsHabits = [];
    const pointsWater = [];
    
    logs.forEach((log, index) => {
        const x = mLeft + (index / (logs.length - 1 || 1)) * chartWidth;
        const yHabits = mTop + chartHeight - (log.completionRate / 100) * chartHeight;
        const waterPercent = Math.min(100, Math.round((log.waterMl / 2000) * 100));
        const yWater = mTop + chartHeight - (waterPercent / 100) * chartHeight;
        
        pointsHabits.push({ x, y: yHabits, val: log.completionRate, date: log.date });
        pointsWater.push({ x, y: yWater, val: log.waterMl, date: log.date, pct: waterPercent });
    });
    
    // Setup Gradients in Defs
    let defs = svg.querySelector("defs");
    if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        defs.innerHTML = `
            <linearGradient id="modalHabitsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.0" />
            </linearGradient>
            <linearGradient id="modalWaterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
            </linearGradient>
        `;
        svg.appendChild(defs);
    }
    
    // Draw Area and Line for Habits (Purple)
    if (pointsHabits.length > 1) {
        const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let dArea = `M ${pointsHabits[0].x} ${mTop + chartHeight}`;
        pointsHabits.forEach(p => dArea += ` L ${p.x} ${p.y}`);
        dArea += ` L ${pointsHabits[pointsHabits.length - 1].x} ${mTop + chartHeight} Z`;
        area.setAttribute("d", dArea);
        area.setAttribute("fill", "url(#modalHabitsGrad)");
        area.setAttribute("class", "chart-area");
        svg.appendChild(area);
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let dLine = `M ${pointsHabits[0].x} ${pointsHabits[0].y}`;
        for (let i = 1; i < pointsHabits.length; i++) {
            dLine += ` L ${pointsHabits[i].x} ${pointsHabits[i].y}`;
        }
        line.setAttribute("d", dLine);
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", "#8b5cf6");
        line.setAttribute("class", "chart-line");
        svg.appendChild(line);
    }
    
    // Draw Area and Line for Water (Blue)
    if (pointsWater.length > 1) {
        const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let dArea = `M ${pointsWater[0].x} ${mTop + chartHeight}`;
        pointsWater.forEach(p => dArea += ` L ${p.x} ${p.y}`);
        dArea += ` L ${pointsWater[pointsWater.length - 1].x} ${mTop + chartHeight} Z`;
        area.setAttribute("d", dArea);
        area.setAttribute("fill", "url(#modalWaterGrad)");
        area.setAttribute("class", "chart-area");
        svg.appendChild(area);
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let dLine = `M ${pointsWater[0].x} ${pointsWater[0].y}`;
        for (let i = 1; i < pointsWater.length; i++) {
            dLine += ` L ${pointsWater[i].x} ${pointsWater[i].y}`;
        }
        line.setAttribute("d", dLine);
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", "#3b82f6");
        line.setAttribute("class", "chart-line");
        svg.appendChild(line);
    }
    
    // Draw Markers & X Labels
    pointsHabits.forEach((p, idx) => {
        const pw = pointsWater[idx];
        
        // X Label
        const xText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        xText.setAttribute("x", p.x);
        xText.setAttribute("y", mTop + chartHeight + 14);
        xText.setAttribute("text-anchor", "middle");
        xText.setAttribute("fill", "#64748b");
        xText.setAttribute("font-size", "9");
        xText.setAttribute("font-weight", "bold");
        xText.textContent = formatShortDate(p.date);
        svg.appendChild(xText);

        // Water Dot
        const dotWater = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dotWater.setAttribute("cx", pw.x);
        dotWater.setAttribute("cy", pw.y);
        dotWater.setAttribute("r", "4");
        dotWater.setAttribute("fill", "#3b82f6");
        dotWater.setAttribute("stroke", "#0f172a");
        dotWater.setAttribute("stroke-width", "1.5");
        dotWater.setAttribute("class", "chart-point");
        
        const titleW = document.createElementNS("http://www.w3.org/2000/svg", "title");
        titleW.textContent = `${formatShortDate(pw.date)} - Hydration: ${pw.val}ml (${pw.pct}%)`;
        dotWater.appendChild(titleW);
        svg.appendChild(dotWater);

        // Habits Dot
        const dotHabit = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        dotHabit.setAttribute("cx", p.x);
        dotHabit.setAttribute("cy", p.y);
        dotHabit.setAttribute("r", "4");
        dotHabit.setAttribute("fill", "#8b5cf6");
        dotHabit.setAttribute("stroke", "#0f172a");
        dotHabit.setAttribute("stroke-width", "1.5");
        dotHabit.setAttribute("class", "chart-point");
        
        const titleH = document.createElementNS("http://www.w3.org/2000/svg", "title");
        titleH.textContent = `${formatShortDate(p.date)} - Habit Completion: ${p.val}%`;
        dotHabit.appendChild(titleH);
        svg.appendChild(dotHabit);
    });
}

// Handle window resizing for chart updates
window.addEventListener("resize", () => {
    if (state) {
        renderAnalyticsChart();
        const modal = document.getElementById("analytics-modal");
        if (modal && !modal.classList.contains("opacity-0")) {
            renderModalAnalytics();
        }
    }
});

// ==========================================
// HUMAN HERO AVATAR METHODS
// ==========================================

const GREETINGS = [
    "Welcome back, adventurer! Ready to crush today's routine?",
    "Every habit completed is a step closer to leveling up! 🚀",
    "How is your water intake today? Hydration is key! 💧",
    "A level 10 hero was once a level 1 beginner. Keep going!",
    "Your cyber pet companion is looking happy and proud of you! ✨",
    "Did you sleep well? Remember to log your rest duration! 🌙",
    "Consistency is the ultimate superpower. Let's do this! 💪",
    "One daily checkmark at a time, we build a legacy! 🏆",
    "Do you want to rename me? Click the pen icon next to my name!",
    "Stay focused, stay disciplined, and level up your life!"
];

function updateHeroBubble(message) {
    const bubble = document.getElementById("hero-bubble");
    if (!bubble) return;
    bubble.textContent = message;
    
    // Scale bounce text animation
    bubble.style.transform = "scale(0.95)";
    setTimeout(() => {
        bubble.style.transform = "scale(1)";
    }, 100);
}

function speakGreeting() {
    const hours = new Date().getHours();
    let welcome = "";
    if (hours >= 5 && hours < 12) {
        welcome = "Good morning! Sunrise brings new daily quests. Let's start strong! ☀️";
    } else if (hours >= 12 && hours < 18) {
        welcome = "Good afternoon, explorer! Hope you're staying hydrated and active. ⚡";
    } else {
        welcome = "Good evening! Tally your achievements and log your sleep. 🌙";
    }
    updateHeroBubble(welcome);
}

function triggerHeroMotivation() {
    const quote = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    updateHeroBubble(quote);
    playTalkSound();
}

function playTalkSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
    } catch (e) {}
}

function renameUserPrompt(event) {
    event.stopPropagation();
    const newName = prompt("Rename your Hero Character:", state.profile.userName);
    if (newName && newName.trim() !== "") {
        state.profile.userName = newName.trim().substring(0, 18);
        saveState();
        renderApp();
        updateHeroBubble(`Pleasure meeting you, ${state.profile.userName}! Let's make today count.`);
    }
}

function toggleGender(event) {
    event.stopPropagation();
    state.profile.gender = state.profile.gender === "boy" ? "girl" : "boy";
    saveState();
    renderApp();
    updateHeroBubble(`Representation updated! Metamorphosed into ${state.profile.gender === "boy" ? "Boy Explorer" : "Girl Explorer"}. 👋`);
    playTalkSound();
}

function drawHeroAvatar() {
    const gender = state.profile.gender || "girl";
    
    let svgContent = `
    <svg viewBox="0 0 100 100" class="w-full h-full">
        <defs>
            <!-- Skin Gradient -->
            <linearGradient id="heroSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#ffe4e6" />
                <stop offset="100%" stop-color="#fecdd3" />
            </linearGradient>
            <!-- Suit Gradient -->
            <linearGradient id="heroSuit" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0f172a" />
                <stop offset="100%" stop-color="#2e1042" />
            </linearGradient>
            <!-- Girl Hair (Magenta/Pink) -->
            <linearGradient id="girlHair" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#f472b6" />
                <stop offset="100%" stop-color="#db2777" />
            </linearGradient>
            <!-- Boy Hair (Blue/Cyan) -->
            <linearGradient id="boyHair" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#22d3ee" />
                <stop offset="100%" stop-color="#0284c7" />
            </linearGradient>
            <!-- Eye Goggles filter -->
            <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        <!-- Background -->
        <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#8b5cf6" stroke-width="1.5" stroke-opacity="0.3" />
        <circle cx="50" cy="50" r="41" fill="#020617" />
    `;

    if (gender === "girl") {
        svgContent += `
        <!-- Twin Tails (Back hair) -->
        <g class="animate-[bounceHair_2.5s_infinite_ease-in-out]" style="transform-origin: 30px 30px;">
            <path d="M28 32 C15 32, 8 45, 10 58 C12 65, 20 62, 24 50 Z" fill="url(#girlHair)" />
        </g>
        <g class="animate-[bounceHair_2.5s_infinite_ease-in-out]" style="transform-origin: 70px 30px; animation-delay: 1.25s;">
            <path d="M72 32 C85 32, 92 45, 90 58 C88 65, 80 62, 76 50 Z" fill="url(#girlHair)" />
        </g>

        <!-- Shoulders / Torso -->
        <path d="M25 85 C25 73, 32 68, 50 68 C68 68, 75 73, 75 85 Z" fill="url(#heroSuit)" stroke="#8b5cf6" stroke-width="1" />
        <!-- Collar -->
        <path d="M42 68 L50 78 L58 68" fill="none" stroke="#f472b6" stroke-width="1.5" />

        <!-- Neck -->
        <rect x="45" y="60" width="10" height="9" fill="url(#heroSkin)" />

        <!-- Face -->
        <ellipse cx="50" cy="45" rx="17" ry="18" fill="url(#heroSkin)" />

        <!-- Eyes -->
        <circle cx="43" cy="43" r="2.2" fill="#0f172a" />
        <circle cx="44" cy="42" r="0.7" fill="#ffffff" />
        <circle cx="57" cy="43" r="2.2" fill="#0f172a" />
        <circle cx="58" cy="42" r="0.7" fill="#ffffff" />
        
        <!-- Blush -->
        <ellipse cx="37" cy="48" rx="2" ry="1" fill="#f43f5e" opacity="0.6" />
        <ellipse cx="63" cy="48" rx="2" ry="1" fill="#f43f5e" opacity="0.6" />

        <!-- Mouth -->
        <path d="M47 52 Q50 56, 53 52" fill="none" stroke="#be123c" stroke-width="1.5" stroke-linecap="round" />

        <!-- Hair Front / Bangs -->
        <path d="M33 34 C33 24, 67 24, 67 34 C67 36, 60 30, 50 32 C40 30, 33 36, 33 34 Z" fill="url(#girlHair)" />
        <path d="M33 34 L37 40 L41 35 L47 41 L53 35 L59 40 L67 34" fill="none" stroke="url(#girlHair)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Hair Ribbon clips -->
        <circle cx="30" cy="30" r="2.5" fill="#facc15" />
        <circle cx="70" cy="30" r="2.5" fill="#facc15" />

        <!-- Waving arm/hand -->
        <g class="animate-wave-hand" style="transform-origin: 75px 82px;">
            <path d="M72 80 C74 65, 78 58, 83 48 C85 45, 89 47, 87 52 C82 62, 79 72, 77 82 Z" fill="url(#heroSkin)" stroke="#e11d48" stroke-width="0.5" />
            <!-- Glove sleeve -->
            <path d="M71 78 L79 81 Z" stroke="#8b5cf6" stroke-width="3" />
            <!-- Hand / Fingers waving details -->
            <circle cx="83" cy="46" r="3" fill="url(#heroSkin)" />
            <path d="M81 44 L80 38 M83 43 L84 37 M85 45 L87 39 M82 46 L82 43" stroke="url(#heroSkin)" stroke-width="1.2" stroke-linecap="round" />
        </g>
        `;
    } else {
        // BOY CHARACTER
        svgContent += `
        <!-- Shoulders / Torso -->
        <path d="M25 85 C25 73, 32 68, 50 68 C68 68, 75 73, 75 85 Z" fill="url(#heroSuit)" stroke="#0284c7" stroke-width="1" />
        <!-- Collar -->
        <path d="M42 68 L50 78 L58 68" fill="none" stroke="#22d3ee" stroke-width="1.5" />

        <!-- Neck -->
        <rect x="45" y="60" width="10" height="9" fill="url(#heroSkin)" />

        <!-- Face -->
        <ellipse cx="50" cy="45" rx="17" ry="18" fill="url(#heroSkin)" />

        <!-- Eyes -->
        <circle cx="43" cy="43" r="2.2" fill="#0f172a" />
        <circle cx="44" cy="42" r="0.7" fill="#ffffff" />
        <circle cx="57" cy="43" r="2.2" fill="#0f172a" />
        <circle cx="58" cy="42" r="0.7" fill="#ffffff" />

        <!-- Blush -->
        <ellipse cx="37" cy="48" rx="2" ry="1" fill="#0284c7" opacity="0.3" />
        <ellipse cx="63" cy="48" rx="2" ry="1" fill="#0284c7" opacity="0.3" />

        <!-- Mouth -->
        <path d="M47 52 Q50 56, 53 52" fill="none" stroke="#be123c" stroke-width="1.5" stroke-linecap="round" />

        <!-- Hair Front / Spiky Boy hair -->
        <path d="M33 34 C33 22, 67 22, 67 34 C67 34, 70 32, 69 28 C67 24, 60 22, 50 22 C40 22, 33 24, 31 28 C30 32, 33 34, 33 34 Z" fill="url(#boyHair)" />
        <path d="M31 32 L36 39 L40 33 L45 40 L50 32 L56 40 L61 33 L67 34 L69 38" fill="none" stroke="url(#boyHair)" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Cyber Cap/Visor band -->
        <path d="M33 30 Q50 25, 67 30 L65 34 Q50 30, 35 34 Z" fill="#0f172a" stroke="#22d3ee" stroke-width="0.8" />
        <rect x="42" y="24" width="16" height="5" rx="1.5" fill="#22d3ee" class="animate-pulse" />

        <!-- Waving arm/hand -->
        <g class="animate-wave-hand" style="transform-origin: 75px 82px;">
            <path d="M72 80 C74 65, 78 58, 83 48 C85 45, 89 47, 87 52 C82 62, 79 72, 77 82 Z" fill="url(#heroSkin)" stroke="#025a87" stroke-width="0.5" />
            <!-- Sleeve edge -->
            <path d="M71 78 L79 81 Z" stroke="#0284c7" stroke-width="3" />
            <!-- Hand / Fingers waving details -->
            <circle cx="83" cy="46" r="3" fill="url(#heroSkin)" />
            <path d="M81 44 L80 38 M83 43 L84 37 M85 45 L87 39 M82 46 L82 43" stroke="url(#heroSkin)" stroke-width="1.2" stroke-linecap="round" />
        </g>
        `;
    }

    svgContent += `</svg>`;
    return svgContent;
}

// Initialize app when DOM is fully loaded
window.addEventListener("DOMContentLoaded", () => {
    initState();
    renderApp();
    
    // Bind Analytics Modal opening / closing triggers
    document.getElementById("analytics-card").addEventListener("click", openAnalyticsModal);
    document.getElementById("close-analytics-btn").addEventListener("click", closeAnalyticsModal);
    document.getElementById("analytics-modal").addEventListener("click", (e) => {
        if (e.target === document.getElementById("analytics-modal")) {
            closeAnalyticsModal();
        }
    });

    // Bind Hero Avatar motivational interaction
    document.getElementById("hero-svg-container").addEventListener("click", triggerHeroMotivation);
    
    // Welcome Greeting Speech Bubble text initialization
    speakGreeting();
});
