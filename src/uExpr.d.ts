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

  // ~ | fuzzyMatch
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

export type UserOp = ($: unknown, $i?: number, $args?: unknown) => boolean;

export interface InitOpts {
  /** auto-add optional chaining */
  chain?: boolean;
  /** user-defined custom ops */
  ops?: Record<string, UserOp>;
}

export function initMatcher        <TItem = any>(expr: Expr, opts?: InitOpts): (item: TItem, idx: number) => boolean;
export function initFilter         <TItem = any>(expr: Expr, opts?: InitOpts): (items: TItem[], idxs?: number[]) => TItem[];
export function initFilterIdxs     <TItem = any>(expr: Expr, opts?: InitOpts): (items: TItem[], idxs?: number[]) => number[];

export function initMatcherCols    <TCols = any>(expr: Expr, names?: string[], opts?: InitOpts): (cols: TCols, idx: number) => boolean;
export function initFilterCols     <TCols = any>(expr: Expr, names?: string[], opts?: InitOpts): (cols: TCols, idxs?: number[]) => TCols;
export function initFilterColsIdxs <TCols = any>(expr: Expr, names?: string[], opts?: InitOpts): (cols: TCols, idxs?: number[]) => number[];