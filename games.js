export const GAMES = [
  { id: "larger-number", name: "Larger Number", description: "Spot the bigger value.", instruction: "Choose the larger of two numbers as quickly as you can.", controls: "Use the left and right arrow keys, or click a number." },
  { id: "moving-point", name: "Moving Point", description: "Wait for the signal. React.", instruction: "Watch the moving point. React when it turns blue and the ring appears. Early responses count as misses.", controls: "Press Space, or click the play area." },
  { id: "unique-figure", name: "Unique Figure", description: "Find the one that differs.", instruction: "Find the one shape that is different from the rest.", controls: "Click or tap the unique figure." },
  { id: "shape-match", name: "Shape Match", description: "Find the exact twin.", instruction: "Look at the target shape, then choose its identical match.", controls: "Click or tap the matching figure." },
  { id: "find-number", name: "Find Number", description: "Scan the grid fast.", instruction: "Find the requested number in the grid.", controls: "Click or tap the number." },
  { id: "color-clash", name: "Color Clash", description: "Read the ink, not the word.", instruction: "Choose the ink color of the word, not what the word says.", controls: "Click or tap the ink color." },
  { id: "sequence-recall", name: "Sequence Recall", description: "Watch. Remember. Repeat.", instruction: "Watch the lit squares, then tap them in the same order.", controls: "Click or tap the squares in order." },
  { id: "direction-switch", name: "Direction Switch", description: "Same or opposite?", instruction: "Follow the rule shown above the arrow. Choose the same or opposite direction.", controls: "Use the arrow keys, or click a direction." },
  { id: "stop-the-line", name: "Stop the Line", description: "Catch the center zone.", instruction: "Stop the moving line while it is inside the blue zone.", controls: "Press Space, or click the play area." },
];

export const SYMBOLS = [
  { glyph: "●", label: "filled circle" },
  { glyph: "○", label: "outline circle" },
  { glyph: "■", label: "filled square" },
  { glyph: "□", label: "outline square" },
  { glyph: "▲", label: "filled triangle" },
  { glyph: "△", label: "outline triangle" },
  { glyph: "◆", label: "filled diamond" },
  { glyph: "◇", label: "outline diamond" },
];

export const COLORS = [
  { name: "Red", hex: "#c73535" },
  { name: "Blue", hex: "#2458c7" },
  { name: "Green", hex: "#147a4c" },
  { name: "Purple", hex: "#7b3eaa" },
];

export const DIRECTIONS = [
  { name: "Up", glyph: "↑", key: "ArrowUp" },
  { name: "Right", glyph: "→", key: "ArrowRight" },
  { name: "Down", glyph: "↓", key: "ArrowDown" },
  { name: "Left", glyph: "←", key: "ArrowLeft" },
];

export function randomInt(max) {
  return Math.floor(Math.random() * max);
}

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function largerNumberRound() {
  const first = 10 + randomInt(990);
  let second = 10 + randomInt(990);
  while (second === first) second = 10 + randomInt(990);
  const options = shuffle([first, second]);
  return { options, answerIndex: options.indexOf(Math.max(first, second)) };
}

export function uniqueFigureRound() {
  const [common, unique] = shuffle(SYMBOLS).slice(0, 2);
  const answerIndex = randomInt(16);
  const symbols = Array.from({ length: 16 }, (_, index) => index === answerIndex ? unique : common);
  return { symbols, answerIndex };
}

export function shapeMatchRound() {
  const options = shuffle(SYMBOLS).slice(0, 4);
  const answerIndex = randomInt(options.length);
  return { target: options[answerIndex], options, answerIndex };
}

export function findNumberRound() {
  const numbers = shuffle(Array.from({ length: 90 }, (_, index) => index + 10)).slice(0, 25);
  const answerIndex = randomInt(numbers.length);
  return { target: numbers[answerIndex], numbers, answerIndex };
}

export function colorClashRound() {
  const ink = COLORS[randomInt(COLORS.length)];
  const word = shuffle(COLORS.filter((color) => color !== ink))[0];
  const options = shuffle(COLORS);
  return { ink, word, options, answerIndex: options.indexOf(ink) };
}

export function directionSwitchRound() {
  const directionIndex = randomInt(DIRECTIONS.length);
  const opposite = randomInt(2) === 1;
  return {
    direction: DIRECTIONS[directionIndex],
    rule: opposite ? "OPPOSITE" : "SAME",
    answerIndex: opposite ? (directionIndex + 2) % 4 : directionIndex,
  };
}

export function sequenceRound(length) {
  const sequence = [];
  for (let i = 0; i < length; i++) {
    let next = randomInt(9);
    while (next === sequence.at(-1)) next = randomInt(9);
    sequence.push(next);
  }
  return sequence;
}
