import { compileExpr, compileMatcher, compileFilter } from "../src/uExpr.mjs";
import jsonLogic from 'json-logic-js';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let fillings = 'apple cherry pumpkin lemon'.split(' ');

let count = 5e4;

let data = Array(count);

for (let i = 0; i < count; i++) {
  data[i] = {
    temp: randInt(0, 200),
    pie: {
      filling: fillings[randInt(0, fillings.length - 1)],
    }
  };
}

let rules = {
  "and": [
    { "<": [{ "var": "temp" }, 110] },
    { "==": [{ "var": "pie.filling" }, "apple"] }
  ]
};

let out;

console.time('jsonLogic');
out = data.filter(o => jsonLogic.apply(rules, o));
console.timeEnd('jsonLogic');

console.log(out.length);

let matcher = compileMatcher(
  ['&&',
    ['<', '.temp', 110],
    ['==', '.pie.filling', 'apple'],
  ]
)

console.time('uExpr');
out = data.filter(matcher);
console.timeEnd('uExpr');

console.log(out.length);