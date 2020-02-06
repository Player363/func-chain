'use strict';

// bind方法
if (!Function.prototype.bind) {
    Function.prototype.bind = function (context) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        var fn = this;
        return function () {
            for (var _len2 = arguments.length, args2 = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args2[_key2] = arguments[_key2];
            }

            fn.apply(context, args.concat(args2));
        };
    };
}

// 对象扩展
function extend(prototype, obj) {
    for (var key in obj) {
        prototype[key] = obj[key];
    }
}

var isExpression = false,
    // 是否处于表达式创建模式
nowCreateChain = null; // 表达式模式下，指向当前正在创建的函数链对象

//-------∽-★-∽----- 函数链对象 -----∽-★-∽--------//
/**
 * 函数链对象
 * @property {function[]} functions - 保存函数链中所有函数的数组
 * @property {array[]} args - 函数链中函数执行时使用的参数（优先使用此参数）
 * @constructor
 */
function Chain() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    if (this instanceof Chain) {
        // 标准语法创建 | 使用 new 关键字
        this.functions = []; // 保存函数链中所有的函数
        this.args = []; // 保存函数执 行时传入的参数

        this.add.apply(this, args); // 使用自身add方法添加函数
    } else {
        // 表达式语法创建
        if (arguments.length) throw new Error('请加上 new 关键字，如果你想使用表达式语法请不要传入参数');

        isExpression = true;
        nowCreateChain = new Chain();
    }
}

extend(Chain.prototype, {
    /**
     * 添加函数
     * @param {...(function|MiddleObj)} functions - 一个或多个函数对象/函数链中间对象
     * @returns {Chain}
     */
    add: function add(functions) {
        for (var i = 0; i < arguments.length; i++) {
            var fn = arguments[i],
                args = undefined;

            if (fn.constructor === MiddleObj) {
                // 如果传入的是使用args方法处理过的中间对象
                args = fn.args;
                fn = fn.fn;
            } else if (typeof fn !== 'function') {
                throw new Error('你传入的参数不是一个函数');
            }

            this.functions.push(fn);
            this.args.push(args);
        }

        return this;
    },
    /**
     * 执行函数链
     * @param {...*} args - 任意参数，会原样传递给函数链中第一个函数当做参数
     * @returns {Chain}
     */
    go: function go(args) {
        // 执行完毕的回调函数
        function next() {
            var index = ++next.currentIndex,
                chain = next.currentChain,
                args = void 0;

            // 结束：条件  index大于当前函数链的长度  ||  当前状态不是running
            if (index >= chain.args.length || next.state !== 'running') return next.state = 'interrupted';

            for (var _len2 = arguments.length, arg = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                arg[_key2] = arguments[_key2];
            }

            if ((args = chain.args[index]) === undefined) args = arg;

            chain.functions[index].apply(chain, args.concat(next));
        }

        // 通过next.switch调用，切换到另一个函数链上，如果传入一个普通函数，会自动转换成函数链对象
        function switchTo(chain, index) {
            if (typeof chain === 'function') {
                this.currentIndex = -1;
                this.currentChain = new Chain(chain);
                this();
            } else if (chain.constructor === Chain) {
                this.currentIndex = index === undefined ? -1 : --index;
                this.currentChain = chain;
                this();
            } else {
                throw new Error('不能切换到一个非函数链对象上');
            }
        }
        // 通过next.skip，跳过 x 步
        function skip(number) {
            this.currentIndex += number;
            this();
        }
        // 通过next.stop，停止执行
        function stop() {
            this.state = 'interrupted';
            this();
        }

        // 拓展next
        extend(next, {
            state: 'running',
            currentChain: this,
            currentIndex: -1,
            switchTo: switchTo.bind(next),
            skip: skip.bind(next),
            stop: stop.bind(next)
        });

        next.apply(null, arguments);

        return this;
    }
});

// 表达式语法下用于结束创建函数链
Chain.end = function () {
    isExpression = false;
    return nowCreateChain;
};
// 表达式语法下用于结束创建函数链 并 执行
Chain.go = function () {
    isExpression = false;

    for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
    }

    return nowCreateChain.go.apply(nowCreateChain, args);
};

//-------∽-★-∽---- 函数原型扩展 ----∽-★-∽--------//
var sourceValueOf = Function.prototype.valueOf;
extend(Function.prototype, {
    // 设置 函数链 执行时 函数 使用的实参
    args: function args() {
        for (var _len4 = arguments.length, _args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
            _args[_key4] = arguments[_key4];
        }

        return new MiddleObj(this, _args);
    },
    valueOf: function valueOf() {
        // 用于表达式语法
        if (isExpression) {
            isExpression = false;
            nowCreateChain.functions.push(this);
            nowCreateChain.args.push(undefined);
            isExpression = true;
            return false;
        } else {
            return sourceValueOf.call(this);
        }
    }
});

//-------∽-★-∽---- 函数中间对象 ----∽-★-∽--------//
/**
 * 普通函数调用args后，会返回中间对象，包含函数本身和在函数链中调用时使用的参数
 * @property {function} fn - 函数对象
 * @property {*[]} args - 数组，保存所有参数
 * @constructor
 */
function MiddleObj(fn, args) {
    // 函数调用args方法后，返回的中间对象
    this.fn = fn;
    this.args = args;
}
// 用于表达式语法创建
MiddleObj.prototype.valueOf = function () {
    if (isExpression) {
        isExpression = false;
        nowCreateChain.functions.push(this.fn);
        nowCreateChain.args.push(this.args);
        isExpression = true;
        return false;
    } else {
        return true;
    }
};

module.exports = Chain;
