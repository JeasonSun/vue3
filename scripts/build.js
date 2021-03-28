// 把packages目录下的所有包都进行打包

const fs = require('fs')
const execa = require('execa');

const targets = fs
  .readdirSync('packages')
  .filter(f => fs.statSync(`packages/${f}`).isDirectory())

async function build (target) {
  await execa('rollup', ['-c', '--environment', `TARGET:${target}`], {stdio: 'inherit'}) // 将子进程打包的信息共享给父进程。
}

function runParallel (targets, iteratorFn) {
  const res = []
  for (const item of targets) {
    const p = iteratorFn(item)
    res.push(p)
  }
  return Promise.all(res)
}

// 对我们得目标进行依次打包，并行打包
runParallel(targets, build)
