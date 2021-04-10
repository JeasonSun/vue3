// runtime-dom 核心就是 提供DOM API
// 操作节点、操作属性的更新

// 节点操作： 增删改查
// 属性操作： 添加、删除、更新（样式、类、事件、其他属性）

import { patchProp } from './patchProp' // 方法
import { nodeOps } from './nodeOps' // 对象
import { extend } from '@vue/shared/src'
import { createRenderer } from '@vue/runtime-core/src'


// 渲染时候用到的所有方法
const rendererOptions = extend({ patchProp }, nodeOps)

// export { rendererOptions }

// function createRenderer (rendererOptions) {
//   // 告诉core怎么渲染
//   return {
//     createApp (rootComponent, rootProps) {
//       // 用哪个组件，哪个属性来创建应用。
//       const app = {
//         mount (container) {
//           // 挂载的目的地。
//           console.log(container, rootComponent, rootProps, rendererOptions)
//         }
//       }
//       return app
//     }
//   }
// }

/**
 * vue中runtime-core中提供了核心的方法， 用来处理渲染的，
 * 他会使用runtime-dom中的api进行渲染
 */
export function createApp (rootComponent, rootProps = null) {
  const app = createRenderer(rendererOptions).createApp(
    rootComponent,
    rootProps
  )

  let { mount } = app

  app.mount = function (container) {
    // 清空容器的操作。
    container = nodeOps.querySelector(container)
    container.innerHTML = ''
    // 将组件 渲染成dom元素，进行挂载
    mount(container)
  }

  return app
}
// 用户调用的是runtime-dom -> runtime-core
// runtime-dom 是为了解决平台差异

export * from '@vue/runtime-core'