let assert = require('power-assert')
let Chain = require('../dist/func-chain.umd')

function ajax1(cb) { cb() }
function ajax2(cb) { cb() }
function ajax3(cb) { cb() }

describe('开始测试', function() {
    it('> 表达式语法', function(done) {
        Chain()
        > ajax1 > ajax2 > ajax3 > ajax2 > ajax1
        > function(next) {
            assert(next.currentIndex === 5)
            done()
        }
        || Chain.go()
    })

    it('> 标准语法', function(done) {
        new Chain(ajax1, ajax2, ajax3, ajax2, ajax1, function(next) {
            assert(next.currentIndex === 5)
            done()
        }).go()
    })

    it('> 可重复执行', function() {
        let chain = new Chain(
            function(count, Expect, next) {
                count *= 2
                next(count, Expect)
            },
            function(count, Expect, next) {
                count += count
                next(count, Expect)
            },
            function(count, Expect) {
                count++
                assert(count === Expect)
            }
        )

        chain.go(1, 5)
        chain.go(2, 9)
        chain.go(3, 13)
    })

    it('> 跳过功能', function() {
        let n = false
        Chain()
        > function(next) {
            next.skip(1)
        }
        > function(next) {
            n = true
            next()
        }
        > function() { }
        || Chain.go()

        assert(n === false)
    })

    it('> 停止功能', function() {
        let n = false
        Chain()
        > function(next) {
            next.stop(1)
        }
        > function() {
            n = true
        }
        || Chain.go()

        assert(n === false)
    })

    it('> 切换功能', function(done) {
        let n = false,
            u = false

        let c1 = new Chain(
            function(next) {
                n = true
                next.switchTo(c2)
            }
        )

        let c2 = new Chain(
            function() {
                u = true
                assert(n === true && u === true)
                done()
            }
        )

        c1.go()
    })

    it('> 嵌套使用', function() {
        let a = 1

        const add1 = (next) => ++a && next()
        const multiply2 = (next) => (a *= 2) && next()

        Chain()
        > add1
        > function(next) {
            Chain()
            > multiply2
            > multiply2
            > (() => next())
            || Chain.go()
        }
        > multiply2
        > add1
        > function(next) {
            assert(a === 17)
            next()
        }
        || Chain.go()
    })
})
