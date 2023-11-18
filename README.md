## μExpr

A conditional expression compiler _(MIT Licensed)_

---
### Introduction

μExpr is a compiler for conditional expressions and filters/matchers that can be stored in JSON.
It is similar in purpose to https://jsonlogic.com/ with the following differences:

1. Simplified syntax, without objects
2. Reduced scope that focuses on matching (emitting either `true` or `false`)
3. Attains native (25x faster) runtime performance by using `new Function()` with carefully placed guards

<!-- https://react-querybuilder.js.org/demo -->

---
### Example

```js
import {
  compileExpr,
  compileMatcher,
  compileFilter
} from "../src/uExpr.mjs";

let matcher = compileMatcher(
  ['||',
    ['^', '.name', 'foo'],
    ['&&',
      ['==', '.meta.dataTopic', 'unsubscribe'],
      ['some', '.fields', ['==', '.type', 'string']]
    ],
  ]
);
```

If you were to write this logic by hand it would look like this:

```js
let matcher = ($, $i = 0) => (
  $.name.startsWith("foo") ||
  (
    $.meta.dataTopic == "unsubscribe" &&
    $.fields.some(($, $i) => $.type == "string")
  )
);
```

Now you can use the compiled function as the callback to `Array.filter()`:

```js
let frames = [
  {
    name: 'foobar',
    meta: {
      dataTopic: 'subscribe'
    },
    fields: [
      {
        type: 'number'
      },
    ]
  },
  {
    name: 'something',
    meta: {
      dataTopic: 'unsubscribe'
    },
    fields: [
      {
        type: 'string'
      },
    ]
  },
  {
    name: 'other',
    meta: {
      dataTopic: 'cancellation'
    },
    fields: [
      {
        type: 'string'
      },
    ]
  },
];

let filtered = frames.filter(matcher);
```