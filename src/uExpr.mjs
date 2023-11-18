const clean = v => JSON.stringify(v);
const glue = (ctx, path) => path == '$' || path == '$i' ? path : ctx + path.replace(/[^\w.?\[\]]/ig, '');

export function compileExpr(node, stmts = [], ctx = '$') {
  let op = node[0];
  let lhs = node[1];
  let rhs = node[2];

  let expr = '';

  let negate = op[0] == '!' && op != '!=' && op != '!==' && op !== '!!';

  op = negate ? op.slice(1) : op;

  let path = op != '&&' && op != '||' ? glue(ctx, lhs) : '';

  switch (op) {
    case '&&':
    case '||':
      let exprs = node.slice(1).map(node2 => compileExpr(node2, stmts, ctx));
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
      expr = `${path} ${op} ${clean(rhs)}`;
      break;

    case 'some':
    case 'every':
      expr = `${path}.${op}(($, $i) => ${compileExpr(rhs, stmts).expr})`;
      break;

    case ',':
    case 'in':
      expr = `$${stmts.length}.has(${path})`;
      stmts.push(`let $${stmts.length} = new Set(${clean(rhs)});`);
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
      expr = `${path} ${lop} ${clean(min)} && ${path} ${rop} ${clean(max)}`;
      break;

    case 'startsWith':
    case '^':
      expr = `${path}.startsWith(${clean(rhs)})`;
      break;

    case 'endsWith':
    case '$':
      expr = `${path}.endsWith(${clean(rhs)})`;
      break;

    case 'includes':
    case '*':
      expr = `${path}.includes(${clean(rhs)})`;
      break;

    case 're':
    case 'rei':
    case '/':
    case '/i':
      let flags = op.at(-1) == 'i' ? 'i' : '';
      expr = `$${stmts.length}.test(${path})`;
      stmts.push(`let $${stmts.length} = new RegExp(${clean(rhs)}, "${flags}");`);
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

  expr = negate ? `!(${expr})` : expr;

  return {
    stmts,
    expr
  };
}

export function compileMatcher(nodes) {
  let { expr, stmts } = compileExpr(nodes);

  return new Function(`
    ${stmts.join('\n')};
    return ($, $i = 0) => ${expr};
  `)();
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
export function compileFilter(nodes, mode = 'all') {
  let { expr, stmts } = compileExpr(nodes);

  return new Function(`
    ${stmts.join('\n')}
    return arr => {
      let out = [];
      for (let $i = 0; $i < arr.length; $i++) {
        let $ = arr[$i];
        ${expr} && out.push($);
      }
      return out;
    };
  `)();
}

// TODO:
// insert optional chaining
// support negative index to avoid handling .at(-1) fn call
// hasKey?
// typeof (string, boolean, number, function, object, array)
// date ranges?
// array intersect? (list in list)