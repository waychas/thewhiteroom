import {
  COLORS,
  DIRECTIONS,
  GAMES,
  colorClashRound,
  directionSwitchRound,
  findNumberRound,
  largerNumberRound,
  randomInt,
  sequenceRound,
  shapeMatchRound,
  uniqueFigureRound,
} from "./games.js";

const app = document.querySelector("#app");
const ROUND_MS = 45_000;
const POMODORO_MS = { focus: 25 * 60_000, short: 5 * 60_000, long: 15 * 60_000 };
let activeSession = null;
let readyKeyHandler = null;
let pomodoro = null;

function heading(game) {
  return `<a class="back-link" href="#/">← All games</a>
    <div class="game-heading"><h1>${game.name}</h1><p>${game.instruction}</p><p class="control-hint">${game.controls}</p></div>`;
}

function readHighScore(gameId) {
  try {
    return Math.max(0, Number(window.localStorage.getItem(`thewhiteroom:best:${gameId}`)) || 0);
  } catch {
    return 0;
  }
}

function renderHome() {
  app.innerHTML = `<div class="home-heading"><h1>Exercises</h1>
    <p class="home-intro">Choose a game. Each round lasts 45 seconds.</p></div>
    <div class="game-grid">${GAMES.map((game, index) => `<a class="game-card" href="#/game/${game.id}">
      <div class="card-top"><span class="card-number">${String(index + 1).padStart(2, "0")} / 09</span><span class="card-arrow" aria-hidden="true">↗</span></div>
      <h2>${game.name}</h2><p>${game.description}</p><p class="card-best">Best: ${readHighScore(game.id)}</p></a>`).join("")}</div>`;
  document.title = "The White Room";
}

function updatePomodoroView() {
  const clock = document.querySelector("#pomodoro-clock");
  if (!clock) return;
  const seconds = Math.ceil(pomodoro.remainingMs / 1000);
  clock.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  document.querySelector("#pomodoro-cycle").textContent = pomodoro.mode === "focus"
    ? `Session ${pomodoro.completed % 4 + 1} of 4`
    : pomodoro.mode === "short" ? "Short break" : "Long break";
  document.querySelector("#pomodoro-status").textContent = pomodoro.status;
  document.querySelector("#pomodoro-toggle").textContent = pomodoro.deadline ? "Pause" : "Start";
  document.querySelectorAll("[data-pomodoro-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.pomodoroMode === pomodoro.mode));
  });
  document.title = `${clock.textContent} ${pomodoro.mode === "focus" ? "Focus" : "Break"} | The White Room`;
}

function advancePomodoro(finished) {
  if (pomodoro.mode === "focus") {
    if (finished) pomodoro.completed++;
    pomodoro.mode = pomodoro.completed > 0 && pomodoro.completed % 4 === 0 ? "long" : "short";
  } else {
    pomodoro.mode = "focus";
  }
  pomodoro.deadline = null;
  pomodoro.remainingMs = POMODORO_MS[pomodoro.mode];
  pomodoro.status = finished ? "Time is up" : "";
  updatePomodoroView();
}

function tickPomodoro() {
  if (!pomodoro?.deadline) return;
  pomodoro.remainingMs = Math.max(0, pomodoro.deadline - Date.now());
  if (pomodoro.remainingMs === 0) advancePomodoro(true);
  else updatePomodoroView();
}

function renderPomodoro() {
  if (!pomodoro) {
    pomodoro = {
      mode: "focus", completed: 0, remainingMs: POMODORO_MS.focus,
      deadline: Date.now() + POMODORO_MS.focus, status: "",
    };
    window.setInterval(tickPomodoro, 500);
  }
  app.innerHTML = `<div class="pomodoro-page"><h1 class="sr-only">Pomodoro timer</h1>
    <div class="pomodoro-modes" role="group" aria-label="Timer mode">
      <button type="button" data-pomodoro-mode="focus">Focus 25</button>
      <button type="button" data-pomodoro-mode="short">Break 5</button>
      <button type="button" data-pomodoro-mode="long">Long break 15</button></div>
      <div class="pomodoro-stage"><p class="pomodoro-cycle" id="pomodoro-cycle"></p>
        <div class="pomodoro-clock" id="pomodoro-clock" role="timer"></div>
        <p class="pomodoro-status" id="pomodoro-status" aria-live="polite"></p>
        <div class="pomodoro-controls"><button class="primary-button" id="pomodoro-toggle" type="button"></button>
          <button class="secondary-button" id="pomodoro-reset" type="button">Reset</button>
          <button class="secondary-button" id="pomodoro-skip" type="button">Skip</button></div></div></div>`;
  document.querySelector("#pomodoro-toggle").addEventListener("click", () => {
    if (pomodoro.deadline) {
      pomodoro.remainingMs = Math.max(0, pomodoro.deadline - Date.now());
      pomodoro.deadline = null;
      pomodoro.status = "Paused.";
    } else {
      pomodoro.deadline = Date.now() + pomodoro.remainingMs;
      pomodoro.status = "";
    }
    updatePomodoroView();
  });
  document.querySelector("#pomodoro-reset").addEventListener("click", () => {
    pomodoro.deadline = null;
    pomodoro.remainingMs = POMODORO_MS[pomodoro.mode];
    pomodoro.status = "";
    updatePomodoroView();
  });
  document.querySelector("#pomodoro-skip").addEventListener("click", () => advancePomodoro(false));
  document.querySelectorAll("[data-pomodoro-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      pomodoro.mode = button.dataset.pomodoroMode;
      pomodoro.deadline = null;
      pomodoro.remainingMs = POMODORO_MS[pomodoro.mode];
      pomodoro.status = "";
      updatePomodoroView();
    });
  });
  tickPomodoro();
  updatePomodoroView();
}

function clearReadyHandler() {
  if (!readyKeyHandler) return;
  document.removeEventListener("keydown", readyKeyHandler);
  readyKeyHandler = null;
}

function renderArmed(game) {
  app.innerHTML = `<div class="game-page">${heading(game)}<div class="game-panel">
    <div class="stage start-stage"><button class="start-surface" id="start-button" type="button">
      <strong>Press any key to start</strong><span>or click / tap here</span><span>Personal best: ${readHighScore(game.id)}</span>
    </button></div></div></div>`;
  document.title = `${game.name} | The White Room`;
  const start = () => {
    clearReadyHandler();
    startGame(game);
  };
  document.querySelector("#start-button").addEventListener("click", start);
  readyKeyHandler = (event) => {
    if (event.key === "Tab" || event.metaKey || event.ctrlKey || event.altKey || event.repeat || event.target.closest?.("a")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    start();
  };
  document.addEventListener("keydown", readyKeyHandler);
}

function clearGameEffects(session) {
  for (const dispose of session.effects) dispose();
  session.effects = [];
}

function schedule(session, callback, delay) {
  const id = window.setTimeout(callback, delay);
  session.effects.push(() => window.clearTimeout(id));
}

function animate(session, callback) {
  let frame;
  const tick = (time) => {
    if (!session.active) return;
    callback(time);
    frame = window.requestAnimationFrame(tick);
  };
  frame = window.requestAnimationFrame(tick);
  session.effects.push(() => window.cancelAnimationFrame(frame));
}

function bindKey(session, onKeydown) {
  const handler = (event) => {
    if (!event.repeat) onKeydown(event);
  };
  document.addEventListener("keydown", handler);
  session.effects.push(() => document.removeEventListener("keydown", handler));
}

function stopSession() {
  if (!activeSession) return;
  activeSession.active = false;
  clearGameEffects(activeSession);
  window.clearInterval(activeSession.clock);
  activeSession = null;
}

function updateToolbar(session) {
  const remaining = Math.max(0, Math.ceil((session.deadline - performance.now()) / 1000));
  document.querySelector("#time-value").textContent = `${remaining}s`;
  if (remaining === 0) endSession(session);
}

function startGame(game) {
  stopSession();
  const session = {
    game, active: true, locked: false, score: 0, correct: 0, attempts: 0,
    reactions: [], effects: [], deadline: performance.now() + ROUND_MS,
  };
  activeSession = session;
  document.title = `${game.name} | The White Room`;
  app.innerHTML = `<div class="game-page">${heading(game)}<div class="game-panel">
    <div class="game-toolbar" aria-label="Time remaining">
      <div class="stat"><span class="stat-label">TIME LEFT</span><span class="stat-value" id="time-value">45s</span></div>
    </div><div class="stage" id="stage"></div></div></div>`;
  session.clock = window.setInterval(() => updateToolbar(session), 100);
  nextChallenge(session);
}

function endSession(session) {
  if (!session.active) return;
  const { game, score, correct, attempts, reactions } = session;
  stopSession();
  const key = `thewhiteroom:best:${game.id}`;
  const best = Math.max(score, readHighScore(game.id));
  try {
    window.localStorage.setItem(key, String(best));
  } catch {
    // The round remains playable when browser storage is unavailable.
  }
  const average = reactions.length
    ? `<div class="stat"><span class="stat-label">AVG. REACTION</span><span class="stat-value">${Math.round(reactions.reduce((sum, time) => sum + time, 0) / reactions.length)} ms</span></div>`
    : "";
  app.innerHTML = `<div class="game-page">${heading(game)}<div class="result-panel">
    <h2>Results</h2>
    <div class="result-stats">
      <div class="stat"><span class="stat-label">SCORE</span><span class="stat-value">${score}</span></div>
      <div class="stat"><span class="stat-label">PERSONAL BEST</span><span class="stat-value">${best}</span></div>
      <div class="stat"><span class="stat-label">CORRECT</span><span class="stat-value">${correct} / ${attempts}</span></div>
      <div class="stat"><span class="stat-label">ACCURACY</span><span class="stat-value">${attempts ? Math.round(correct / attempts * 100) : 0}%</span></div>
      ${average}</div>
    <div class="result-actions"><button type="button" class="primary-button" id="replay-button">Play again →</button>
    <a class="secondary-button" href="#/" style="text-decoration:none;display:inline-flex;align-items:center">All games</a></div>
  </div></div>`;
  document.querySelector("#replay-button").addEventListener("click", () => startGame(game));
}

function recordAnswer(session, correct, detail = "", reactionMs = null) {
  if (!session.active || session.locked) return;
  session.locked = true;
  session.attempts++;
  if (correct) {
    session.correct++;
    session.score++;
    if (reactionMs !== null) session.reactions.push(reactionMs);
  } else {
    session.score = Math.max(0, session.score - 1);
  }
  updateToolbar(session);
  if (!session.active) return;
  const feedback = document.querySelector("#feedback");
  if (feedback) feedback.textContent = detail || (correct ? "Correct" : "Miss");
  schedule(session, () => nextChallenge(session), 350);
}

function choiceMarkup(values, className = "", label = (value) => value) {
  return `<div class="choices ${className}">${values.map((value, index) =>
    `<button class="choice" type="button" data-index="${index}" aria-label="${label(value)}">${value}</button>`).join("")}</div>`;
}

function bindChoices(session, answerIndex) {
  document.querySelectorAll("#stage .choice").forEach((button) => {
    button.addEventListener("click", () => recordAnswer(session, Number(button.dataset.index) === answerIndex));
  });
}

function nextChallenge(session) {
  if (!session.active) return;
  clearGameEffects(session);
  session.locked = false;
  const stage = document.querySelector("#stage");
  switch (session.game.id) {
    case "larger-number": {
      const round = largerNumberRound();
      stage.innerHTML = `<p class="prompt">Which number is larger?</p>${choiceMarkup(round.options, "two")}<p class="feedback" id="feedback" aria-live="polite"></p>`;
      bindChoices(session, round.answerIndex);
      bindKey(session, (event) => {
        const index = event.key === "ArrowLeft" ? 0 : event.key === "ArrowRight" ? 1 : -1;
        if (index < 0) return;
        event.preventDefault();
        recordAnswer(session, index === round.answerIndex);
      });
      break;
    }
    case "moving-point": {
      stage.innerHTML = `<p class="prompt">Wait for the signal.</p>
        <button class="reaction-pad" id="reaction-pad" type="button" aria-label="Wait for the point to change, then press">
          <span class="moving-dot" aria-hidden="true"></span><span id="reaction-label">WAIT</span>
        </button><p class="feedback" id="feedback" aria-live="polite"></p>`;
      const pad = document.querySelector("#reaction-pad");
      let cueAt = null;
      schedule(session, () => {
        if (!session.active || session.locked) return;
        cueAt = performance.now();
        pad.classList.add("cued");
        pad.setAttribute("aria-label", "Signal shown, press now");
        document.querySelector("#reaction-label").textContent = "TAP NOW";
      }, 1400 + randomInt(2000));
      const react = () => {
        if (cueAt === null) recordAnswer(session, false, "Too soon");
        else {
          const reaction = Math.round(performance.now() - cueAt);
          recordAnswer(session, true, `${reaction} ms`, reaction);
        }
      };
      pad.addEventListener("click", react);
      bindKey(session, (event) => {
        if (event.code !== "Space") return;
        event.preventDefault();
        react();
      });
      break;
    }
    case "unique-figure": {
      const round = uniqueFigureRound();
      stage.innerHTML = `<p class="prompt">Find the unique figure.</p><div class="figure-grid">${round.symbols.map((symbol, index) =>
        `<button class="choice symbol" type="button" data-index="${index}" aria-label="${symbol.label}">${symbol.glyph}</button>`).join("")}</div>
        <p class="feedback" id="feedback" aria-live="polite"></p>`;
      bindChoices(session, round.answerIndex);
      break;
    }
    case "shape-match": {
      const round = shapeMatchRound();
      stage.innerHTML = `<p class="prompt">Find the exact match.</p><div class="target-symbol" aria-label="Target: ${round.target.label}">${round.target.glyph}</div>
        <div class="choices four shape-choices">${round.options.map((symbol, index) =>
          `<button class="choice symbol" type="button" data-index="${index}" aria-label="${symbol.label}">${symbol.glyph}</button>`).join("")}</div>
        <p class="feedback" id="feedback" aria-live="polite"></p>`;
      bindChoices(session, round.answerIndex);
      break;
    }
    case "find-number": {
      const round = findNumberRound();
      stage.innerHTML = `<p class="prompt">Find ${round.target}</p><div class="number-grid">${round.numbers.map((number, index) =>
        `<button class="choice" type="button" data-index="${index}">${number}</button>`).join("")}</div>
        <p class="feedback" id="feedback" aria-live="polite"></p>`;
      bindChoices(session, round.answerIndex);
      break;
    }
    case "color-clash": {
      const round = colorClashRound();
      stage.innerHTML = `<p class="prompt">What color is the ink?</p>
        <div class="ink-word" style="color:${round.ink.hex}" aria-label="${round.word.name}, shown in ${round.ink.name} ink">${round.word.name.toUpperCase()}</div>
        ${choiceMarkup(round.options.map((color) => color.name), "two color-choices")}
        <p class="feedback" id="feedback" aria-live="polite"></p>`;
      bindChoices(session, round.answerIndex);
      break;
    }
    case "sequence-recall": {
      const sequence = sequenceRound(3 + session.correct);
      let step = 0;
      stage.innerHTML = `<p class="prompt" id="memory-prompt">Watch the sequence.</p><p class="subprompt">Level ${session.correct + 1} · ${sequence.length} squares</p>
        <div class="memory-grid">${Array.from({ length: 9 }, (_, index) =>
          `<button class="choice" type="button" data-index="${index}" aria-label="Square ${index + 1}" disabled></button>`).join("")}</div>
        <p class="feedback" id="feedback" aria-live="polite"></p>`;
      const buttons = [...document.querySelectorAll("#stage .choice")];
      sequence.forEach((square, index) => {
        schedule(session, () => buttons[square].classList.add("lit"), 400 + index * 700);
        schedule(session, () => buttons[square].classList.remove("lit"), 850 + index * 700);
      });
      schedule(session, () => {
        document.querySelector("#memory-prompt").textContent = "Repeat the sequence.";
        buttons.forEach((button) => button.disabled = false);
      }, 1050 + (sequence.length - 1) * 700);
      buttons.forEach((button) => button.addEventListener("click", () => {
        if (session.locked) return;
        button.classList.add("pressed");
        schedule(session, () => button.classList.remove("pressed"), 180);
        if (Number(button.dataset.index) !== sequence[step]) recordAnswer(session, false);
        else if (++step === sequence.length) recordAnswer(session, true);
      }));
      break;
    }
    case "direction-switch": {
      const round = directionSwitchRound();
      stage.innerHTML = `<p class="rule-badge">${round.rule}</p><p class="prompt">Choose the ${round.rule.toLowerCase()} direction.</p>
        <div class="direction-arrow" aria-label="${round.direction.name}">${round.direction.glyph}</div>
        <div class="choices four">${DIRECTIONS.map((direction, index) =>
          `<button class="choice" type="button" data-index="${index}" aria-label="${direction.name}">${direction.glyph}</button>`).join("")}</div>
        <p class="feedback" id="feedback" aria-live="polite"></p>`;
      bindChoices(session, round.answerIndex);
      bindKey(session, (event) => {
        const index = DIRECTIONS.findIndex((direction) => direction.key === event.key);
        if (index < 0) return;
        event.preventDefault();
        recordAnswer(session, index === round.answerIndex);
      });
      break;
    }
    case "stop-the-line": {
      stage.innerHTML = `<p class="prompt">Stop inside the blue zone.</p>
        <button class="timing-pad" id="timing-pad" type="button" aria-label="Stop the line">
          <span class="timing-track" aria-hidden="true"><span class="timing-zone"></span><span class="timing-marker" id="timing-marker"></span></span>
          <span>STOP</span></button><p class="feedback" id="feedback" aria-live="polite"></p>`;
      const origin = performance.now();
      const travelMs = Math.max(400, 900 - session.correct * 100);
      const marker = document.querySelector("#timing-marker");
      const position = (now) => {
        const phase = ((now - origin) / travelMs) % 2;
        return (phase <= 1 ? phase : 2 - phase) * 100;
      };
      animate(session, (now) => marker.style.left = `${position(now)}%`);
      const stop = () => {
        const percent = position(performance.now());
        recordAnswer(session, percent >= 46 && percent <= 54, percent >= 46 && percent <= 54 ? "Perfect timing" : "Outside the zone");
      };
      document.querySelector("#timing-pad").addEventListener("click", stop);
      bindKey(session, (event) => {
        if (event.code !== "Space") return;
        event.preventDefault();
        stop();
      });
      break;
    }
  }
}

function renderRoute() {
  stopSession();
  clearReadyHandler();
  if (location.hash === "#/pomodoro") {
    renderPomodoro();
    return;
  }
  const match = location.hash.match(/^#\/game\/([a-z-]+)$/);
  const game = match && GAMES.find((item) => item.id === match[1]);
  if (game) renderArmed(game);
  else renderHome();
}

window.addEventListener("hashchange", renderRoute);
renderRoute();
