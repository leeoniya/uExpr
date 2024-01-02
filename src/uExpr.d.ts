export type CombineExpr = [op: CombineOp, ...nodes: Expr[]];
export type CombineOp = '&&' | '||';

export type StringExpr = [op: StringOp, lhs: string, rhs: string];
export type StringOp =
  '*'  | 'includes'     |
  '^'  | 'startsWith'   |
  '$'  | 'endsWith'     |
  '/'  | 'regexp'       |
  '/i' | 'regexpi'      |

  '!*'  | '!includes'   |
  '!^'  | '!startsWith' |
  '!$'  | '!endsWith'   |
  '!/'  | '!regexp'     |
  '!/i' | '!regexpi'
;

export type ArrayHasExpr = [op: ArrayHasOp, lhs: string, rhs: Expr];
export type ArrayHasOp =
  'some'   |
  'every'  |

  '!some'  |
  '!every'
;

export type InListExpr = [op: InListOp, lhs: string, rhs: []];
export type InListOp =
  ','   |
  'in'  |

  '!,'  |
  '!in'
;

export type CompareExpr = [op: CompareOp, lhs: string, rhs: number | string | boolean | null];
export type CompareOp = '==' | '!=' | '===' | '!==' | '>=' | '<=' | '<' | '>';

export type RangeExpr = [op: RangeOp, lhs: string, rhs: [min: number, max: number]];
export type RangeOp =
  '-'   |
  '[]'  |
  '()'  |
  '[)'  |
  '(]'  |

  '!-'  |
  '![]' |
  '!()' |
  '![)' |
  '!(]'
;

export type IsTypeExpr = [op: IsTypeOp, lhs: string];
export type IsTypeOp =
  'isInteger'  |
  'isFinite'   |
  'isNaN'      |
  'isArray'    |

  '!isInteger' |
  '!isFinite'  |
  '!isNaN'     |
  '!isArray'
;

export type TruthyExpr = [op: TruthyOp, lhs: string];
export type TruthyOp =
  '!'       |
  'falsy'   |
  '!!'      |
  'truthy'  |

  '!falsy'  |
  '!truthy'
;

export type Op = CombineOp | StringOp | ArrayHasOp | InListOp | CompareOp | RangeOp | IsTypeOp | TruthyOp;
export type Expr = CombineExpr | StringExpr | ArrayHasExpr | InListExpr | CompareExpr | RangeExpr | IsTypeExpr | TruthyExpr;

export function compileFilter<T = any>(expr: Expr): (val: T[]) => T[];
export function compileMatcher<T = any>(expr: Expr): (val: T, idx: number) => boolean;
