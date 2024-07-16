"use strict";
// a simple math lang with support for booleans and number operators.
// evaluation is eager and happens at construction time.
//
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StrToBool2 = exports.Str0 = exports.BoolFold = exports.NumFold = exports.NumToBool2 = exports.Bool3 = exports.Bool2 = exports.Bool1 = exports.Bool0 = exports.Num2 = exports.SetVar = exports.GetVar = exports.Num0 = exports.Expr = exports.symTab = exports.StrToBoolOp = exports.BoolFoldOp = exports.NumFoldOp = exports.NumToBoolOp = exports.BoolTriOp = exports.BoolUnaOp = exports.BoolBinOp = exports.NumBinOp = void 0;
exports.initSymTab = initSymTab;
exports.explTrace = explTrace;
exports.exprReduce = exprReduce;
exports.asGr = asGr;
exports.asDot = asDot;
exports.Str0_ = Str0_;
var uuid_1 = require("uuid");
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
    exports.symTab = __assign({}, st);
    return exports.symTab;
}
var Expr = /** @class */ (function () {
    function Expr() {
        this.expl = "uninitialized";
        this.chil = [];
        this.uuid = (0, uuid_1.v4)();
    }
    Expr.prototype.getVar = function (want) {
        if (exports.symTab.hasOwnProperty(this.name)) {
            console.info("getVar: ".concat(this.name, " returning wanted variable from symTab, ").concat(this.name, " = ").concat(this.val));
            return exports.symTab[this.name];
        }
        if (this.name == want) {
            exports.symTab[this.name] = this;
            console.info("getVar: ".concat(this.name, " saving wanted variable to symTab, ").concat(this.name, " = ").concat(this.val));
            return this;
        }
        // we may have to be smart about GetVar("parent.child") if we have nested records; as a hack we can flatten all nested records to just strings.
        for (var _i = 0, _a = this.chil; _i < _a.length; _i++) {
            var c = _a[_i];
            var r = c.getVar(want);
            if (r != undefined) {
                return r;
            }
        }
        return undefined;
    };
    return Expr;
}());
exports.Expr = Expr;
// given an expression tree, extract a variable named somewhere within
// base class for numeric types
var NumExpr = /** @class */ (function (_super) {
    __extends(NumExpr, _super);
    function NumExpr() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return NumExpr;
}(Expr));
// base numeric value
var Num0 = /** @class */ (function (_super) {
    __extends(Num0, _super);
    function Num0(name, val) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.val = val;
        _this.expl = name;
        return _this;
    }
    return Num0;
}(NumExpr));
exports.Num0 = Num0;
var GetVar = /** @class */ (function (_super) {
    __extends(GetVar, _super);
    function GetVar(name) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.val = exports.symTab[_this.name];
        if (_this.val == undefined) {
            console.log("GetVar on ".concat(name, " returned undefined! If this is not expected, you may want to uncomment symtab dump in mathlang.ts. Or maybe you mean to treat this as a string."));
            //      console.log("symtab is")
            //      console.log(symTab)
        }
        return _this;
    }
    return GetVar;
}(Expr));
exports.GetVar = GetVar;
var SetVar = /** @class */ (function (_super) {
    __extends(SetVar, _super);
    function SetVar(name, val) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.val = val;
        exports.symTab[_this.name] = _this.val;
        console.log("SetVar saving {this.name} = {this.val}");
        return _this;
    }
    return SetVar;
}(Expr));
exports.SetVar = SetVar;
// binary numeric expressions
var Num2 = /** @class */ (function (_super) {
    __extends(Num2, _super);
    function Num2(name, operator, arg1, arg2) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.operator = operator;
        _this.arg1 = arg1;
        _this.arg2 = arg2;
        _this.chil = [arg1, arg2];
        if (arg1.val == undefined && arg2.val == undefined) {
            _this.val = undefined;
            _this.expl = "Num2 on two undefined elements ".concat(arg1.name, " / ").concat(arg2.name);
            return _this;
        }
        //    if (arg1.val == undefined || arg2.val == undefined) { console.log(`Num2: dealing with undefined in ${this.name}`) }
        if (arg1.val == undefined && _this.operator == exports.NumBinOp.MaxOf2) {
            _this.val = arg2.val;
            return _this;
        }
        if (arg1.val == undefined && _this.operator == exports.NumBinOp.MinOf2) {
            _this.val = arg2.val;
            return _this;
        }
        if (arg1.val == undefined && _this.operator == exports.NumBinOp.Add) {
            _this.val = arg2.val;
            return _this;
        }
        if (arg1.val == undefined && _this.operator == exports.NumBinOp.Mul) {
            _this.val = arg2.val;
            return _this;
        }
        if (arg2.val == undefined && _this.operator == exports.NumBinOp.MaxOf2) {
            _this.val = arg1.val;
            return _this;
        }
        if (arg2.val == undefined && _this.operator == exports.NumBinOp.MinOf2) {
            _this.val = arg1.val;
            return _this;
        }
        if (arg2.val == undefined && _this.operator == exports.NumBinOp.Add) {
            _this.val = arg1.val;
            return _this;
        }
        if (arg2.val == undefined && _this.operator == exports.NumBinOp.Mul) {
            _this.val = arg1.val;
            return _this;
        }
        if (arg1.val == undefined) {
            _this.val = undefined;
            _this.expl = "Num2 of undefined element ".concat(arg1.name);
            return _this;
        }
        if (arg2.val == undefined) {
            _this.val = undefined;
            _this.expl = "Num2 of undefined element ".concat(arg2.name);
            return _this;
        }
        switch (_this.operator) {
            case exports.NumBinOp.Add:
                _this.expl = "sum of";
                _this.val = arg1.val + arg2.val;
                _this.jsonLogicOp = "+";
                break;
            case exports.NumBinOp.Sub:
                _this.expl = "difference between";
                _this.val = arg1.val - arg2.val;
                _this.jsonLogicOp = "-";
                break;
            case exports.NumBinOp.Mul:
                _this.expl = "product of";
                _this.val = arg1.val * arg2.val;
                _this.jsonLogicOp = "*";
                break;
            case exports.NumBinOp.Div:
                _this.expl = "dividend of";
                _this.val = arg1.val / arg2.val;
                _this.jsonLogicOp = "/";
                break;
            case exports.NumBinOp.Mod:
                _this.expl = "modulo of";
                _this.val = arg1.val % arg2.val;
                _this.jsonLogicOp = "%";
                break;
            case exports.NumBinOp.MaxOf2:
                _this.expl = "greater of";
                _this.val = Math.max(arg1.val, arg2.val);
                _this.jsonLogicOp = ">";
                break;
            case exports.NumBinOp.MinOf2:
                _this.expl = "lesser of";
                _this.val = Math.min(arg1.val, arg2.val);
                _this.jsonLogicOp = "<";
                break;
        }
        return _this;
    }
    return Num2;
}(NumExpr));
exports.Num2 = Num2;
// base class for boolean types
var BoolExpr = /** @class */ (function (_super) {
    __extends(BoolExpr, _super);
    function BoolExpr() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return BoolExpr;
}(Expr));
// base boolean value
var Bool0 = /** @class */ (function (_super) {
    __extends(Bool0, _super);
    function Bool0(name, val) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.val = val;
        _this.expl = name;
        return _this;
    }
    return Bool0;
}(BoolExpr));
exports.Bool0 = Bool0;
// unary boolean expressions
var Bool1 = /** @class */ (function (_super) {
    __extends(Bool1, _super);
    function Bool1(name, operator, arg1) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.operator = operator;
        _this.arg1 = arg1;
        _this.chil = [arg1];
        if (arg1.val == undefined) {
            _this.val = undefined;
            _this.expl = "Boolean not of undefined ".concat(arg1.name);
            return _this;
        }
        switch (operator) {
            case exports.BoolUnaOp.BoolNot: {
                _this.expl = "not";
                _this.jsonLogicOp = "!";
                _this.val = !arg1.val;
            }
        }
        return _this;
    }
    return Bool1;
}(BoolExpr));
exports.Bool1 = Bool1;
// binary boolean expressions
var Bool2 = /** @class */ (function (_super) {
    __extends(Bool2, _super);
    function Bool2(name, operator, arg1, arg2) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.operator = operator;
        _this.arg1 = arg1;
        _this.arg2 = arg2;
        _this.chil = [arg1, arg2];
        // if we want NAF we can treat undefined as false and continue through, instead of returning.
        if (arg1.val == undefined) {
            _this.val = undefined;
            _this.expl = "Bool2 of undefined element ".concat(arg1.name);
            return _this;
        }
        if (arg2.val == undefined) {
            _this.val = undefined;
            _this.expl = "Bool2 of undefined element ".concat(arg2.name);
            return _this;
        }
        switch (operator) {
            case exports.BoolBinOp.And:
                _this.expl = "and";
                _this.val = arg1.val && arg2.val;
                _this.jsonLogicOp = "and";
                break;
            case exports.BoolBinOp.Or:
                _this.expl = "or";
                _this.val = arg1.val || arg2.val;
                _this.jsonLogicOp = "or";
                break;
            case exports.BoolBinOp.BoolEq:
                _this.expl = "eq";
                _this.val = arg1.val == arg2.val;
                _this.jsonLogicOp = "==";
                break;
            case exports.BoolBinOp.BoolNeq:
                _this.expl = "ne";
                _this.val = arg1.val != arg2.val;
                _this.jsonLogicOp = "!=";
                break;
        }
        return _this;
    }
    return Bool2;
}(BoolExpr));
exports.Bool2 = Bool2;
// ternary boolean expression could return either a NumExpr or a BoolExpr
var Bool3 = /** @class */ (function (_super) {
    __extends(Bool3, _super);
    function Bool3(name, operator, arg1, arg2, arg3) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.operator = operator;
        _this.arg1 = arg1;
        _this.arg2 = arg2;
        _this.arg3 = arg3;
        if (arg1.val == undefined) {
            _this.expl = "Bool3 of undefined condition ".concat(arg1.name, ", treating as false");
        }
        switch (_this.operator) {
            case exports.BoolTriOp.IfThenElse:
                _this.jsonLogicOp = "if";
                if (arg1.val && arg2.val == undefined) {
                    _this.val = undefined;
                    _this.expl = "Bool3-true ".concat(arg2.name, " is undefined");
                    return _this;
                }
                if (!arg1.val && arg3.val == undefined) {
                    _this.val = undefined;
                    _this.expl = "Bool3-false ".concat(arg3.name, " is undefined");
                    return _this;
                }
                if (arg1.val) {
                    _this.expl = "true branch";
                    _this.val = arg2.val;
                    _this.chil = [arg1, arg2];
                }
                else {
                    _this.expl = "false branch";
                    _this.val = arg3.val;
                    _this.chil = [arg1, arg3];
                }
        }
        return _this;
    }
    return Bool3;
}(Expr));
exports.Bool3 = Bool3;
// arithmetic comparisons return boolean
var NumToBool2 = /** @class */ (function (_super) {
    __extends(NumToBool2, _super);
    function NumToBool2(name, operator, arg1, arg2) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.operator = operator;
        _this.arg1 = arg1;
        _this.arg2 = arg2;
        _this.chil = [arg1, arg2];
        if (arg1.val == undefined || arg2.val == undefined) {
            _this.val = undefined;
            _this.expl = "NumToBool2 of undefined ".concat(arg1.name);
            return _this;
        }
        // [TODO] as with above Num2, do sensible behaviour when one argument is undefined
        switch (_this.operator) {
            case exports.NumToBoolOp.NBlt:
                _this.val = arg1.val < arg2.val;
                _this.expl = "less than";
                _this.jsonLogicOp = "<";
                break;
            case exports.NumToBoolOp.NBlte:
                _this.val = arg1.val <= arg2.val;
                _this.expl = "less than or equal";
                _this.jsonLogicOp = "<=";
                break;
            case exports.NumToBoolOp.NBgt:
                _this.val = arg1.val > arg2.val;
                _this.expl = "greater than";
                _this.jsonLogicOp = ">";
                break;
            case exports.NumToBoolOp.NBgte:
                _this.val = arg1.val >= arg2.val;
                _this.expl = "greater than or equal";
                _this.jsonLogicOp = ">=";
                break;
            case exports.NumToBoolOp.NBeq:
                _this.val = arg1.val == arg2.val;
                _this.expl = "equal";
                _this.jsonLogicOp = "==";
                break;
            case exports.NumToBoolOp.NBneq:
                _this.val = arg1.val != arg2.val;
                _this.expl = "not equal";
                _this.jsonLogicOp = "!=";
                break;
        }
        return _this;
    }
    return NumToBool2;
}(BoolExpr));
exports.NumToBool2 = NumToBool2;
// maximum and mininum folds over numeric lists
var NumFold = /** @class */ (function (_super) {
    __extends(NumFold, _super);
    function NumFold(name, operator, args) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.operator = operator;
        _this.args = args;
        if (args.map(function (o) { return o.val; }).includes(undefined)) {
            var sad = args.filter(function (o) { return o.val == undefined; }).map(function (o) { return o.name; }).join(", ");
            _this.val = undefined;
            _this.expl = "NumFold called over list with undefined values [".concat(sad, "]; dropping undefined values");
        }
        _this.chil = args.filter(function (o) { return o.val != undefined; });
        switch (_this.operator) {
            case exports.NumFoldOp.Max:
                _this.val = Math.max.apply(Math, _this.chil.map(function (o) { return o.val; }));
                _this.jsonLogicOp = "max";
                _this.expl = "max";
                break;
            case exports.NumFoldOp.Min:
                _this.val = Math.min.apply(Math, _this.chil.map(function (o) { return o.val; }));
                _this.jsonLogicOp = "min";
                _this.expl = "min";
                break;
            case exports.NumFoldOp.Sum:
                _this.val = _this.chil.map(function (o) { return o.val; }).reduce(function (pv, cv) { return pv + cv; });
                _this.jsonLogicOp = "reduce";
                _this.expl = "sum";
                break;
            case exports.NumFoldOp.Product:
                _this.val = _this.chil.map(function (o) { return o.val; }).reduce(function (pv, cv) { return pv * cv; });
                _this.jsonLogicOp = "reduce";
                _this.expl = "product";
                break;
        }
        return _this;
    }
    return NumFold;
}(NumExpr));
exports.NumFold = NumFold;
// i think we need to have an explicit ExprList class in mathlang.ts to reflect the ExprList type from MathLang.hs, so we can support concatting.
// any/all folds over boolean lists
var BoolFold = /** @class */ (function (_super) {
    __extends(BoolFold, _super);
    function BoolFold(name, operator, args) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.operator = operator;
        _this.args = args;
        if (args.map(function (o) { return o.val; }).includes(undefined)) {
            var sad = args.filter(function (o) { return o.val == undefined; }).map(function (o) { return o.name; }).join(", ");
            _this.val = undefined;
            _this.expl = "BoolFold called over list with undefined values [".concat(sad, "]; dropping undefined values");
        }
        _this.chil = args.filter(function (o) { return o.val != undefined; });
        switch (_this.operator) {
            case exports.BoolFoldOp.Any:
                _this.val = args.map(function (o) { return o.val; }).some(function (id) { return id; });
                _this.expl = "any";
                _this.jsonLogicOp = "some";
                break;
            case exports.BoolFoldOp.All:
                _this.val = args.map(function (o) { return o.val; }).every(function (id) { return id; });
                _this.expl = "all";
                _this.jsonLogicOp = "all";
                break;
        }
        return _this;
    }
    return BoolFold;
}(BoolExpr));
exports.BoolFold = BoolFold;
// trace an explanation of an expression
function explTrace(expr, depth) {
    var prefix = "*".repeat(depth);
    var indent = " ".repeat(20 - depth);
    if (expr == undefined) {
        console.error("explTrace given undefined expr, proceeding");
    }
    else if (!expr.hasOwnProperty("val")) {
        console.error("explTrace given expr with no val: ".concat(expr.name, "; aborting"));
        process.exit();
    }
    var rounded = expr.val == undefined
        ? "undefined"
        : typeof expr.val === 'number'
            ? (shouldRoundToNearestInt(expr.val) ? Math.round(expr.val).toString() : expr.val.toString())
            : expr.val.toString();
    var ndent = " ".repeat(Math.max(20 - rounded.length, 2));
    console.log("".concat(prefix, " ").concat(indent, " ").concat(ndent, " ").concat(rounded, "    ").concat(expr.name) + (expr.chil.length > 0 ? " = ".concat(expr.expl) : ""));
    if (expr.val == undefined) {
        console.log("".concat(expr.name, " has undefined value"));
        for (var _i = 0, _a = expr.chil; _i < _a.length; _i++) {
            var c = _a[_i];
            console.log(c.name);
        }
        if (expr.chil.length == 0) {
            console.log("#+BEGIN_SRC json");
            console.log(JSON.stringify(expr, null, 2));
            console.log("#+END_SRC");
        }
    }
    for (var _b = 0, _c = expr.chil; _b < _c.length; _b++) {
        var c = _c[_b];
        explTrace(c, depth + 1);
    }
}
// fold an expr to a flat dictionary containing all childrens' .name = .val pairs
function exprReduce(expr) {
    var _a;
    return (expr.chil.reduce(function (result, current) { return (__assign(__assign({}, result), exprReduce(current))); }, (_a = {}, _a[expr.name] = expr.val, _a)));
    // note children names will overwrite parent name
}
// type grEdge = { elabel: string; nIn: NLabel; nOut: NLabel }
// translate an expr to a computation/data-flow graph suitable for graphviz.
function asGr(expr) {
    return ({
        nlabel: expr.name,
        nval: expr.val,
        operator: expr.jsonLogicOp ? expr.jsonLogicOp.toString() : "unknown mathlang operator",
        children: expr.chil.map(function (o) { return asGr(o); })
    });
}
function asDot(expr, dim) {
    if (expr.name == "noShow" && expr.val > 0) {
        return ("  \"".concat(expr.uuid, "\" [ label=\"").concat(expr.val, "\\n(pruned)\" ]"));
    }
    if (expr.name == "noShow") {
        return ("// pruned ".concat(expr.expl));
    }
    var shouldDim = expr.val == false;
    var bgcolor = [];
    if (!(dim || shouldDim)) {
        bgcolor = ["style=filled"];
        if (expr.val) {
            bgcolor.push.apply(bgcolor, ["color=lightblue"]);
        }
        if (expr.jsonLogicOp == "if") {
            bgcolor.push.apply(bgcolor, ["color=lightgreen"]);
        }
    }
    var myval = String(expr.val);
    if (expr.name.endsWith("percentage") || expr.name.endsWith("percent")) {
        myval = String(expr.val * 100) + "%";
    }
    var labelparts = [myval, expr.name, expr.expl]
        .filter(function (o) { return o != undefined && o != "uninitialized"; }).join("\\n");
    var attrparts = ["label=\"".concat(labelparts, "\""), bgcolor.join(", ")].join(", ");
    var nodelist = "  \"".concat(expr.uuid, "\" [ ").concat(attrparts, " ];");
    var edgelist = expr.chil
        .filter(function (c) { return (!(c.name == "noShow" && !c.val)); })
        .map(function (c) { return "  \"".concat(expr.uuid, "\" -> \"").concat(c.uuid, "\""); }).join("\n");
    var recursed = expr.chil.map(function (c) { return asDot(c, dim || shouldDim); }).join("\n");
    return ("\n".concat(nodelist, "\n").concat(edgelist, "\n").concat(recursed, "\n"));
}
function shouldRoundToNearestInt(float, threshold) {
    if (threshold === void 0) { threshold = 0.001; }
    var difference = Math.abs(float - Math.round(float));
    return difference <= threshold;
}
// string expressions
var StrExpr = /** @class */ (function (_super) {
    __extends(StrExpr, _super);
    function StrExpr() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return StrExpr;
}(Expr));
var Str0 = /** @class */ (function (_super) {
    __extends(Str0, _super);
    function Str0(name, val) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.val = val;
        _this.expl = name;
        return _this;
    }
    return Str0;
}(StrExpr));
exports.Str0 = Str0;
function Str0_(name, val) {
    if (val == undefined) {
        val = name;
    }
    return new Str0(name, val);
}
// string equality
var StrToBool2 = /** @class */ (function (_super) {
    __extends(StrToBool2, _super);
    function StrToBool2(name, operator, arg1, arg2) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.operator = operator;
        _this.arg1 = arg1;
        _this.arg2 = arg2;
        _this.chil = [arg1, arg2];
        if (arg1.val == undefined && arg2.val == undefined) {
            _this.val = undefined;
            _this.expl = "StrToBool2 on two undefined elements ".concat(arg1.name, " / ").concat(arg2.name);
            return _this;
        }
        switch (_this.operator) {
            case exports.StrToBoolOp.StrEq:
                _this.expl = "string equal";
                _this.val = arg1.val == arg2.val;
                _this.jsonLogicOp = "==";
                break;
            case exports.StrToBoolOp.StrNeq:
                _this.expl = "string unequal";
                _this.val = arg1.val != arg2.val;
                _this.jsonLogicOp = "!=";
                break;
        }
        return _this;
    }
    return StrToBool2;
}(BoolExpr));
exports.StrToBool2 = StrToBool2;
