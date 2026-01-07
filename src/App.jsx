import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { startAudio, startMusic, stopMusic, sfx, toggleMute, isMuted } from './audio';

// ═══════════════════════════════════════════════════════════════
//  ELEVATOR ACTION - Web Edition
// ═══════════════════════════════════════════════════════════════

const FLOORS = 10;
const WIDTH = 50;
const BASE_CELL_W = 16;
const BASE_CELL_H = 32;
const ASPECT_RATIO = (WIDTH * BASE_CELL_W) / (FLOORS * BASE_CELL_H);

const GAME = { TITLE: 0, PLAY: 1, OVER: 2, WIN: 3 };

const COLORS = {
  bg: '#0a0a0a',
  floor: '#1a1a1a',
  floorLine: '#333333',
  player: '#00ff00',
  playerDuck: '#00cc00',
  enemy: '#ff4444',
  elevator: '#444444',
  elevatorCar: '#666666',
  elevatorShaft: '#222222',
  redDoor: '#ff6600',
  redDoorCollected: '#332200',
  blueDoor: '#4488ff',
  bulletPlayer: '#00ff00',
  bulletEnemy: '#ff0000',
  text: '#00ff00',
};

const createLevel = () => ({
  redDoors: [
    { floor: 1, x: 25 }, { floor: 2, x: 10 }, { floor: 3, x: 40 },
    { floor: 4, x: 12 }, { floor: 5, x: 35 }, { floor: 6, x: 25 },
    { floor: 7, x: 42 }, { floor: 8, x: 10 }
  ],
  blueDoors: [
    { floor: 2, x: 38 }, { floor: 3, x: 30 }, { floor: 5, x: 15 },
    { floor: 6, x: 38 }, { floor: 8, x: 40 }
  ],
  elevatorX: [15, 35],
  exitX: 25 // Exit door position on floor 0 (center)
});

const initState = () => {
  const level = createLevel();
  return {
    mode: GAME.TITLE,
    px: 25, pf: 9, pdir: 1, duck: false, inElev: -1,
    elevFloor: [9, 0],
    enemies: [],
    bullets: [],
    explosions: [], // Visual explosion effects
    docs: level.redDoors.map(() => false),
    score: 0, lives: 3, tick: 0,
    level
  };
};

// Calculate canvas size to fill screen
const getCanvasSize = () => {
  const padding = 40;
  const maxW = window.innerWidth - padding;
  const maxH = window.innerHeight - padding;

  let w, h;
  if (maxW / maxH > ASPECT_RATIO) {
    h = maxH;
    w = h * ASPECT_RATIO;
  } else {
    w = maxW;
    h = w / ASPECT_RATIO;
  }

  return {
    width: Math.floor(w),
    height: Math.floor(h),
    cellW: Math.floor(w) / WIDTH,
    cellH: Math.floor(h) / FLOORS
  };
};

export default function App() {
  const canvasRef = useRef(null);
  const stateRef = useRef(initState());
  const keysRef = useRef(new Set());
  const lastTickRef = useRef(0);
  const [canvasSize, setCanvasSize] = useState(getCanvasSize);
  const [, forceUpdate] = useState(0);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setCanvasSize(getCanvasSize());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getState = () => stateRef.current;
  const setState = (updater) => {
    stateRef.current = typeof updater === 'function'
      ? updater(stateRef.current)
      : { ...stateRef.current, ...updater };
    forceUpdate(n => n + 1);
  };

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyE', 'KeyD', 'KeyM', 'Escape'].includes(e.code)) {
        e.preventDefault();
        keysRef.current.add(e.code);

        // Mute toggle (immediate)
        if (e.code === 'KeyM') {
          toggleMute();
          forceUpdate(n => n + 1);
        }
      }
    };
    const handleKeyUp = (e) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Process input - only one-shot actions (not movement)
  const processInput = useCallback(() => {
    const s = getState();
    const keys = keysRef.current;

    if (s.mode === GAME.TITLE && keys.has('Space')) {
      keys.delete('Space');
      startAudio().then(() => {
        sfx.start();
        startMusic();
      });
      setState({ mode: GAME.PLAY });
      return;
    }

    if ((s.mode === GAME.OVER || s.mode === GAME.WIN) && keys.has('Space')) {
      keys.delete('Space');
      stateRef.current = initState();
      startMusic();
      sfx.start();
      setState({ mode: GAME.PLAY });
      return;
    }

    if (s.mode !== GAME.PLAY) return;

    const { level, elevFloor } = s;
    const n = { ...s };

    // Exit elevator (one-shot)
    if (s.inElev >= 0 && keys.has('KeyE')) {
      keys.delete('KeyE');
      n.inElev = -1;
      n.px = level.elevatorX[s.inElev] + 4;
      sfx.elevator();
      setState(n);
      return;
    }

    // Duck toggle (one-shot)
    if (keys.has('KeyD')) {
      keys.delete('KeyD');
      n.duck = !s.duck;
      if (n.duck) {
        sfx.duck();
      } else {
        sfx.unduck();
      }
    }

    // Shoot (one-shot)
    if (keys.has('Space') && !s.duck && s.inElev < 0) {
      keys.delete('Space');
      n.bullets = [...s.bullets, { x: s.px, floor: s.pf, dir: s.pdir, enemy: false }];
      sfx.shoot();
    }

    // Enter elevator (one-shot)
    if (keys.has('KeyE') && s.inElev < 0) {
      keys.delete('KeyE');
      const ei = level.elevatorX.findIndex((ex, i) => elevFloor[i] === s.pf && Math.abs(ex - s.px) < 5);
      if (ei >= 0) {
        n.inElev = ei;
        n.px = level.elevatorX[ei] + 1;
        sfx.elevator();
      }
    }

    setState(n);
  }, []);

  // Game tick (physics, AI, collisions, movement)
  const gameTick = useCallback(() => {
    const s = getState();
    if (s.mode !== GAME.PLAY) return;

    const keys = keysRef.current;
    const { level, elevFloor } = s;
    const n = { ...s, tick: s.tick + 1 };

    // Update explosions - fade out and remove dead ones
    n.explosions = s.explosions
      .map(exp => ({ ...exp, life: exp.life - 1 }))
      .filter(exp => exp.life > 0);

    // Elevator movement (throttled)
    if (s.inElev >= 0) {
      const ef = elevFloor[s.inElev];
      if (keys.has('ArrowUp') && ef > 0) {
        n.elevFloor = elevFloor.map((f, i) => i === s.inElev ? f - 1 : f);
        n.pf = ef - 1;
        sfx.elevator();
      }
      if (keys.has('ArrowDown') && ef < FLOORS - 1) {
        n.elevFloor = elevFloor.map((f, i) => i === s.inElev ? f + 1 : f);
        n.pf = ef + 1;
        sfx.elevator();
      }
    } else {
      // Walking (throttled)
      let moved = false;
      if (keys.has('ArrowLeft') && !s.duck) {
        n.px = Math.max(2, s.px - 2);
        n.pdir = -1;
        moved = true;
      }
      if (keys.has('ArrowRight') && !s.duck) {
        n.px = Math.min(WIDTH - 2, s.px + 2);
        n.pdir = 1;
        moved = true;
      }
      // Footstep sound every other tick when walking
      if (moved && n.tick % 2 === 0) {
        sfx.footstep();
      }

      // Collect docs - larger collection radius (5 units)
      const docsBeforeCount = n.docs.filter(d => d).length;
      level.redDoors.forEach((d, i) => {
        if (!n.docs[i] && d.floor === n.pf && Math.abs(d.x - n.px) < 5) {
          n.docs = n.docs.map((v, j) => j === i ? true : v);
          n.score += 500;
          sfx.collectDoc();
        }
      });
      // Check if all docs now collected
      const docsAfterCount = n.docs.filter(d => d).length;
      if (docsAfterCount === n.docs.length && docsBeforeCount < n.docs.length) {
        sfx.allDocsCollected();
      }
    }

    // Move bullets
    n.bullets = s.bullets
      .map(b => ({ ...b, x: b.x + b.dir * 3 })) // Faster bullets
      .filter(b => b.x > 0 && b.x < WIDTH);

    // Copy enemies for hit detection
    let enemiesHit = [];

    // Bullet hits - check against current enemies with larger hit radius
    n.bullets = n.bullets.filter(b => {
      if (!b.enemy) {
        // Player bullet hitting enemy - larger hit box (6 units)
        const hitIdx = s.enemies.findIndex((e, idx) =>
          !enemiesHit.includes(idx) &&
          e.floor === b.floor &&
          Math.abs(e.x - b.x) < 6
        );
        if (hitIdx >= 0) {
          const hitEnemy = s.enemies[hitIdx];
          enemiesHit.push(hitIdx);
          n.score += 100;
          sfx.enemyHit();
          // Create explosion effect
          n.explosions.push({
            x: hitEnemy.x,
            floor: hitEnemy.floor,
            life: 10, // frames to live
            particles: Array.from({ length: 8 }, () => ({
              dx: (Math.random() - 0.5) * 4,
              dy: (Math.random() - 0.5) * 4
            }))
          });
          return false;
        }
      } else {
        // Enemy bullet hitting player - check player position
        if (b.floor === s.pf && Math.abs(b.x - s.px) < 4 && !s.duck && s.inElev < 0) {
          n.lives = s.lives - 1;
          sfx.playerHit();
          if (n.lives <= 0) {
            n.mode = GAME.OVER;
            stopMusic();
            sfx.gameOver();
          }
          return false;
        }
      }
      return true;
    });

    // Remove hit enemies and apply AI to survivors
    const survivingEnemies = s.enemies.filter((_, idx) => !enemiesHit.includes(idx));

    // Enemy AI - only for surviving enemies
    n.enemies = survivingEnemies.map(e => {
      const ne = { ...e };
      if (e.floor === s.pf) {
        ne.dir = s.px > e.x ? 1 : -1;
        if (Math.random() < 0.02) {
          n.bullets.push({ x: e.x, floor: e.floor, dir: ne.dir, enemy: true });
          sfx.enemyShoot();
        }
      }
      if (Math.random() < 0.2) {
        ne.x = Math.max(2, Math.min(WIDTH - 2, ne.x + ne.dir * 0.5));
      }
      return ne;
    });

    // Spawn enemies
    if (Math.random() < 0.01 && n.enemies.length < 4) {
      const bd = s.level.blueDoors[Math.floor(Math.random() * s.level.blueDoors.length)];
      n.enemies.push({ x: bd.x, floor: bd.floor, dir: Math.random() > 0.5 ? 1 : -1 });
      sfx.enemySpawn();
    }

    // Win check - must reach exit door on floor 0
    if (n.docs.every(d => d) && s.pf === 0 && Math.abs(n.px - level.exitX) < 4) {
      n.mode = GAME.WIN;
      n.score += 5000;
      stopMusic();
      sfx.win();
    }

    setState(n);
  }, []);

  // Render to canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = getState();
    const { level, px, pf, pdir, duck, inElev, elevFloor, enemies, bullets, docs, explosions } = s;
    const { width: CANVAS_W, height: CANVAS_H, cellW: CELL_W, cellH: CELL_H } = canvasSize;

    // Clear
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw floors
    for (let f = 0; f < FLOORS; f++) {
      const y = f * CELL_H;

      // Floor background
      ctx.fillStyle = COLORS.floor;
      ctx.fillRect(0, y, CANVAS_W, CELL_H);

      // Floor line at bottom
      ctx.fillStyle = COLORS.floorLine;
      ctx.fillRect(0, y + CELL_H - 2, CANVAS_W, 2);
    }

    // Draw elevator shafts
    level.elevatorX.forEach((ex, ei) => {
      for (let f = 0; f < FLOORS; f++) {
        const x = ex * CELL_W;
        const y = f * CELL_H;

        // Shaft
        ctx.fillStyle = COLORS.elevatorShaft;
        ctx.fillRect(x, y, CELL_W * 3, CELL_H);

        // Shaft lines
        ctx.fillStyle = COLORS.elevator;
        ctx.fillRect(x, y, 2, CELL_H);
        ctx.fillRect(x + CELL_W * 3 - 2, y, 2, CELL_H);

        // Elevator car
        if (elevFloor[ei] === f) {
          ctx.fillStyle = COLORS.elevatorCar;
          ctx.fillRect(x + 2, y + 4, CELL_W * 3 - 4, CELL_H - 8);

          // Player in elevator
          if (inElev === ei) {
            ctx.fillStyle = COLORS.player;
            ctx.fillRect(x + CELL_W, y + 8, CELL_W, CELL_H - 16);
          }
        }
      }
    });

    // Draw red doors (documents) with emoji
    const emojiSize = Math.max(16, CELL_H * 0.7);
    level.redDoors.forEach((d, i) => {
      const x = d.x * CELL_W;
      const y = d.floor * CELL_H;

      // Door background
      ctx.fillStyle = docs[i] ? '#222' : '#442200';
      ctx.fillRect(x, y + 4, CELL_W * 2, CELL_H - 8);

      // Emoji
      ctx.font = `${emojiSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(docs[i] ? '✅' : '📁', x + CELL_W, y + CELL_H / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      // Glow effect for uncollected
      if (!docs[i]) {
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 10;
        ctx.fillRect(x, y + 4, 0, 0); // trigger shadow
        ctx.shadowBlur = 0;
      }
    });

    // Draw blue doors (spawn points) with emoji
    level.blueDoors.forEach(d => {
      const x = d.x * CELL_W;
      const y = d.floor * CELL_H;

      // Door background
      ctx.fillStyle = '#223344';
      ctx.fillRect(x, y + 4, CELL_W * 2, CELL_H - 8);

      // Emoji
      ctx.font = `${emojiSize}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚪', x + CELL_W, y + CELL_H / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    });

    // Draw exit door on floor 0
    const allDocsCollected = docs.every(d => d);
    const exitX = level.exitX * CELL_W;
    const exitY = 0; // Floor 0

    // Pulsing effect when all docs collected
    if (allDocsCollected) {
      const pulse = Math.sin(Date.now() / 150) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(0, 255, 0, ${pulse})`;
      ctx.fillRect(exitX - 4, exitY, CELL_W * 2 + 8, CELL_H);
    }

    // Door background
    ctx.fillStyle = allDocsCollected ? '#005500' : '#222';
    ctx.fillRect(exitX, exitY + 4, CELL_W * 2, CELL_H - 8);

    // Exit emoji
    ctx.font = `${emojiSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(allDocsCollected ? '🚀' : '🔒', exitX + CELL_W, exitY + CELL_H / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Draw enemies
    enemies.forEach(e => {
      const x = e.x * CELL_W;
      const y = e.floor * CELL_H;
      ctx.fillStyle = COLORS.enemy;
      ctx.fillRect(x - CELL_W / 2, y + 4, CELL_W, CELL_H - 8);

      // Enemy direction indicator
      ctx.fillStyle = '#ff6666';
      const eyeX = e.dir > 0 ? x + 2 : x - 6;
      ctx.fillRect(eyeX, y + 10, 4, 4);
    });

    // Draw player (if not in elevator)
    if (inElev < 0) {
      const x = px * CELL_W;
      const y = pf * CELL_H;

      if (duck) {
        ctx.fillStyle = COLORS.playerDuck;
        ctx.fillRect(x - CELL_W / 2, y + CELL_H - 12, CELL_W, 8);
      } else {
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(x - CELL_W / 2, y + 4, CELL_W, CELL_H - 8);

        // Direction indicator
        ctx.fillStyle = '#00ff88';
        const eyeX = pdir > 0 ? x + 2 : x - 6;
        ctx.fillRect(eyeX, y + 10, 4, 4);
      }
    }

    // Draw bullets
    bullets.forEach(b => {
      const x = b.x * CELL_W;
      const y = b.floor * CELL_H + CELL_H / 2;
      ctx.fillStyle = b.enemy ? COLORS.bulletEnemy : COLORS.bulletPlayer;
      ctx.fillRect(x - 4, y - 2, 8, 4);

      // Bullet trail
      ctx.globalAlpha = 0.5;
      ctx.fillRect(x - b.dir * 8 - 4, y - 1, 6, 2);
      ctx.globalAlpha = 1;
    });

    // Draw explosions
    explosions.forEach(exp => {
      const baseX = exp.x * CELL_W;
      const baseY = exp.floor * CELL_H + CELL_H / 2;
      const alpha = exp.life / 10;

      // Draw explosion particles
      exp.particles.forEach((p, i) => {
        const px = baseX + p.dx * (10 - exp.life) * 2;
        const py = baseY + p.dy * (10 - exp.life) * 2;
        const size = Math.max(2, 8 * alpha);

        // Colorful explosion
        const colors = ['#ff0000', '#ff6600', '#ffff00', '#ff3300'];
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = alpha;
        ctx.fillRect(px - size / 2, py - size / 2, size, size);
      });

      // Center flash
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * 0.8;
      const flashSize = 20 * alpha;
      ctx.fillRect(baseX - flashSize / 2, baseY - flashSize / 2, flashSize, flashSize);

      ctx.globalAlpha = 1;
    });

  }, [canvasSize]);

  // Main game loop
  useEffect(() => {
    let animationId;
    const TICK_RATE = 100; // ms between game logic updates

    const gameLoop = (timestamp) => {
      // Process input every frame for responsiveness
      processInput();

      // Game logic at fixed rate
      if (timestamp - lastTickRef.current >= TICK_RATE) {
        gameTick();
        lastTickRef.current = timestamp;
      }

      // Render every frame
      render();

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [processInput, gameTick, render]);

  const s = getState();
  const collected = s.docs.filter(d => d).length;

  return (
    <div className="game-container">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="game-canvas"
      />
      <div className="crt-overlay" />

      {s.mode === GAME.PLAY && (
        <>
          <div className="hud">
            <span className="hud-item hud-score">🎯 {String(s.score).padStart(5, '0')}</span>
            <span className="hud-item hud-lives">{'❤️'.repeat(s.lives)}{'🖤'.repeat(3 - s.lives)}</span>
            <span className="hud-item hud-docs">📁 {collected}/{s.docs.length}</span>
            <span className="hud-item hud-floor">🏢 FL{FLOORS - s.pf}</span>
            <span className="hud-item hud-sound">{isMuted() ? '🔇' : '🔊'}</span>
          </div>
          <div className="controls-hint">
            ⬅️➡️ Move | ⬆️⬇️ Elevator | 🔑E Enter/Exit | 🔫SPACE Shoot | 🦆D Duck | 🔊M Mute
          </div>
        </>
      )}

      {s.mode === GAME.TITLE && (
        <div className="title-screen">
          <h1>🛗 ELEVATOR</h1>
          <h2>💥 ACTION 💥</h2>
          <p className="instructions">
            📁 Collect all documents and escape to the ground floor! 🚪
          </p>
          <p className="instructions">
            ⬅️➡️ Move | ⬆️⬇️ Elevator | 🔑E Enter/Exit | 🔫SPACE Shoot | 🦆D Duck
          </p>
          <p className="start-prompt">[ 👆 PRESS SPACE TO START 👆 ]</p>
        </div>
      )}

      {(s.mode === GAME.OVER || s.mode === GAME.WIN) && (
        <div className={`game-over-screen ${s.mode === GAME.WIN ? 'win' : 'lose'}`}>
          <h1>{s.mode === GAME.WIN ? '🎉 MISSION COMPLETE! 🎉' : '💀 GAME OVER 💀'}</h1>
          <p className="score">🏆 Score: {s.score}</p>
          <p className="restart-prompt">[ 🔄 PRESS SPACE TO RESTART ]</p>
        </div>
      )}
    </div>
  );
}
