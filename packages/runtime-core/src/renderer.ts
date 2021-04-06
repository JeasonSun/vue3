import { ShapeFlags } from '@vue/shared/src'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'

export function createRenderer (rendererOptions) {
  const setupRenderEffect = () => {
    
  }
  const mountComponent = (initialVNode, container) => {
    // console.log(initialVNode, container)
    // 组件的渲染流程，最核心的就是调用setup 拿到返回值， 获取render函数，返回的结果来进行渲染。
    // 1. 先要有实例，
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode
    ))
    // 2. 需要将数据解析到实例上
    setupComponent(instance)
    // 3. 创建一个effect让render函数执行。
    setupRenderEffect()
  }
  const processComponent = (n1, n2, container) => {
    if (n1 === null) {
      mountComponent(n2, container)
    }
  }
  const patch = (n1, n2, container) => {
    const { shapeFlag } = n2
    if (shapeFlag & ShapeFlags.ELEMENT) {
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      processComponent(n1, n2, container)
    }
  }
  // 告诉core怎么渲染
  const render = (vnode, container) => {
    // console.log(vnode, container)
    // core的核心，根据不同的虚拟节点，创建对应的真实元素。
    // 默认调用render， 初始化流程。
    patch(null, vnode, container)
  }
  return {
    createApp: createAppAPI(render)
  }
}
// createRenderer 目的是创建一个渲染器。

// 框架 都是将 组件 转化成 虚拟DOM -》 虚拟DOM 生成真实DOM， 挂载到真实页面上。
