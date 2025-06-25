import { compileExpr, compileMatcher, initFilter, initFilterIdxs } from "../src/uExpr.mjs";
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

let idxs = Array(count);

for (let i = 0; i < count; i++)
  idxs[i] = i;

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

{
  console.time('uExpr (matcher)');
  let matcher = compileMatcher(rules);
  let out = data.filter(matcher);
  console.timeEnd('uExpr (matcher)');
  // console.log(out.length);
}

{
  console.time('initFilter');
  let filter = initFilter(rules);
  let out = filter(data);
  console.timeEnd('initFilter');
  // console.log(out.length);
}

{
  console.time('initFilterIdxs');
  let filter = initFilterIdxs(rules);
  let out = filter(data);
  console.timeEnd('initFilterIdxs');
  // console.log(out.length);
}

{
  console.time('initFilterIdxs, proxy');
  let filter = initFilterIdxs(rules);
  let out = filter(data, idxs);
  console.timeEnd('initFilterIdxs, proxy');
  // console.log(out.length);
}

// columns

