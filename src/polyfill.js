// bind方法
if(!(Function.prototype.bind)) {
    Function.prototype.bind = function (context, ...args) {
        let fn = this
        return function (...args2) {
            fn.apply(context, args.concat(args2))
        }
    }
}
