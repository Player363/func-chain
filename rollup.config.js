import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import {uglify} from 'rollup-plugin-uglify'
import fileSize from 'rollup-plugin-filesize'

const pkg = require('./package.json')

export default [
    // UMD build
    {
        input: 'src/core.js',
        output: {
            name: 'Chain',
            file: pkg.browser,
            format: 'umd'
        },
        plugins: [
            babel({
                presets: ['es2015-rollup', 'stage-0'],
            }),
            resolve({}),
            commonjs(),
            uglify({
                ie8: false,
                warnings: false
            }),
            fileSize(),
        ]
    },

    // CommonJS and ES module build
    {
        input: 'src/core.js',
        output: [
            { file: pkg.main, format: 'cjs' },
            { file: pkg.module, format: 'es' }
        ],
        plugins: [
            babel({
                presets: ['es2015-rollup', 'stage-0'],
            }),
        ],
    }
]
