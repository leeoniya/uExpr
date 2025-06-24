import { test } from "node:test";
import { strict as assert } from 'assert';
import {
  compileExpr,
  compileMatcher,
  compileFilter,
  compileFilterIdxs,

  compileExprCols,
  compileMatcherCols,
  compileFilterCols,
  compileFilterColsIdxs
} from "../src/uExpr.mjs";

test("compileExpr (single)", async t => {
  await t.test('comparators', t => {
    [
      '==',
      '!=',
      '===',
      '!==',
      '>=',
      '<=',
      '<',
      '>',
    ].forEach(op => {
      assert.deepEqual(compileExpr([op, '.a', 'foo']), { stmts: [], expr: `$.a ${op} "foo"` });
    });
  });

  await t.test("truthy", t => {
    [
      '!!',
      'truthy',
    ].forEach(op => {
      assert.deepEqual(compileExpr([op, '.a']), { stmts: [], expr: `Boolean($.a)` });
    });
  });

  await t.test("falsy", t => {
    [
      '!',
      'falsy',
    ].forEach(op => {
      assert.deepEqual(compileExpr([op, '.a']), { stmts: [], expr: `!Boolean($.a)` });
    });
  });

  await t.test("list contains", t => {
    [
      'some',
      'every',
    ].forEach(op => {
      assert.deepEqual(compileExpr([op, '.fields', ['==', '.type', 'string']]), { stmts: [], expr: `$.fields.${op}(($, $i) => $.type == "string")` });
    });
  });

  await t.test("contained in list", t => {
    [
      ',',
      'in',
    ].forEach(op => {
      assert.deepEqual(compileExpr([op, '.type', ['foo', 'bar', 'baz']]), { stmts: ['let $0 = new Set(["foo","bar","baz"]);'], expr: `$0.has($.type)` });
    });
  });

  await t.test("ranges", t => {
    assert.deepEqual(compileExpr(['-',  '.value', [5,10]]), { stmts: [], expr: `$.value >= 5 && $.value <= 10` });
    assert.deepEqual(compileExpr(['[]', '.value', [5,10]]), { stmts: [], expr: `$.value >= 5 && $.value <= 10` });
    assert.deepEqual(compileExpr(['()', '.value', [5,10]]), { stmts: [], expr: `$.value > 5 && $.value < 10` });
    assert.deepEqual(compileExpr(['[)', '.value', [5,10]]), { stmts: [], expr: `$.value >= 5 && $.value < 10` });
    assert.deepEqual(compileExpr(['(]', '.value', [5,10]]), { stmts: [], expr: `$.value > 5 && $.value <= 10` });
  });

  await t.test("substrings", t => {
    assert.deepEqual(compileExpr(['startsWith',  '.foo', 'f']), { stmts: [], expr: `$.foo.startsWith("f")` });
    assert.deepEqual(compileExpr(['^',           '.foo', 'f']), { stmts: [], expr: `$.foo.startsWith("f")` });

    assert.deepEqual(compileExpr(['endsWith',    '.foo', 'f']), { stmts: [], expr: `$.foo.endsWith("f")` });
    assert.deepEqual(compileExpr(['$',           '.foo', 'f']), { stmts: [], expr: `$.foo.endsWith("f")` });

    assert.deepEqual(compileExpr(['includes',    '.foo', 'f']), { stmts: [], expr: `$.foo.includes("f")` });
    assert.deepEqual(compileExpr(['*',           '.foo', 'f']), { stmts: [], expr: `$.foo.includes("f")` });
  });

  await t.test("typeof numeric special", t => {
    [
      'isInteger',
      'isFinite',
      'isNaN',
    ].forEach(op => {
      assert.deepEqual(compileExpr([op, '.a']), { stmts: [], expr: `Number.${op}($.a)` });
    });
  });

  await t.test("typeof", t => {
    assert.deepEqual(compileExpr(['isArray', '.a']), { stmts: [], expr: `Array.isArray($.a)` });

    // TODO: ['typeof', '.a', 'array']
    // string, boolean, number, function, object, array, null
  });

  await t.test("regexp", t => {
    assert.deepEqual(compileExpr(['/',       '.value', '\\d+']), { stmts: ['let $0 = new RegExp("\\\\d+", "");'], expr: `$0.test($.value)` });
    assert.deepEqual(compileExpr(['regexp',  '.value', '\\d+']), { stmts: ['let $0 = new RegExp("\\\\d+", "");'], expr: `$0.test($.value)` });

    assert.deepEqual(compileExpr(['/i',      '.value', '\\d+']), { stmts: ['let $0 = new RegExp("\\\\d+", "i");'], expr: `$0.test($.value)` });
    assert.deepEqual(compileExpr(['regexpi', '.value', '\\d+']), { stmts: ['let $0 = new RegExp("\\\\d+", "i");'], expr: `$0.test($.value)` });
  });

  await t.test("optional chaining", t => {
    assert.deepEqual(compileExpr(['==', '.geo[1].foo.?bar.?[4]', '123'], { chain: true }), { stmts: [], expr: `$.?geo.?[1].?foo.?bar.?[4] == "123"` });
  });

  await t.test("injection guards", t => {
    assert.deepEqual(compileExpr(['==', '.hello(); alert(window); " \'', '\' "global({bad}); alert("hi");']), { stmts: [], expr: `$.helloalertwindow == "' \\"global({bad}); alert(\\"hi\\");"` });
  });
});

test("compileExpr (single, inversion)", async t => {
  await t.test("!truthy", t => {
    assert.deepEqual(compileExpr(['!truthy', '.a']), { stmts: [], expr: `!(Boolean($.a))` });
  });

  await t.test("!falsy", t => {
    assert.deepEqual(compileExpr(['!falsy', '.a']), { stmts: [], expr: `!(!Boolean($.a))` });
  });

  await t.test("!list contains", t => {
    assert.deepEqual(compileExpr(['!some', '.fields', ['==', '.type', 'string']]), { stmts: [], expr: `!($.fields.some(($, $i) => $.type == "string"))` });
  });

  await t.test("!contained in list", t => {
    assert.deepEqual(compileExpr(['!,', '.type', ['foo', 'bar', 'baz']]), { stmts: ['let $0 = new Set(["foo","bar","baz"]);'], expr: `!($0.has($.type))` });
  });

  await t.test("!in range", t => {
    assert.deepEqual(compileExpr(['!-',  '.value', [5,10]]), { stmts: [], expr: `!($.value >= 5 && $.value <= 10)` });
    assert.deepEqual(compileExpr(['!(]', '.value', [5,10]]), { stmts: [], expr: `!($.value > 5 && $.value <= 10)` });
  });
});


test("compileExpr (compound of 1 -> single)", () => {
  let expect = { stmts: [], expr: '$.fields.some(($, $i) => $.type == "string")' };

  assert.deepEqual(
    compileExpr(
      ['&&',
        ['some', '.fields',
          ['||',
            ['==', '.type', 'string']
          ]
        ]
      ]
    ),
    expect
  );

  assert.deepEqual(
    compileExpr(
      ['||',
        ['some', '.fields',
          ['&&',
            ['==', '.type', 'string']
          ]
        ]
      ]
    ),
    expect
  );
});

test("compileExpr (compound)", () => {
  assert.deepEqual(
    compileExpr(
      ['&&',
        ['some', '.fields', ['==', '.type', 'string']],
        ['||',
          ['^', '.name', 'foo'],
          ['>=', '.value.amount', 100],
        ]
      ]
    ),
    { stmts: [], expr: '($.fields.some(($, $i) => $.type == "string") && ($.name.startsWith("foo") || $.value.amount >= 100))' }
  );
});

test("compileMatcher", () => {
  let matcher = compileMatcher(['>=', '$', 35]);
  assert.deepEqual(matcher.toString(), '($, $i = 0) => $ >= 35');

  let out = [1,2,3,35,2,700].filter(matcher);
  assert.deepEqual(out, [35, 700]);
});

test("compileFilter", () => {
  let filter = compileFilter(['>=', '$', 35]);
  assert.deepEqual(filter.toString(), 'arr => {\n      let out = [];\n      for (let i = 0; i < arr.length; i++) {\n        let $i = i, $ = arr[i];\n        $ >= 35 && out.push($);\n      }\n      return out;\n    }');

  let out = filter([1,2,3,35,2,700]);
  assert.deepEqual(out, [35, 700]);
});

test("compileFilterIdxs", () => {
  let filter = compileFilterIdxs(['>=', '$', 35]);
  assert.deepEqual(filter.toString(), 'arr => {\n      let out = [];\n      for (let i = 0; i < arr.length; i++) {\n        let $i = i, $ = arr[i];\n        $ >= 35 && out.push($i);\n      }\n      return out;\n    }');

  let out = filter([1,2,3,35,2,700]);
  assert.deepEqual(out, [3, 5]);
});

test("compileExprCols", () => {
  assert.deepEqual(
    compileExprCols(
      ['&&',
        ['==', '[0][$i]', 'a'],
        ['>', '[1][$i]', 30],
      ],
    ),
    { stmts: [], expr: '($[0][$i] == "a" && $[1][$i] > 30)' }
  );
});

test("compileExprCols (with names)", () => {
  assert.deepEqual(
    compileExprCols(
      ['&&',
        ['==', '.name', 'a'],
        ['>', '.value', 30],
      ],
      ['.name', '.value']
    ),
    { stmts: [], expr: '($[0][$i] == "a" && $[1][$i] > 30)' }
  );
});

test("compileMatcherCols", () => {
  let matcher = compileMatcherCols(
    ['&&',
      ['==', '[0][$i]', 'a'],
      ['>', '[1][$i]', 30],
    ],
  );
  assert.deepEqual(matcher.toString(), '($, $i = 0) => ($[0][$i] == "a" && $[1][$i] > 30)');

  let out = [];
  let cols = [
    ['a', 'b', 'a'],
    [0, 70, 50],
  ];

  for (let i = 0; i < cols[0].length; i++) {
    if (matcher(cols, i)) {
      out.push(i);
    }
  }

  assert.deepEqual(out, [2]);
});

test("compileMatcherCols (with names)", () => {
  let matcher = compileMatcherCols(
    ['&&',
      ['==', '.name', 'a'],
      ['>', '.value', 30],
    ],
    ['.name', '.value']
  );
  assert.deepEqual(matcher.toString(), '($, $i = 0) => ($[0][$i] == "a" && $[1][$i] > 30)');

  let out = [];
  let cols = [
    ['a', 'b', 'a'],
    [0, 70, 50],
  ];

  for (let i = 0; i < cols[0].length; i++) {
    if (matcher(cols, i)) {
      out.push(i);
    }
  }

  assert.deepEqual(out, [2]);
});

test("compileFilterCols", () => {
  let filter = compileFilterCols(
    ['&&',
      ['==', '[0][$i]', 'a'],
      ['>', '[1][$i]', 30],
    ],
  );

  assert.deepEqual(filter.toString(), 'cols => {\n      \n      let len = cols[0].length;\n\n      let $ = cols;\n      let idxs = [];\n\n      for (let $i = 0; $i < len; $i++) {\n        ($[0][$i] == "a" && $[1][$i] > 30) && idxs.push($i);\n      }\n\n\n      return cols.map(col => {\n        let fcol = [];\n\n        for (let i = 0; i < idxs.length; i++) {\n          fcol.push(col[idxs[i]]);\n        }\n\n        return fcol;\n      });\n    }');

  let out = filter([
    ['a', 'b', 'a'],
    [0, 70, 50],
  ]);

  assert.deepEqual(out, [
    ['a'],
    [50],
  ]);
});

test("compileFilterCols (with names)", () => {
  let filter = compileFilterCols(
    ['&&',
      ['==', '.name', 'a'],
      ['>', '.value', 30],
    ],
    ['.name', '.value']
  );

  assert.deepEqual(filter.toString(), 'cols => {\n      \n      let len = cols[0].length;\n\n      let $ = cols;\n      let idxs = [];\n\n      for (let $i = 0; $i < len; $i++) {\n        ($[0][$i] == "a" && $[1][$i] > 30) && idxs.push($i);\n      }\n\n\n      return cols.map(col => {\n        let fcol = [];\n\n        for (let i = 0; i < idxs.length; i++) {\n          fcol.push(col[idxs[i]]);\n        }\n\n        return fcol;\n      });\n    }');

  let out = filter([
    ['a', 'b', 'a'],
    [0, 70, 50],
  ]);

  assert.deepEqual(out, [
    ['a'],
    [50],
  ]);
});

test("compileFilterColsIdxs", () => {
  let filter = compileFilterColsIdxs(
    ['&&',
      ['==', '[0][$i]', 'a'],
      ['>', '[1][$i]', 30],
    ],
  );

  assert.deepEqual(filter.toString(), 'cols => {\n      \n      let len = cols[0].length;\n\n      let $ = cols;\n      let idxs = [];\n\n      for (let $i = 0; $i < len; $i++) {\n        ($[0][$i] == "a" && $[1][$i] > 30) && idxs.push($i);\n      }\n\n      return idxs;\n    }');

  let out = filter([
    ['a', 'b', 'a'],
    [0, 70, 50],
  ]);

  assert.deepEqual(out, [2]);
});

test("compileFilterColsIdxs (with names)", () => {
  let filter = compileFilterColsIdxs(
    ['&&',
      ['==', '.name', 'a'],
      ['>', '.value', 30],
    ],
    ['.name', '.value']
  );

  assert.deepEqual(filter.toString(), 'cols => {\n      \n      let len = cols[0].length;\n\n      let $ = cols;\n      let idxs = [];\n\n      for (let $i = 0; $i < len; $i++) {\n        ($[0][$i] == "a" && $[1][$i] > 30) && idxs.push($i);\n      }\n\n      return idxs;\n    }');

  let out = filter([
    ['a', 'b', 'a'],
    [0, 70, 50],
  ]);

  assert.deepEqual(out, [2]);
});

test("compileMatcher (custom ops)", () => {
  let ops = {
    byName: ($, $i, $cfg) => $.name === $cfg.name,
  };

  let matcher = compileMatcher(
    ['byName', { name: 'abc' }],
    { ops }
  );
  assert.deepEqual(matcher.toString(), '($, $i = 0) => $ops.byName($, $i, $args)');

  let out = matcher({name: 'abc'});
  assert.strictEqual(out, true);

  let out2 = matcher({name: 'def'});
  assert.strictEqual(out2, false);

  let matcher2 = compileMatcher(
    ['!byName', { name: 'abc' }],
    { ops }
  );
  assert.deepEqual(matcher2.toString(), '($, $i = 0) => !($ops.byName($, $i, $args))');
});

/*
console.log(compileExpr(
  ['||',
    ['&&',
      ['==', '.meta.dataTopic', 'annotations'],
      ['some', '.fields', ['==', '.type', 'string']]
    ]
  ]
));

console.log(compileExpr(
  ['||',
    ['/', '.name', 'foo']
    ['&&',
      ['==', '.meta.dataTopic', 'annotations'],
      ['some', '.fields', ['==', '.type', 'string']]
    ],
  ]
));

console.log(compileExpr(['in', '.type', ['a', 'b']]));

console.log(compileExpr(['-', '.price', [5, 10]]));
console.log(compileExpr(['[)', '.price', [5, 10]]));
console.log(compileExpr(['/', '.price', '\\d+']));
console.log(compileExpr(['!/', '.price', '\\d+']));

console.log(compileExpr(['!/', '.price', '${sss}']));
console.log(compileExpr(['!!', '.price']));
*/