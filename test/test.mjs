import { test } from "node:test";
import { strict as assert } from 'assert';
import { compileExpr, compileMatcher } from "../src/uExpr..mjs";

test("will pass", () => {
  let expect = { stmts: [], expr: '$.fields.some(($, $i) => $.type == "string")' };

  assert.deepEqual(
    compileExpr(
      ['&&',
        ['some', '.fields',
          ['&&',
            ['==', '.type', 'string']
          ]
        ]
      ]
    ),
    expect
  );

  assert.deepEqual(
    compileExpr(
      ['some', '.fields', ['==', '.type', 'string']]
    ),
    expect
  );

  assert.deepEqual(
    compileExpr(
      ['&&',
        ['some', '.fields', ['&&', ['==', '.type', 'string']]]
      ]
    ),
    expect
  );

  let matcher = compileMatcher(expect);

  let frame = {
    fields: [
      {
        type: 'string'
      },
    ]
  };

  assert.ok(matcher(frame));
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