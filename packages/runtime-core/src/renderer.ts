import { effect } from '@vue/reactivity/src'
import { ShapeFlags } from '@vue/shared/src'
import { createAppAPI } from './apiCreateApp'
import { createComponentInstance, setupComponent } from './component'
import { queueJob } from './schedule'
import { normalizeVnode, Text } from './vnode'

export function createRenderer (rendererOptions) {
  const {
    patchProp: hostPatchProps,
    insert: hostInsert,
    remove: hostRemove,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText
  } = rendererOptions

  // ------------- 组件处理 Start ---------
  const setupRenderEffect = (instance, container) => {
    // 需要创建一个effect， 在effect中调用render方法， 这样render方法中拿到的数据会收集这个effect， 属性更新时候，effect会重新执行。
    effect(
      function componentEffect () {
        // 每个组件都有一个effect，vue3是组件级更新，数据变化，会重新执行对应组件的effect
        if (!instance.isMounted) {
          // 初次渲染
          let proxyToUse = instance.proxy
          // _vnode $
          let subTree = (instance.subTree = instance.render.call(
            proxyToUse,
            proxyToUse
          ))
          // console.log(subTree)
          patch(null, subTree, container)
          instance.isMounted = true
        } else {
          // 更新逻辑
          console.log('更新逻辑： diff')
          // diff 算法
        }
      },
      {
        scheduler: queueJob  // scheduler可以用来控制effect的触发时机
      }
    )
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
    setupRenderEffect(instance, container)
  }
  const processComponent = (n1, n2, container) => {
    if (n1 === null) {
      mountComponent(n2, container)
    }
  }

  // ------------- 组件处理 End ---------

  // ------------- 元素 Start ---------

  function mountChildren (children, container) {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVnode(children[i])
      patch(null, child, container)
    }
  }

  function mountElement (vnode, container) {
    // 递归渲染
    const { props, shapeFlag, type, children } = vnode
    let el = (vnode.el = hostCreateElement(type))
    if (props) {
      for (const key in props) {
        hostPatchProps(el, key, null, props[key])
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children) // 文本比较简单， 直接加入
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el)
    }
    hostInsert(el, container)
  }

  function processElement (n1, n2, container) {
    if (n1 === null) {
      mountElement(n2, container)
    }
  }

  function processText (n1, n2, container) {
    if (n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }

  const patch = (n1, n2, container) => {
    const { shapeFlag, type } = n2
    switch (type) {
      case Text:
        //如果是文本
        processText(n1, n2, container)
        break

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // console.log(n1, n2, container);
          processElement(n1, n2, container)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container)
        }
        break
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
