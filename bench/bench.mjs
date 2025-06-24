import { compileExpr, compileMatcher, compileFilter } from "../src/uExpr.mjs";
import jsonLogic from 'json-logic-js';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let fillings = 'apple cherry pumpkin lemon'.split(' ');

let count = 100_000;

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

rules = (
  ['&&',
    ['<', '.temp', 110],
    ['==', '.pie.filling', 'apple'],
  ]
);

console.time('uExpr (matcher init)');
let matcher = compileMatcher(rules);
console.timeEnd('uExpr (matcher init)');

console.time('uExpr (matcher)');
out = data.filter(matcher);
console.timeEnd('uExpr (matcher)');

console.log(out.length);


console.time('uExpr (matcher/get init)');
let matcher2 = compileMatcher(rules, { get: i => data[i] });
console.timeEnd('uExpr (matcher/get init)');

let idxs = Array(count);
for (let i = 0; i < count; i++)
  idxs[i] = i;

console.time('uExpr (matcher/get)');
out = idxs.filter(matcher2);
console.timeEnd('uExpr (matcher/get)');

console.log(out.length);

let filter = compileFilter(rules);

console.time('uExpr (filter)');
out = filter(data);
console.timeEnd('uExpr (filter)');

console.log(out.length);


let filter2 = compileFilter(rules, { get: i => data[i] });

console.time('uExpr (filter/get)');
out = filter2(idxs);
console.timeEnd('uExpr (filter/get)');

console.log(out.length);