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
    setElementText: hostSetElementText,
    nextSibling: hostNextSibling
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
          const prevTree = instance.subTree
          let proxyToUse = instance.proxy

          const nextTree = instance.render.call(proxyToUse, proxyToUse)
          console.log(prevTree, nextTree)
          patch(prevTree, nextTree, container)
        }
      },
      {
        scheduler: queueJob // scheduler可以用来控制effect的触发时机
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

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalizeVnode(children[i])
      patch(null, child, container)
    }
  }

  const mountElement = (vnode, container, anchor = null) => {
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
    hostInsert(el, container, anchor)
  }

  const patchProps = (oldProps, newProps, el) => {
    if (oldProps !== newProps) {
      for (let key in newProps) {
        const prev = oldProps[key]
        const next = newProps[key]
        if (prev !== next) {
          hostPatchProps(el, key, prev, next)
        }
      }

      for (const key in oldProps) {
        if (!(key in newProps)) {
          hostPatchProps(el, key, oldProps[key], null)
        }
      }
    }
  }

  const unmountChildren = children => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i])
    }
  }

  const patchKeyedChildren = (c1, c2, el) => {
    // Vue3 对特殊情况做优化
    let i = 0 // 都是默认从头开始比对
    let e1 = c1.length - 1
    let e2 = c2.length - 1

    /**
     * 1.sync from start: 从头开始一个个比对， 遇到不同的就停止了
     * (a b) c
     * (a b) d e
     */
    while (i <= e1 && i <= e2) {
      const n1 = c1[i]
      const n2 = c2[i]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      i++
    }
    /**
     * 2.sync from end
     * a (b c)
     * d e (b c)
     */
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1]
      const n2 = c2[e2]
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, el)
      } else {
        break
      }
      e1--
      e2--
    }

    // 比较后， 有一方已经完全比对完成了
    // 怎么确定是要挂载呢？
    //
    /**
     *  3. common sequence + mount
     * (a b)
     * (a b) c
     * i = 2, e1 = 1, e2 = 2
     * (a b)
     * c (a b)
     * i = 0, e1 = -1, e2 = 0
     * 如果完成后， 最终i的值大于e1， 说明老的少
     */
    console.log(i, e1, e2)
    if (i > e1) {
      // 老的少， 新的多，
      if (i <= e2) {
        // 表示有新增的部分
        // 想知道是向前插入，还是向后插入
        const nextPos = e2 + 1
        const anchor = nextPos < c2.length ? c2[nextPos].el : null
        while (i <= e2) {
          patch(null, c2[i], el, anchor) // 只是向后追加
          i++
        }
      }
      /**
       * 4. common sequence + unmount
       */
    } else if (i > e2) {
      // 老的多， 新的少
      while (i <= e1) {
        unmount(c1[i])
        i++
      }
    } else {
      /**
       * 5. unknown sequence
       * ab [cde] fg    i=2   e1 =4
       * ab [edch] fg   i=2   e2 =5
       */
      // 乱序比较，需要尽可能的复用，  用新的元素做成一个映射表，去老的里面去找， 一样的就复用， 不一样的就插入或者删除
      let s1 = i
      let s2 = i

      // 5.1 vue3用的是新的做映射表，  vue2用的是老的做映射表
      // build key:index map for newChildren
      // 新的索引 和 key 做成一个映射表
      const keyToNewIndexMap = new Map()
      for (let i = s2; i <= e2; i++) {
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }
      console.log(keyToNewIndexMap)
      // 5.2 去老的里面查找， 看有没有， 如果有一样的就复用
      const toBePatched = e2 - s2 + 1 // 需要被比对的长度
      // 创建一个数组，用来记录是否需要被移动
      // 数组长度是需要被比对的长度，初始值为0
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0)

      //
      for (let i = s1; i <= e1; i++) {
        const oldVnode = c1[i]
        console.log('oldVnode', oldVnode.key)
        // if(patched >= toBePatched){
        //   unmount(oldVnode)
        //   continue
        // }
        let newIndex = keyToNewIndexMap.get(oldVnode.key)
        if (newIndex === undefined) {
          // 老的有，新的没有，直接删除
          unmount(oldVnode)
        } else {
          /**
           * ab [cde] fg    i=2   e1 =4
           * ab [edch] fg   i=2   e2 =5
           * => [5, 4, 3, 0]
           */
          newIndexToOldIndexMap[newIndex - s2] = i + 1 // 记录成i+1，为了规避i =0的情况，那么就无法区分出是否是新增的了

          patch(oldVnode, c2[newIndex], el)
        }
      }
      console.log(newIndexToOldIndexMap)
      // 最后就是移动节点， 并且将新增的节点插入
      // 5.3 move and mount

      let increasingNewIndexSequence = getSequence(newIndexToOldIndexMap)

      let j = increasingNewIndexSequence.length - 1
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i // [edch] 找到了h的索引
        const nextChild = c2[nextIndex]
        const anchor = nextIndex + 1 < c2.length ? c2[nextIndex + 1].el : null
        if (newIndexToOldIndexMap[i] == 0) {
          // 这是一个新元素，直接创建并且插入到当前元素的下一个即可
          patch(null, nextChild, el, anchor)
        } else {
          // 根据参照物， 依次将节点直接移动进去。 所有节点都要移动， 性能太差
          if (j < 0 || i != increasingNewIndexSequence[j]) {
            hostInsert(nextChild.el, el, anchor)
          } else {
            j--
          }
        }
      }
    }
  }

  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children
    const c2 = n2.children

    const prevShapeFlag = n1.shapeFlag
    const shapeFlag = n2.shapeFlag

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // 老的是n个孩子， 但是新的是文本
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1)
      }
      if (c2 !== c1) {
        hostSetElementText(el, c2)
      }
    } else {
      // 现在的是数组， 上一次可能是文本，或者数组
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // 当前是数组， 之前是数组
          // 两个数组的比对， --》 diff算法 *******
          patchKeyedChildren(c1, c2, el)
        } else {
          // 没有孩子， 特殊情况， 当前是null，
          unmountChildren(c1) // 删除老的
        }
      } else {
        // 上一次是文本
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, '')
        }

        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el)
        }
      }
    }
  }

  const patchElement = (n1, n2, container) => {
    // 元素是相同节点
    let el = (n2.el = n1.el)
    // 更新属性， 更新儿子
    const oldProps = n1.props || {}
    const newProps = n2.props || {}
    patchProps(oldProps, newProps, el)
    patchChildren(n1, n2, el)
  }

  const processElement = (n1, n2, container, anchor = null) => {
    if (n1 === null) {
      mountElement(n2, container, anchor)
    } else {
      // console.log('处理元素的更新')
      patchElement(n1, n2, container)
    }
  }

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container)
    }
  }

  const unmount = n1 => {
    // 如果是组件， 调用组件的生命周期等
    hostRemove(n1.el)
  }
  const isSameVNodeType = (n1, n2) => {
    return n1.type === n2.type && n1.key === n2.key
  }

  const patch = (n1, n2, container, anchor = null) => {
    // anchor 操作插入等操作的参考节点。
    const { shapeFlag, type } = n2

    // 如果新旧两个VNode不是相同的type，那应该把以前的删掉， 换成n2
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = hostNextSibling(n1.el)
      unmount(n1)
      n1 = null // 重新渲染n2对应的内容
    }

    switch (type) {
      case Text:
        //如果是文本
        processText(n1, n2, container)
        break

      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          // console.log(n1, n2, container);
          processElement(n1, n2, container, anchor)
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

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
function getSequence (arr: number[]): number[] {
  const p = arr.slice()
  const result = [0]
  let i, j, u, v, c
  const len = arr.length
  for (i = 0; i < len; i++) {
    const arrI = arr[i]
    if (arrI !== 0) {
      j = result[result.length - 1]
      if (arr[j] < arrI) {
        p[i] = j
        result.push(i)
        continue
      }
      u = 0
      v = result.length - 1
      while (u < v) {
        c = ((u + v) / 2) | 0
        if (arr[result[c]] < arrI) {
          u = c + 1
        } else {
          v = c
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1]
        }
        result[u] = i
      }
    }
  }
  u = result.length
  v = result[u - 1]
  while (u-- > 0) {
    result[u] = v
    v = p[v]
  }
  return result
}
