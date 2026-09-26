import assert from "node:assert/strict";
import test from "node:test";
import {
  COLORS,
  DIRECTIONS,
  GAMES,
  colorClashRound,
  directionSwitchRound,
  findNumberRound,
  largerNumberRound,
  sequenceRound,
  shapeMatchRound,
  uniqueFigureRound,
} from "./games.js";

test("offers nine distinct games", () => {
  assert.equal(GAMES.length, 9);
  assert.equal(new Set(GAMES.map((game) => game.id)).size, 9);
});

test("generated selection games have exactly one correct answer", () => {
  for (let i = 0; i < 500; i++) {
    const larger = largerNumberRound();
    assert.equal(new Set(larger.options).size, 2);
    assert.equal(larger.options[larger.answerIndex], Math.max(...larger.options));

    const unique = uniqueFigureRound();
    assert.equal(unique.symbols.length, 16);
    assert.equal(unique.symbols.filter((symbol) => symbol === unique.symbols[unique.answerIndex]).length, 1);

    const match = shapeMatchRound();
    assert.equal(match.options.length, 12);
    assert.equal(new Set(match.options).size, 12);
    assert.equal(match.options.filter((symbol) => symbol === match.target).length, 1);
    assert.equal(match.options[match.answerIndex], match.target);

    const hunt = findNumberRound();
    assert.equal(new Set(hunt.numbers).size, 25);
    assert.equal(hunt.numbers.filter((number) => number === hunt.target).length, 1);
    assert.equal(hunt.numbers[hunt.answerIndex], hunt.target);

    const color = colorClashRound();
    assert.notEqual(color.word, color.ink);
    assert.equal(color.options.length, COLORS.length);
    assert.equal(color.options[color.answerIndex], color.ink);

    const direction = directionSwitchRound();
    const index = DIRECTIONS.indexOf(direction.direction);
    assert.equal(direction.answerIndex, direction.rule === "SAME" ? index : (index + 2) % 4);
  }
});

test("memory sequences fit the grid and never repeat a square immediately", () => {
  for (let length = 3; length <= 12; length++) {
    for (let i = 0; i < 100; i++) {
      const sequence = sequenceRound(length);
      assert.equal(sequence.length, length);
      assert.ok(sequence.every((square) => square >= 0 && square < 9));
      assert.ok(sequence.every((square, index) => index === 0 || square !== sequence[index - 1]));
    }
  }
});
