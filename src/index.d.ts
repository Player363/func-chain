// 函数链实例对象
interface ChainInstance {
    functions: Function[]
    args: any[]

    go(): this
    add(...functions: Function[]): this;
}

// 函数链对象
interface chain {
    (): void
    new(...functions: Function[]): ChainInstance

    go(): ChainInstance
    end(): ChainInstance
}

// 函数中间对象
interface FunctionMiddleObj {
    fn: Function
    args: any
}

// 函数对象拓展
interface Function {
    args(...any: any[]): FunctionMiddleObj
}

// next对象
interface Object {
    state: string
    currentChain: ChainInstance,
    currentIndex: number,

    switchTo(chain: Function | ChainInstance, index?: number): void
    skip(number: number): void
    stop(): void
}

// 模块暴露
declare const Chain: chain
declare module 'func-chain' {
    export = Chain
}
