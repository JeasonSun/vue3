// rollup的配置
import path from 'path'
import json from '@rollup/plugin-json'
import resolvePlugin from '@rollup/plugin-node-resolve'
import ts from 'rollup-plugin-typescript2'

// 根据环境变量中的target属性， 获取对应的模块中的package.json

const packagesDir = path.resolve(__dirname, 'packages')

const packageDir = path.resolve(packagesDir, process.env.TARGET)
const resolve = p => path.resolve(packageDir, p)

const pkg = require(resolve('package.json'))

const name = path.basename(packageDir) // 

// 对打包类型，先做一个映射表，根据你提供的formats来格式化需要打包的内容

const outputConfig = {
  'esm-bundler': {
    file: resolve(`dist/${name}.esm-bundler.js`),
    format: 'es'
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: 'cjs'
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: 'iife'
  }
}

const options = pkg.buildOptions // 自己在package.json中定义的选项

function createConfig (format, output) {
  output.name = options.name
  output.sourcemap = true // 生成sourcemap;

  return {
    input: resolve(`src/index.ts`),
    output,
    plugins: [
      json(),
      ts({
        tsconfig: path.resolve(__dirname, 'tsconfig.json')
      }),
      resolvePlugin()
    ]
  }
}
//rollup 最终需要导出配置
export default options.formats.map(format =>
  createConfig(format, outputConfig[format])
)
