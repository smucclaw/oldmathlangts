// a simple math lang with support for booleans and number operators.
// evaluation is eager and happens at construction time.
//

import * as jsonFactory from 'json-logic-js'
import { v4 as uuidv4 } from 'uuid';

// typescript recommends against enum per se, but offers this suggestion, which is unavoidably noisy
export const NumBinOp = { Add: 0, Sub: 1, Mul: 2, Div: 3, MaxOf2: 4, MinOf2: 5, Mod: 6 } as const  // Numeric expressions:   binary:  + - * /
export const BoolBinOp = { And: 0, Or: 1, BoolEq: 2, BoolNeq: 3 } as const  // Boolean expressions:   binary:  && || == !=
export const BoolUnaOp = { BoolNot: 0 } as const  //                        unary:   !
export const BoolTriOp = { IfThenElse: 0 } as const  //                        ternary: if then else
export const NumToBoolOp = { NBlt: 0, NBlte: 1, NBgt: 2, NBgte: 3, NBeq: 4, NBneq: 5 } as const  // Numeric to Bool:       binary: > >= < <= == !=
export const NumFoldOp = { Max: 0, Min: 1, Sum: 2, Product: 3 } as const  // Fold numeric lists:    max, min, sum, product
export const BoolFoldOp = { Any: 0, All: 1 } as const  // Fold boolean lists:    any, all
export const StrToBoolOp = { StrEq: 0, StrNeq: 1 } as const  // String Equality

type NumBinOpT = typeof NumBinOp[keyof typeof NumBinOp]
type BoolBinOpT = typeof BoolBinOp[keyof typeof BoolBinOp]
type BoolUnaOpT = typeof BoolUnaOp[keyof typeof BoolUnaOp]
type BoolTriOpT = typeof BoolTriOp[keyof typeof BoolTriOp]
type NumToBoolOpT = typeof NumToBoolOp[keyof typeof NumToBoolOp]
type NumFoldOpT = typeof NumFoldOp[keyof typeof NumFoldOp]
type BoolFoldOpT = typeof BoolFoldOp[keyof typeof BoolFoldOp]
type StrToBoolOpT = typeof StrToBoolOp[keyof typeof StrToBoolOp]

export var symTab: Record<string, any> = {}
export type ExprFn = () => Expr<any>;

// initialize the symtab with user-provided data
export function initSymTab(st: Record<string, any>) {
  symTab = { ...st }
  return symTab
}

// all expressions preserve their subexpressions and are equipped with textual explanations
type Expl = string;
export abstract class Expr<Base> {
  expl: Expl = "uninitialized";
  name !: string;
  val: Base | undefined;
  chil: Expr<any>[] = [];
  jsonLogicOp?: jsonFactory.ReservedOperations; // to be obsoleted by actual jsonLogic attribute below
  jsonLogic?: jsonFactory.RulesLogic;
  uuid: string;

  getVar(want: string): Expr<any> | undefined {
    if (symTab.hasOwnProperty(this.name)) {
      console.info(`getVar: ${this.name} returning wanted variable from symTab, ${this.name} = ${this.val}`)
      return symTab[this.name]
    }
    if (this.name == want) {
      symTab[this.name] = this
      console.info(`getVar: ${this.name} saving wanted variable to symTab, ${this.name} = ${this.val}`)
      return this
    }
    // we may have to be smart about GetVar("parent.child") if we have nested records; as a hack we can flatten all nested records to just strings.

    for (let c of this.chil) {
      let r = c.getVar(want)
      if (r != undefined) { return r }
    }
    return undefined
  }

  constructor() {
    this.uuid = uuidv4();
    symTab[this.name] = this.val;
  }

}

// given an expression tree, extract a variable named somewhere within
// base class for numeric types
abstract class NumExpr extends Expr<number> { }

// base numeric value
export class Num0 extends NumExpr {
  constructor(public name: string, public val: number | undefined) { super(); this.expl = name }
}

export class GetVar<Base> extends Expr<Base> {
  constructor(public name: string) {
    super();
    this.val = symTab[this.name];

    if (this.val == undefined) {
      console.log(`GetVar on ${name} returned undefined! If this is not expected, you may want to uncomment symtab dump in mathlang.ts. Or maybe you mean to treat this as a string.`);
      //      console.log("symtab is")
      //      console.log(symTab)
    }
  }
}

export class GetVarBool extends GetVar<boolean> {
  constructor(public name: string) {
    console.log(`GetVarBool: running on ${name}`)
    super(name);
    if (this.val == undefined) {
      console.log("GetVar of BoolExpr is null, returning false; thus do we approximate a ternary logic with negation as failure");
      this.val = false as any;
    }
  }
}

export class SetVar<Base> extends Expr<Base> {
  constructor(public name: string,
    public val: Base
  ) {
    super();
    symTab[this.name] = this.val;
    console.log(`SetVar saving ${this.name} = ${this.val}`)
    }
}

// SetVar doesn't preserve a tree of child expressions, because it is called with the value not the expression.
// we work around this by having each class explicitly save output into the symtab

// binary numeric expressions
export class Num2 extends NumExpr {
  constructor(public name: string,
    public operator: NumBinOpT,
    public arg1: NumExpr,
    public arg2: NumExpr) {
    super();
    this.chil = [arg1, arg2]
    if (arg1.val == undefined && arg2.val == undefined) { this.val = undefined; this.expl = `Num2 on two undefined elements ${arg1.name} / ${arg2.name}`; return }
    //    if (arg1.val == undefined || arg2.val == undefined) { console.log(`Num2: dealing with undefined in ${this.name}`) }

    if (arg1.val == undefined && this.operator == NumBinOp.MaxOf2) { this.val = arg2.val; return }
    if (arg1.val == undefined && this.operator == NumBinOp.MinOf2) { this.val = arg2.val; return }
    if (arg1.val == undefined && this.operator == NumBinOp.Add) { this.val = arg2.val; return }
    if (arg1.val == undefined && this.operator == NumBinOp.Mul) { this.val = arg2.val; return }

    if (arg2.val == undefined && this.operator == NumBinOp.MaxOf2) { this.val = arg1.val; return }
    if (arg2.val == undefined && this.operator == NumBinOp.MinOf2) { this.val = arg1.val; return }
    if (arg2.val == undefined && this.operator == NumBinOp.Add) { this.val = arg1.val; return }
    if (arg2.val == undefined && this.operator == NumBinOp.Mul) { this.val = arg1.val; return }

    if (arg1.val == undefined) { this.val = undefined; this.expl = `Num2 of undefined element ${arg1.name}`; return }
    if (arg2.val == undefined) { this.val = undefined; this.expl = `Num2 of undefined element ${arg2.name}`; return }

    switch (this.operator) {
      case NumBinOp.Add: this.expl = "sum of"; this.val = arg1.val + arg2.val; this.jsonLogicOp = "+"; break
      case NumBinOp.Sub: this.expl = "difference between"; this.val = arg1.val - arg2.val; this.jsonLogicOp = "-"; break
      case NumBinOp.Mul: this.expl = "product of"; this.val = arg1.val * arg2.val; this.jsonLogicOp = "*"; break
      case NumBinOp.Div: this.expl = "dividend of"; this.val = arg1.val / arg2.val; this.jsonLogicOp = "/"; break
      case NumBinOp.Mod: this.expl = "modulo of"; this.val = arg1.val % arg2.val; this.jsonLogicOp = "%"; break
      case NumBinOp.MaxOf2: this.expl = "greater of"; this.val = Math.max(arg1.val, arg2.val); this.jsonLogicOp = ">"; break
      case NumBinOp.MinOf2: this.expl = "lesser of"; this.val = Math.min(arg1.val, arg2.val); this.jsonLogicOp = "<"; break
    }
  }
}

// base class for boolean types
abstract class BoolExpr extends Expr<boolean> { }

// base boolean value
export class Bool0 extends BoolExpr {
  constructor(public name: string, public val: boolean | undefined) { super(); this.expl = name }
}

// unary boolean expressions
export class Bool1 extends BoolExpr {
  constructor(public name: string,
    public operator: BoolUnaOpT,
    public arg1: BoolExpr) {
    super()
    this.chil = [arg1]
    if (arg1.val == undefined) { this.val = undefined; this.expl = `Boolean not of undefined ${arg1.name}`; return }
    switch (operator) {
      case BoolUnaOp.BoolNot: {
        this.expl = "not"
        this.jsonLogicOp = "!";
        this.val = !arg1.val
      }
    }
  }
}

// binary boolean expressions
export class Bool2 extends BoolExpr {
  constructor(public name: string,
    public operator: BoolBinOpT,
    public arg1: BoolExpr,
    public arg2: BoolExpr) {
    super()
    this.chil = [arg1, arg2]
    // if we want NAF we can treat undefined as false and continue through, instead of returning.
    if (arg1.val == undefined) { this.val = undefined; this.expl = `Bool2 of undefined element ${arg1.name}`; return }
    if (arg2.val == undefined) { this.val = undefined; this.expl = `Bool2 of undefined element ${arg2.name}`; return }

    switch (operator) {
      case BoolBinOp.And: this.expl = "and"; this.val = arg1.val && arg2.val; this.jsonLogicOp = "and"; break;
      case BoolBinOp.Or: this.expl = "or"; this.val = arg1.val || arg2.val; this.jsonLogicOp = "or"; break;
      case BoolBinOp.BoolEq: this.expl = "eq"; this.val = arg1.val == arg2.val; this.jsonLogicOp = "=="; break;
      case BoolBinOp.BoolNeq: this.expl = "ne"; this.val = arg1.val != arg2.val; this.jsonLogicOp = "!="; break;
    }
  }
}

// ternary boolean expression could return either a NumExpr or a BoolExpr
export class Bool3<Base> extends Expr<Base> {
  constructor(public name: string,
    public operator: BoolTriOpT,
    public arg1: BoolExpr,
    public arg2: Expr<Base>,
    public arg3: Expr<Base>,
  ) {
    super()
    if (arg1.val == undefined) { this.expl = `Bool3 of undefined condition ${arg1.name}, treating as false` }
    switch (this.operator) {
      case BoolTriOp.IfThenElse:
        this.jsonLogicOp = "if";

        if (arg1.val && arg2.val == undefined) { this.val = undefined; this.expl = `Bool3-true ${arg2.name} is undefined`; return }
        if (!arg1.val && arg3.val == undefined) { this.val = undefined; this.expl = `Bool3-false ${arg3.name} is undefined`; return }

        if (arg1.val) { this.expl = "true branch"; this.val = arg2.val; this.chil = [arg1, arg2] }
        else { this.expl = "false branch"; this.val = arg3.val; this.chil = [arg1, arg3] }
    }
  }
}

// arithmetic comparisons return boolean
export class NumToBool2 extends BoolExpr {
  constructor(public name: string,
    public operator: NumToBoolOpT,
    public arg1: NumExpr,
    public arg2: NumExpr) {
    super()
    this.chil = [arg1, arg2]
    if (arg1.val == undefined || arg2.val == undefined) { this.val = undefined; this.expl = `NumToBool2 of undefined ${arg1.name}`; return }
    // [TODO] as with above Num2, do sensible behaviour when one argument is undefined
    switch (this.operator) {
      case NumToBoolOp.NBlt: this.val = arg1.val < arg2.val; this.expl = "less than"; this.jsonLogicOp = "<"; break
      case NumToBoolOp.NBlte: this.val = arg1.val <= arg2.val; this.expl = "less than or equal"; this.jsonLogicOp = "<="; break
      case NumToBoolOp.NBgt: this.val = arg1.val > arg2.val; this.expl = "greater than"; this.jsonLogicOp = ">"; break
      case NumToBoolOp.NBgte: this.val = arg1.val >= arg2.val; this.expl = "greater than or equal"; this.jsonLogicOp = ">="; break
      case NumToBoolOp.NBeq: this.val = arg1.val == arg2.val; this.expl = "equal"; this.jsonLogicOp = "=="; break
      case NumToBoolOp.NBneq: this.val = arg1.val != arg2.val; this.expl = "not equal"; this.jsonLogicOp = "!="; break
    }
  }
}

// maximum and mininum folds over numeric lists
export class NumFold extends NumExpr {
  constructor(public name: string,
    public operator: NumFoldOpT,
    public args: NumExpr[]) {
    super()

    if (args.map(o => o.val).includes(undefined)) {
      let sad = args.filter(o => o.val == undefined).map(o => o.name).join(", ");
      this.val = undefined;
      this.expl = `NumFold called over list with undefined values [${sad}]; dropping undefined values`;
    }
    this.chil = args.filter(o => o.val != undefined)

    switch (this.operator) {
      case NumFoldOp.Max: this.val = Math.max(...this.chil.map(o => o.val)); this.jsonLogicOp = "max"; this.expl = "max"; break
      case NumFoldOp.Min: this.val = Math.min(...this.chil.map(o => o.val)); this.jsonLogicOp = "min"; this.expl = "min"; break
      case NumFoldOp.Sum: this.val = this.chil.map(o => o.val).reduce((pv, cv) => pv + cv); this.jsonLogicOp = "reduce"; this.expl = "sum"; break
      case NumFoldOp.Product: this.val = this.chil.map(o => o.val).reduce((pv, cv) => pv * cv); this.jsonLogicOp = "reduce"; this.expl = "product"; break
    }
  }
}

// i think we need to have an explicit ExprList class in mathlang.ts to reflect the ExprList type from MathLang.hs, so we can support concatting.

// any/all folds over boolean lists
export class BoolFold extends BoolExpr {
  constructor(public name: string,
    public operator: BoolFoldOpT,
    public args: BoolExpr[]) {
    super()

    if (args.map(o => o.val).includes(undefined)) {
      let sad = args.filter(o => o.val == undefined).map(o => o.name).join(", ");
      this.val = undefined;
      this.expl = `BoolFold called over list with undefined values [${sad}]; dropping undefined values`;
    }
    this.chil = args.filter(o => o.val != undefined)

    switch (this.operator) {
      case BoolFoldOp.Any: this.val = args.map(o => o.val).some(id => id); this.expl = "any"; this.jsonLogicOp = "some"; break;
      case BoolFoldOp.All: this.val = args.map(o => o.val).every(id => id); this.expl = "all"; this.jsonLogicOp = "all"; break;
    }
  }
}

// trace an explanation of an expression
export function explTrace(expr: Expr<any>, depth: number): void {
  let prefix = "*".repeat(depth)
  let indent = " ".repeat(20 - depth)
  if (expr == undefined) {
    console.error("explTrace given undefined expr, proceeding")
  } else if (!expr.hasOwnProperty("val")) {
    console.error(`explTrace given expr with no val: ${expr.name}; aborting`)
    process.exit();
  }

  let rounded
    = expr.val == undefined
      ? "undefined"
      : typeof expr.val === 'number'
        ? (shouldRoundToNearestInt(expr.val) ? Math.round(expr.val).toString() : expr.val.toString())
        : expr.val.toString()

  let ndent = " ".repeat(Math.max(20 - rounded.length, 2))
  console.log(`${prefix} ${indent} ${ndent} ${rounded}    ${expr.name}` + (expr.chil.length > 0 ? ` = ${expr.expl}` : ""))

  if (expr.val == undefined) {
    console.log(`${expr.name} has undefined value`)
    for (let c of expr.chil) {
      console.log(c.name)
    }
    if (expr.chil.length == 0) {
      console.log("#+BEGIN_SRC json")
      console.log(JSON.stringify(expr, null, 2))
      console.log("#+END_SRC")
    }
  }

  for (let c of expr.chil) {
    explTrace(c, depth + 1)
  }
}

// fold an expr to a flat dictionary containing all childrens' .name = .val pairs
export function exprReduce(expr: Expr<any>): any {
  return (expr.chil.reduce
    ((result, current) => { return ({ ...result, ...exprReduce(current) }) }
      , { [expr.name]: expr.val }))
  // note children names will overwrite parent name
}

type NLabel = string
type grNode = { nlabel: NLabel; nval: any; operator: string; children: grNode[] }
// type grEdge = { elabel: string; nIn: NLabel; nOut: NLabel }
// translate an expr to a computation/data-flow graph suitable for graphviz.
export function asGr(expr: Expr<any>): grNode {
  return (
    {
      nlabel: expr.name,
      nval: expr.val,
      operator: expr.jsonLogicOp ? expr.jsonLogicOp.toString() : "unknown mathlang operator",
      children: expr.chil.map(o => asGr(o))
    })
}

export function asDot(expr: Expr<any>, dim: Boolean): string {
  if (expr.name == "noShow" && expr.val > 0) { return (`  "${expr.uuid}" [ label="${expr.val}\\n(pruned)" ]`) }
  if (expr.name == "noShow") { return (`// pruned ${expr.expl}`) }
  var shouldDim = expr.val == false
  var bgcolor: string[] = []
  if (!(dim || shouldDim)) {
    bgcolor = ["style=filled"]
    if (expr.val) { bgcolor.push(...["color=lightblue"]) }
    if (expr.jsonLogicOp == "if") { bgcolor.push(...["color=lightgreen"]) }
  }
  var myval = String(expr.val)
  if (expr.name.endsWith("percentage") || expr.name.endsWith("percent")) { myval = String(expr.val * 100) + "%" }
  var labelparts = [myval, expr.name, expr.expl]
    .filter(o => o != undefined && o != "uninitialized").join("\\n")
  var attrparts = [`label="${labelparts}"`, bgcolor.join(", ")].join(", ")
  let nodelist = `  "${expr.uuid}" [ ${attrparts} ];`
  let edgelist = expr.chil
    .filter(c => (!(c.name == "noShow" && !c.val)))
    .map(c => `  "${expr.uuid}" -> "${c.uuid}"`).join("\n")
  let recursed = expr.chil.map(c => asDot(c, dim || shouldDim)).join("\n");

  return (`
${nodelist}
${edgelist}
${recursed}
`);
}

function shouldRoundToNearestInt(float: number, threshold: number = 0.001): boolean {
  const difference = Math.abs(float - Math.round(float));
  return difference <= threshold;
}


// string expressions
abstract class StrExpr extends Expr<string> { }

export class Str0 extends StrExpr {
  constructor(public name: string, public val : string) {
    super(); this.expl = name;
  }
}

export function Str0_(name: string, val?: string) : Str0 {
  if (val == undefined) { val = name }
  return new Str0(name, val)
}

// string equality
export class StrToBool2 extends BoolExpr {
  constructor(public name: string,
    public operator: StrToBoolOpT,
    public arg1: StrExpr,
    public arg2: StrExpr) {
    super();
    this.chil = [arg1, arg2]
    if (arg1.val == undefined && arg2.val == undefined) { this.val = undefined; this.expl = `StrToBool2 on two undefined elements ${arg1.name} / ${arg2.name}`; return }

    switch (this.operator) {
      case StrToBoolOp.StrEq: this.expl = "string equal"; this.val = arg1.val == arg2.val; this.jsonLogicOp = "=="; break
      case StrToBoolOp.StrNeq: this.expl = "string unequal"; this.val = arg1.val != arg2.val; this.jsonLogicOp = "!="; break
    }
  }
}

