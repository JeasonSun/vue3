// 把packages目录下的所有包都进行打包

const execa = require('execa')

const target = 'runtime-dom'
async function build (target) {
  await execa('rollup', ['-cw', '--environment', `TARGET:${target}`], {
    stdio: 'inherit'
  }) // 将子进程打包的信息共享给父进程。
}
build(target)
