# Gamified-Dashboard
# 🎮 Questify: Gamified Daily Habit & Wellness Dashboard

Questify is a comprehensive, responsive single-page web application designed to turn daily self-improvement into an immersive RPG (Role-Playing Game) experience. By treating habits as daily tasks and goals as quests, users earn experience points (XP), level up their digital avatars, track wellness metrics, and maintain performance streaks.

Built with a focus on client-side performance, local persistence, and highly responsive user interfaces.

---

## ✨ Features

### ⚔️ The RPG Engine
*   **Progressive Leveling:** Level up your avatar using a custom scalability algorithm: 
    $$\text{XP Needed} = 100 \times (\text{Current Level})^{1.2}$$
*   **Dynamic XP Drops:** Earn $+10\text{ XP}$ for habits, $+25\text{ XP}$ for quests, and $+2\text{ XP}$ for staying hydrated.
*   **Level Up Celebrations:** Visual micro-interactions and celebratory states trigger immediately upon crossing XP thresholds.

### 📅 Habit & Quest Tracking
*   **Smart Streak Logic:** Track daily consistency with automated streak tracking that penalizes skipped days and rewards unbroken chains.
*   **Dailies vs. Quests:** Separate long-term recurring behaviors (Habits) from one-off tasks (Quests).
*   **"Simulate New Day" Mode:** A built-in testing toggle to simulate midnight roll-overs and test streak preservation mechanics instantly.

### 💧 Integrated Wellness Suite
*   **Fluid Hydration Tracker:** Interactive container animation updating fluid intake incrementally (+250ml clicks) toward a 2000ml goal.
*   **Sleep Logging Matrix:** Correlate daily habits against sleep duration and qualitative star ratings.
*   **7-Day Analytics:** Fully responsive SVG charts generating visual insights into your weekly habit completion frequencies.

---

## 🛠️ Architecture & Tech Stack

*   **Frontend UI:** HTML5, Tailwind CSS (Modern Dark-Slate Theme with Neon Accents)
*   **State Machine:** Centralized Reactive State Engine built in pure Vanilla JavaScript
*   **Data Persistence:** `localStorage` API for instant JSON serialization/deserialization (zero backend dependency)
*   **Graphics & Assets:** Code-native SVG vectors for the modular scaling avatar system
