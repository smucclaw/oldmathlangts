"use strict";
// a simple math lang with support for booleans and number operators.
// evaluation is eager and happens at construction time.
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrToBool2 = exports.Str0_ = exports.Str0 = exports.asDot = exports.asGr = exports.exprReduce = exports.explTrace = exports.BoolFold = exports.NumFold = exports.NumToBool2 = exports.Bool3 = exports.Bool2 = exports.Bool1 = exports.Bool0 = exports.Num2 = exports.SetVar = exports.GetVarBool = exports.GetVar = exports.Num0 = exports.Expr = exports.initSymTab = exports.symTab = exports.StrToBoolOp = exports.BoolFoldOp = exports.NumFoldOp = exports.NumToBoolOp = exports.BoolTriOp = exports.BoolUnaOp = exports.BoolBinOp = exports.NumBinOp = void 0;
const uuid_1 = require("uuid");
// typescript recommends against enum per se, but offers this suggestion, which is unavoidably noisy
exports.NumBinOp = { Add: 0, Sub: 1, Mul: 2, Div: 3, MaxOf2: 4, MinOf2: 5, Mod: 6 }; // Numeric expressions:   binary:  + - * /
exports.BoolBinOp = { And: 0, Or: 1, BoolEq: 2, BoolNeq: 3 }; // Boolean expressions:   binary:  && || == !=
exports.BoolUnaOp = { BoolNot: 0 }; //                        unary:   !
exports.BoolTriOp = { IfThenElse: 0 }; //                        ternary: if then else
exports.NumToBoolOp = { NBlt: 0, NBlte: 1, NBgt: 2, NBgte: 3, NBeq: 4, NBneq: 5 }; // Numeric to Bool:       binary: > >= < <= == !=
exports.NumFoldOp = { Max: 0, Min: 1, Sum: 2, Product: 3 }; // Fold numeric lists:    max, min, sum, product
exports.BoolFoldOp = { Any: 0, All: 1 }; // Fold boolean lists:    any, all
exports.StrToBoolOp = { StrEq: 0, StrNeq: 1 }; // String Equality
exports.symTab = {};
// initialize the symtab with user-provided data
function initSymTab(st) {
    exports.symTab = Object.assign({}, st);
    return exports.symTab;
}
exports.initSymTab = initSymTab;
class Expr {
    getVar(want) {
        if (exports.symTab.hasOwnProperty(this.name)) {
            console.info(`getVar: ${this.name} returning wanted variable from symTab, ${this.name} = ${this.val}`);
            return exports.symTab[this.name];
        }
        if (this.name == want) {
            exports.symTab[this.name] = this;
            console.info(`getVar: ${this.name} saving wanted variable to symTab, ${this.name} = ${this.val}`);
            return this;
        }
        // we may have to be smart about GetVar("parent.child") if we have nested records; as a hack we can flatten all nested records to just strings.
        for (let c of this.chil) {
            let r = c.getVar(want);
            if (r != undefined) {
                return r;
            }
        }
        return undefined;
    }
    constructor() {
        this.expl = "uninitialized";
        this.chil = [];
        this.uuid = (0, uuid_1.v4)();
        exports.symTab[this.name] = this.val;
    }
}
exports.Expr = Expr;
// given an expression tree, extract a variable named somewhere within
// base class for numeric types
class NumExpr extends Expr {
}
// base numeric value
class Num0 extends NumExpr {
    constructor(name, val) {
        super();
        this.name = name;
        this.val = val;
        this.expl = name;
    }
}
exports.Num0 = Num0;
class GetVar extends Expr {
    constructor(name) {
        super();
        this.name = name;
        this.val = exports.symTab[this.name];
        if (this.val == undefined) {
            console.log(`GetVar on ${name} returned undefined! If this is not expected, you may want to uncomment symtab dump in mathlang.ts. Or maybe you mean to treat this as a string.`);
            //      console.log("symtab is")
            //      console.log(symTab)
        }
    }
}
exports.GetVar = GetVar;
class GetVarBool extends GetVar {
    constructor(name) {
        console.log(`GetVarBool: running on ${name}`);
        super(name);
        this.name = name;
        if (this.val == undefined) {
            console.log("GetVar of BoolExpr is null, returning false; thus do we approximate a ternary logic with negation as failure");
            this.val = false;
        }
    }
}
exports.GetVarBool = GetVarBool;
class SetVar extends Expr {
    constructor(name, val) {
        super();
        this.name = name;
        this.val = val;
        exports.symTab[this.name] = this.val;
        console.log(`SetVar saving ${this.name} = ${this.val}`);
    }
}
exports.SetVar = SetVar;
// SetVar doesn't preserve a tree of child expressions, because it is called with the value not the expression.
// we work around this by having each class explicitly save output into the symtab
// binary numeric expressions
class Num2 extends NumExpr {
    constructor(name, operator, arg1, arg2) {
        super();
        this.name = name;
        this.operator = operator;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.chil = [arg1, arg2];
        if (arg1.val == undefined && arg2.val == undefined) {
            this.val = undefined;
            this.expl = `Num2 on two undefined elements ${arg1.name} / ${arg2.name}`;
            return;
        }
        //    if (arg1.val == undefined || arg2.val == undefined) { console.log(`Num2: dealing with undefined in ${this.name}`) }
        if (arg1.val == undefined && this.operator == exports.NumBinOp.MaxOf2) {
            this.val = arg2.val;
            return;
        }
        if (arg1.val == undefined && this.operator == exports.NumBinOp.MinOf2) {
            this.val = arg2.val;
            return;
        }
        if (arg1.val == undefined && this.operator == exports.NumBinOp.Add) {
            this.val = arg2.val;
            return;
        }
        if (arg1.val == undefined && this.operator == exports.NumBinOp.Mul) {
            this.val = arg2.val;
            return;
        }
        if (arg2.val == undefined && this.operator == exports.NumBinOp.MaxOf2) {
            this.val = arg1.val;
            return;
        }
        if (arg2.val == undefined && this.operator == exports.NumBinOp.MinOf2) {
            this.val = arg1.val;
            return;
        }
        if (arg2.val == undefined && this.operator == exports.NumBinOp.Add) {
            this.val = arg1.val;
            return;
        }
        if (arg2.val == undefined && this.operator == exports.NumBinOp.Mul) {
            this.val = arg1.val;
            return;
        }
        if (arg1.val == undefined) {
            this.val = undefined;
            this.expl = `Num2 of undefined element ${arg1.name}`;
            return;
        }
        if (arg2.val == undefined) {
            this.val = undefined;
            this.expl = `Num2 of undefined element ${arg2.name}`;
            return;
        }
        switch (this.operator) {
            case exports.NumBinOp.Add:
                this.expl = "sum of";
                this.val = arg1.val + arg2.val;
                this.jsonLogicOp = "+";
                break;
            case exports.NumBinOp.Sub:
                this.expl = "difference between";
                this.val = arg1.val - arg2.val;
                this.jsonLogicOp = "-";
                break;
            case exports.NumBinOp.Mul:
                this.expl = "product of";
                this.val = arg1.val * arg2.val;
                this.jsonLogicOp = "*";
                break;
            case exports.NumBinOp.Div:
                this.expl = "dividend of";
                this.val = arg1.val / arg2.val;
                this.jsonLogicOp = "/";
                break;
            case exports.NumBinOp.Mod:
                this.expl = "modulo of";
                this.val = arg1.val % arg2.val;
                this.jsonLogicOp = "%";
                break;
            case exports.NumBinOp.MaxOf2:
                this.expl = "greater of";
                this.val = Math.max(arg1.val, arg2.val);
                this.jsonLogicOp = ">";
                break;
            case exports.NumBinOp.MinOf2:
                this.expl = "lesser of";
                this.val = Math.min(arg1.val, arg2.val);
                this.jsonLogicOp = "<";
                break;
        }
    }
}
exports.Num2 = Num2;
// base class for boolean types
class BoolExpr extends Expr {
}
// base boolean value
class Bool0 extends BoolExpr {
    constructor(name, val) {
        super();
        this.name = name;
        this.val = val;
        this.expl = name;
    }
}
exports.Bool0 = Bool0;
// unary boolean expressions
class Bool1 extends BoolExpr {
    constructor(name, operator, arg1) {
        super();
        this.name = name;
        this.operator = operator;
        this.arg1 = arg1;
        this.chil = [arg1];
        if (arg1.val == undefined) {
            this.val = undefined;
            this.expl = `Boolean not of undefined ${arg1.name}`;
            return;
        }
        switch (operator) {
            case exports.BoolUnaOp.BoolNot: {
                this.expl = "not";
                this.jsonLogicOp = "!";
                this.val = !arg1.val;
            }
        }
    }
}
exports.Bool1 = Bool1;
// binary boolean expressions
class Bool2 extends BoolExpr {
    constructor(name, operator, arg1, arg2) {
        super();
        this.name = name;
        this.operator = operator;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.chil = [arg1, arg2];
        // if we want NAF we can treat undefined as false and continue through, instead of returning.
        if (arg1.val == undefined) {
            this.val = undefined;
            this.expl = `Bool2 of undefined element ${arg1.name}`;
            return;
        }
        if (arg2.val == undefined) {
            this.val = undefined;
            this.expl = `Bool2 of undefined element ${arg2.name}`;
            return;
        }
        switch (operator) {
            case exports.BoolBinOp.And:
                this.expl = "and";
                this.val = arg1.val && arg2.val;
                this.jsonLogicOp = "and";
                break;
            case exports.BoolBinOp.Or:
                this.expl = "or";
                this.val = arg1.val || arg2.val;
                this.jsonLogicOp = "or";
                break;
            case exports.BoolBinOp.BoolEq:
                this.expl = "eq";
                this.val = arg1.val == arg2.val;
                this.jsonLogicOp = "==";
                break;
            case exports.BoolBinOp.BoolNeq:
                this.expl = "ne";
                this.val = arg1.val != arg2.val;
                this.jsonLogicOp = "!=";
                break;
        }
    }
}
exports.Bool2 = Bool2;
// ternary boolean expression could return either a NumExpr or a BoolExpr
class Bool3 extends Expr {
    constructor(name, operator, arg1, arg2, arg3) {
        super();
        this.name = name;
        this.operator = operator;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.arg3 = arg3;
        if (arg1.val == undefined) {
            this.expl = `Bool3 of undefined condition ${arg1.name}, treating as false`;
        }
        switch (this.operator) {
            case exports.BoolTriOp.IfThenElse:
                this.jsonLogicOp = "if";
                if (arg1.val && arg2.val == undefined) {
                    this.val = undefined;
                    this.expl = `Bool3-true ${arg2.name} is undefined`;
                    return;
                }
                if (!arg1.val && arg3.val == undefined) {
                    this.val = undefined;
                    this.expl = `Bool3-false ${arg3.name} is undefined`;
                    return;
                }
                if (arg1.val) {
                    this.expl = "true branch";
                    this.val = arg2.val;
                    this.chil = [arg1, arg2];
                }
                else {
                    this.expl = "false branch";
                    this.val = arg3.val;
                    this.chil = [arg1, arg3];
                }
        }
    }
}
exports.Bool3 = Bool3;
// arithmetic comparisons return boolean
class NumToBool2 extends BoolExpr {
    constructor(name, operator, arg1, arg2) {
        super();
        this.name = name;
        this.operator = operator;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.chil = [arg1, arg2];
        if (arg1.val == undefined || arg2.val == undefined) {
            this.val = undefined;
            this.expl = `NumToBool2 of undefined ${arg1.name}`;
            return;
        }
        // [TODO] as with above Num2, do sensible behaviour when one argument is undefined
        switch (this.operator) {
            case exports.NumToBoolOp.NBlt:
                this.val = arg1.val < arg2.val;
                this.expl = "less than";
                this.jsonLogicOp = "<";
                break;
            case exports.NumToBoolOp.NBlte:
                this.val = arg1.val <= arg2.val;
                this.expl = "less than or equal";
                this.jsonLogicOp = "<=";
                break;
            case exports.NumToBoolOp.NBgt:
                this.val = arg1.val > arg2.val;
                this.expl = "greater than";
                this.jsonLogicOp = ">";
                break;
            case exports.NumToBoolOp.NBgte:
                this.val = arg1.val >= arg2.val;
                this.expl = "greater than or equal";
                this.jsonLogicOp = ">=";
                break;
            case exports.NumToBoolOp.NBeq:
                this.val = arg1.val == arg2.val;
                this.expl = "equal";
                this.jsonLogicOp = "==";
                break;
            case exports.NumToBoolOp.NBneq:
                this.val = arg1.val != arg2.val;
                this.expl = "not equal";
                this.jsonLogicOp = "!=";
                break;
        }
    }
}
exports.NumToBool2 = NumToBool2;
// maximum and mininum folds over numeric lists
class NumFold extends NumExpr {
    constructor(name, operator, args) {
        super();
        this.name = name;
        this.operator = operator;
        this.args = args;
        if (args.map(o => o.val).includes(undefined)) {
            let sad = args.filter(o => o.val == undefined).map(o => o.name).join(", ");
            this.val = undefined;
            this.expl = `NumFold called over list with undefined values [${sad}]; dropping undefined values`;
        }
        this.chil = args.filter(o => o.val != undefined);
        switch (this.operator) {
            case exports.NumFoldOp.Max:
                this.val = Math.max(...this.chil.map(o => o.val));
                this.jsonLogicOp = "max";
                this.expl = "max";
                break;
            case exports.NumFoldOp.Min:
                this.val = Math.min(...this.chil.map(o => o.val));
                this.jsonLogicOp = "min";
                this.expl = "min";
                break;
            case exports.NumFoldOp.Sum:
                this.val = this.chil.map(o => o.val).reduce((pv, cv) => pv + cv);
                this.jsonLogicOp = "reduce";
                this.expl = "sum";
                break;
            case exports.NumFoldOp.Product:
                this.val = this.chil.map(o => o.val).reduce((pv, cv) => pv * cv);
                this.jsonLogicOp = "reduce";
                this.expl = "product";
                break;
        }
    }
}
exports.NumFold = NumFold;
// i think we need to have an explicit ExprList class in mathlang.ts to reflect the ExprList type from MathLang.hs, so we can support concatting.
// any/all folds over boolean lists
class BoolFold extends BoolExpr {
    constructor(name, operator, args) {
        super();
        this.name = name;
        this.operator = operator;
        this.args = args;
        if (args.map(o => o.val).includes(undefined)) {
            let sad = args.filter(o => o.val == undefined).map(o => o.name).join(", ");
            this.val = undefined;
            this.expl = `BoolFold called over list with undefined values [${sad}]; dropping undefined values`;
        }
        this.chil = args.filter(o => o.val != undefined);
        switch (this.operator) {
            case exports.BoolFoldOp.Any:
                this.val = args.map(o => o.val).some(id => id);
                this.expl = "any";
                this.jsonLogicOp = "some";
                break;
            case exports.BoolFoldOp.All:
                this.val = args.map(o => o.val).every(id => id);
                this.expl = "all";
                this.jsonLogicOp = "all";
                break;
        }
    }
}
exports.BoolFold = BoolFold;
// trace an explanation of an expression
function explTrace(expr, depth) {
    let prefix = "*".repeat(depth);
    let indent = " ".repeat(20 - depth);
    if (expr == undefined) {
        console.error("explTrace given undefined expr, proceeding");
    }
    else if (!expr.hasOwnProperty("val")) {
        console.error(`explTrace given expr with no val: ${expr.name}; aborting`);
        process.exit();
    }
    let rounded = expr.val == undefined
        ? "undefined"
        : typeof expr.val === 'number'
            ? (shouldRoundToNearestInt(expr.val) ? Math.round(expr.val).toString() : expr.val.toString())
            : expr.val.toString();
    let ndent = " ".repeat(Math.max(20 - rounded.length, 2));
    console.log(`${prefix} ${indent} ${ndent} ${rounded}    ${expr.name}` + (expr.chil.length > 0 ? ` = ${expr.expl}` : ""));
    if (expr.val == undefined) {
        console.log(`${expr.name} has undefined value`);
        for (let c of expr.chil) {
            console.log(c.name);
        }
        if (expr.chil.length == 0) {
            console.log("#+BEGIN_SRC json");
            console.log(JSON.stringify(expr, null, 2));
            console.log("#+END_SRC");
        }
    }
    for (let c of expr.chil) {
        explTrace(c, depth + 1);
    }
}
exports.explTrace = explTrace;
// fold an expr to a flat dictionary containing all childrens' .name = .val pairs
function exprReduce(expr) {
    return (expr.chil.reduce((result, current) => { return (Object.assign(Object.assign({}, result), exprReduce(current))); }, { [expr.name]: expr.val }));
    // note children names will overwrite parent name
}
exports.exprReduce = exprReduce;
// type grEdge = { elabel: string; nIn: NLabel; nOut: NLabel }
// translate an expr to a computation/data-flow graph suitable for graphviz.
function asGr(expr) {
    return ({
        nlabel: expr.name,
        nval: expr.val,
        operator: expr.jsonLogicOp ? expr.jsonLogicOp.toString() : "unknown mathlang operator",
        children: expr.chil.map(o => asGr(o))
    });
}
exports.asGr = asGr;
function asDot(expr, dim) {
    if (expr.name == "noShow" && expr.val > 0) {
        return (`  "${expr.uuid}" [ label="${expr.val}\\n(pruned)" ]`);
    }
    if (expr.name == "noShow") {
        return (`// pruned ${expr.expl}`);
    }
    var shouldDim = expr.val == false;
    var bgcolor = [];
    if (!(dim || shouldDim)) {
        bgcolor = ["style=filled"];
        if (expr.val) {
            bgcolor.push(...["color=lightblue"]);
        }
        if (expr.jsonLogicOp == "if") {
            bgcolor.push(...["color=lightgreen"]);
        }
    }
    var myval = String(expr.val);
    if (expr.name.endsWith("percentage") || expr.name.endsWith("percent")) {
        myval = String(expr.val * 100) + "%";
    }
    var labelparts = [myval, expr.name, expr.expl]
        .filter(o => o != undefined && o != "uninitialized").join("\\n");
    var attrparts = [`label="${labelparts}"`, bgcolor.join(", ")].join(", ");
    let nodelist = `  "${expr.uuid}" [ ${attrparts} ];`;
    let edgelist = expr.chil
        .filter(c => (!(c.name == "noShow" && !c.val)))
        .map(c => `  "${expr.uuid}" -> "${c.uuid}"`).join("\n");
    let recursed = expr.chil.map(c => asDot(c, dim || shouldDim)).join("\n");
    return (`
${nodelist}
${edgelist}
${recursed}
`);
}
exports.asDot = asDot;
function shouldRoundToNearestInt(float, threshold = 0.001) {
    const difference = Math.abs(float - Math.round(float));
    return difference <= threshold;
}
// string expressions
class StrExpr extends Expr {
}
class Str0 extends StrExpr {
    constructor(name, val) {
        super();
        this.name = name;
        this.val = val;
        this.expl = name;
    }
}
exports.Str0 = Str0;
function Str0_(name, val) {
    if (val == undefined) {
        val = name;
    }
    return new Str0(name, val);
}
exports.Str0_ = Str0_;
// string equality
class StrToBool2 extends BoolExpr {
    constructor(name, operator, arg1, arg2) {
        super();
        this.name = name;
        this.operator = operator;
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.chil = [arg1, arg2];
        if (arg1.val == undefined && arg2.val == undefined) {
            this.val = undefined;
            this.expl = `StrToBool2 on two undefined elements ${arg1.name} / ${arg2.name}`;
            return;
        }
        switch (this.operator) {
            case exports.StrToBoolOp.StrEq:
                this.expl = "string equal";
                this.val = arg1.val == arg2.val;
                this.jsonLogicOp = "==";
                break;
            case exports.StrToBoolOp.StrNeq:
                this.expl = "string unequal";
                this.val = arg1.val != arg2.val;
                this.jsonLogicOp = "!=";
                break;
        }
    }
}
exports.StrToBool2 = StrToBool2;
