const cleanRHS = v => JSON.stringify(v);
const cleanLHS = (path, chain = false) => {
  if (path == null || path == '' || path == '$' || path == '$i')
    return path;

  let cleanPath = '';

  // guard against access outside of scope
  if (path[0] == '.' || path[0] == '[') {
    // remove baddies
    cleanPath = path.replace(/[^$\w.?\[\]-]/ig, '');

    // add optional chaining
    if (chain) {
      cleanPath = cleanPath
        .replace(/\.\??/ig, '.?')
        .replace(/(?:\.\?)?\[/ig, '.?[');
    }
  }

  return '$' + cleanPath;
}

const EMPTY_ARR = [];
const EMPTY_OBJ = {};

let OPTS = { chain: false, ops: EMPTY_OBJ };

export function compileExpr(node, opts = OPTS, stmts = []) {
  let op = node[0];
  let lhs = node[1];
  let rhs = node[2];

  let expr = '';

  let negate = op[0] == '!' && op != '!=' && op != '!==' && op !== '!!';

  op = negate ? op.slice(1) : op;

  let $ops = opts.ops ?? EMPTY_OBJ;

  if (typeof $ops[op] == 'function' && /^\w+$/.test(op)) {
    stmts.push(`let $args = ${JSON.stringify(lhs ?? null)};`);
    expr = `$ops.${op}($, $i, $args)`;
  }
  else {
    let path = op != '&&' && op != '||' ? cleanLHS(lhs, opts.chain) : '';

    switch (op) {
      case '&&':
      case '||':
        let exprs = node.slice(1).map(node2 => compileExpr(node2, opts, stmts));
        expr = exprs.length > 1 ? `(${exprs.map(o => o.expr).join(` ${op} `)})` : exprs[0].expr;
        break;

      case 'truthy':
      case '!!':
        expr = `Boolean(${path})`;
        break;

      case '==':
      case '!=':
      case '===':
      case '!==':
      case '>=':
      case '<=':
      case '<':
      case '>':
        expr = `${path} ${op} ${cleanRHS(rhs)}`;
        break;

      case 'some':
      case 'every':
        expr = `${path}.${op}(($, $i) => ${compileExpr(rhs, opts, stmts).expr})`;
        break;

      case ',':
      case 'in':
        expr = `$${stmts.length}.has(${path})`;
        stmts.push(`let $${stmts.length} = new Set(${cleanRHS(rhs)});`);
        break;

      case '-':
      case '[]':
      case '()':
      case '[)':
      case '(]':
        if (!Array.isArray(rhs)) break;

        let [min, max] = rhs;
        let [l, r] = op;
        let lop = l == '[' || l == '-' ? '>=' : '>';
        let rop = r == ']' || r == null ? '<=' : '<';
        expr = `${path} ${lop} ${cleanRHS(min)} && ${path} ${rop} ${cleanRHS(max)}`;
        break;

      case 'startsWith':
      case '^':
        expr = `${path}.startsWith(${cleanRHS(rhs)})`;
        break;

      case 'endsWith':
      case '$':
        expr = `${path}.endsWith(${cleanRHS(rhs)})`;
        break;

      case 'includes':
      case '*':
        expr = `${path}.includes(${cleanRHS(rhs)})`;
        break;

      case 'regexp':
      case 'regexpi':
      case '/':
      case '/i':
        let flags = op.at(-1) == 'i' ? 'i' : '';
        expr = `$${stmts.length}.test(${path})`;
        stmts.push(`let $${stmts.length} = new RegExp(${cleanRHS(rhs)}, "${flags}");`);
        break;

      case 'isInteger':
      case 'isFinite':
      case 'isNaN':
        expr = `Number.${op}(${path})`;
        break;

      case 'isArray':
        expr = `Array.isArray(${path})`;
        break;
    }
  }

  expr = negate ? `!(${expr})` : expr;

  return {
    stmts,
    expr
  };
}

export function compileMatcher(nodes, opts = OPTS) {
  let { expr, stmts } = compileExpr(nodes, opts);

  return new Function('$ops', `
    ${stmts.join('\n')};
    return ($, $i = 0) => ${expr};
  `)(opts.ops ?? EMPTY_OBJ);
}

/*
// these are for loop exits
case 'all'
case 'first': // early break after count
case 'last':  // backwards early break
  lhs = node[1]; // howMany
  rhs = node[2];
case 'only':  // early return nothing if count > 1
*/

function _compileFilter(nodes, opts = OPTS, useIdx = false) {
  let { expr, stmts } = compileExpr(nodes, opts);

  return new Function('$ops', `
    ${stmts.join('\n')}
    return arr => {
      let out = [];
      for (let $i = 0; $i < arr.length; $i++) {
        let $ = arr[$i];
        ${expr} && out.push(${useIdx ? '$i' : '$'});
      }
      return out;
    };
  `)(opts.ops ?? EMPTY_OBJ);
}

// objs struct should be like {"prop": [1,2,3,4], "other": ['a','b','c']}
export function compileExprCols(nodes, names = EMPTY_ARR, opts = OPTS) {
  let { expr, stmts } = compileExpr(nodes, opts);

  if (names.length > 0) {
    names.forEach((name, i) => {
      if (!/[^\w.]/.test(name)) {
        expr = expr.replaceAll(name, `[${i}][$i]`);
      }
    });
  }

  return { expr, stmts };
}

export function compileMatcherCols(nodes, names, opts = OPTS) {
  let { expr, stmts } = compileExprCols(nodes, names, opts);

  return new Function('$ops', `
    ${stmts.join('\n')};
    return ($, $i = 0) => ${expr};
  `)(opts.ops ?? EMPTY_OBJ);
}

const filterColsIdxsBody = expr => `
      let len = cols[0].length;

      let $ = cols;
      let idxs = [];

      for (let $i = 0; $i < len; $i++) {
        ${expr} && idxs.push($i);
      }
`;

export function compileFilterColsIdxs(nodes, names, opts = OPTS) {
  let { expr, stmts } = compileExprCols(nodes, names, opts);

  return new Function('$ops', `
    ${stmts.join('\n')}
    return cols => {
      ${filterColsIdxsBody(expr)}
      return idxs;
    };
  `)(opts.ops ?? EMPTY_OBJ);
}

export function compileFilterCols(nodes, names, opts = OPTS) {
  let { expr, stmts } = compileExprCols(nodes, names, opts);

  return new Function('$ops', `
    ${stmts.join('\n')}
    return cols => {
      ${filterColsIdxsBody(expr)}

      return cols.map(col => {
        let fcol = [];

        for (let i = 0; i < idxs.length; i++) {
          fcol.push(col[idxs[i]]);
        }

        return fcol;
      });
    };
  `)(opts.ops ?? EMPTY_OBJ);
}

export const compileFilter = (nodes, opts = OPTS) => _compileFilter(nodes, opts);
export const compileFilterIdxs = (nodes, opts = OPTS) => _compileFilter(nodes, opts, true);

// TODO:
// insert optional chaining
// support negative index to avoid handling .at(-1) fn call
// hasKey?
// typeof (string, boolean, number, function, object, array)
// date ranges?
// array intersect? (list in list)