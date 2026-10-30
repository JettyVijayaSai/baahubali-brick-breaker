# Baahubali: The Brick Breaker - Mahishmati Metal Smasher ⚔️👑

A fast-paced, responsive 2D Brick Breaker tribute game inspired by Indian blockbuster cinema (S.S. Rajamouli's *Baahubali* & *Flying Balayya* tribute web games), built using HTML5 Canvas, Vanilla CSS, and JavaScript.

---

## 🎮 How to Play

Open `index.html` in any modern web browser:
```bash
# Simply double click index.html or open via local server / browser:
start C:\Users\hp\.gemini\antigravity\scratch\baahubali-brick-breaker\index.html
```

### Controls:
- **Mouse**: Move cursor horizontally to steer Baahubali's sword paddle.
- **Keyboard**: Use **A / D** or **Left (←) / Right (→)** arrow keys.
- **Spacebar**: Launch ball / Start game / Rise & battle again on Defeat or Victory.
- **Mobile Touch**: Touch & slide anywhere on the screen to control the sword.
- **M**: Toggle audio mute / unmute.

---

## 👑 Game Features & Mechanics

1. **Destructible Metal Ingots (The Targets)**:
   - **Bronze Bars** (1 hit to break, +100 pts, metallic copper tint with light bevel).
   - **Silver/Iron Bars** (2 hits to break, +250 pts, bright brushed chrome sheen, shows crack & dent overlay after 1st hit, triggers screen shake on smash).
   - **Royal Gold Bars** (3 hits to break, +500 pts, heavy radiant gold luster, chips on each hit, triggers heavy cinematic screen shake).
   - **Metal Impact Polish**: White and yellow spark particle bursts, flying metallic debris, and ping sound effects on every collision.

2. **Baahubali's Broadsword (The Paddle)**:
   - Centered horizontally on mouse/touch.
   - **Directional Bounce Physics**: Hitting near the outer edges reflects the ball at sharper horizontal angles (up to 65°); hitting near the hilt reflects it more vertically.
   - Horizontal velocity imparts a slicing impulse to the ball.

3. **Dynamic Character Swap & Dialogue System**:
   - **Consecutive Paddle Hits Counter**: Increments on every sword hit.
   - **Swap Every 3 Hits**: At multiples of 3 (3, 6, 9...), instantly triggers a transformation:
     - Rotates ball warrior sprite: `Baahubali` ➡️ `Bhallaladeva` ➡️ `Kattappa` ➡️ loop back.
     - Spawns expanding shockwaves and a character flash banner.
     - Plays `transform.mp3` (with procedural synth riser fallback).
   - **Cinema Dialogue Triggers**:
     - When the ball strikes the paddle or breaks a metal bar, plays one of the 3 voice lines assigned exclusively to the **currently active character**:
       - **Baahubali**: *"JAI MAHISHMATI!"*, *"NAA MAATAE SHASANAM!"*, *"EVADRA MAA RAJYAM JOLIKI VACHEDI!"*
       - **Bhallaladeva**: *"EE MAHISHMATI NAAKAE SOWNTHAM!"*, *"GADHA THO MUKKALU CHESTHA!"*, *"NANNU EVADU AAPALEDU!"*
       - **Kattappa**: *"RAAJU GAARI AAGNA!"*, *"MAHISHMATI SIMHASANAM KOSAME NAA PRANAM!"*, *"AYYA BAAHUBALI!"*

4. **Ball Physics & Visuals**:
   - Active character image clipped to a smooth circle with a glowing warrior aura ring.
   - Rotates continuously based on horizontal velocity with a fiery motion blur spark trail.
   - Ball speed subtly increases by a small factor (+1.8%) after every successful smash to escalate tension.

5. **Audio System with Dual Fallback Engine**:
   - Preloads HTML5 Audio with multi-voice clone pooling so clips overlap without clipping.
   - **Zero-Dependency Fallback**: If local MP3 files are missing during testing, the game automatically uses the **Web Audio API** (procedural metallic ingots ping, sword parry clash, transform risers, defeat drones, victory fanfares, and Mahishmati war drum cadence) and the **Web Speech API** for character dialogues!

---

## 📁 File & Asset Structure

```text
baahubali-brick-breaker/
├── index.html                   # Game structure & HUD overlays
├── style.css                    # Epic Indian cinema aesthetics (16:9 responsive)
├── script.js                    # Physics engine, swap mechanism, audio manager
├── README.md                    # Project documentation
└── assets/
    ├── bg.jpg                   # Mahishmati battlefield/palace backdrop
    ├── sword.png                # Baahubali's broadsword paddle
    ├── char1.png                # Character 1: Amarendra Baahubali avatar
    ├── char2.png                # Character 2: Bhallaladeva avatar
    ├── char3.png                # Character 3: Kattappa avatar
    ├── char1_audio1.mp3         # Baahubali dialogue 1 (Optional custom MP3)
    ├── char1_audio2.mp3         # Baahubali dialogue 2
    ├── char1_audio3.mp3         # Baahubali dialogue 3
    ├── char2_audio1.mp3         # Bhallaladeva dialogue 1
    ├── char2_audio2.mp3         # Bhallaladeva dialogue 2
    ├── char2_audio3.mp3         # Bhallaladeva dialogue 3
    ├── char3_audio1.mp3         # Kattappa dialogue 1
    ├── char3_audio2.mp3         # Kattappa dialogue 2
    ├── char3_audio3.mp3         # Kattappa dialogue 3
    ├── bgm.mp3                  # Cinematic battle loop
    ├── transform.mp3            # Character swap sound effect
    ├── game_over.mp3            # Defeat sound effect
    └── victory.mp3              # Victory theme sound effect
```
