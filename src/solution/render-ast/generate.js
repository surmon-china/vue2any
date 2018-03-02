
// lib
require('core-js')
const fs = require('fs')
const Vue = require('vue')
const path = require('path')
const babel = require('babel-core')
const compiler = require('vue-template-compiler')
const prettydiff = require('prettydiff2')
const esprima = require('esprima')
const estraverse = require('estraverse')
const escodegen = require('escodegen')
const getParameterNames = require('get-parameter-names')

// global
global.Vue = Vue
global.babel = babel
global.esprima = esprima
global.escodegen = escodegen
global.estraverse = estraverse

// render
const parsesFns = require('./parses')
const vueServerRender = require('./build')
const { createRenderer } = vueServerRender
const vueServerRenderer = createRenderer()

// trannsfer
global.instance = null
global.transfer = null

// 创建一个标签Vnode（适用于普通循环列表）
const createTagVnodeWithNormal = (open, close, children) => {
  targetVnode = new vueServerRender.StringNode(open, close, children)
  return targetVnode
}

// 创建一个标签Vnode（适用于Transtion-Group内嵌的循环列表）
const createTagVnodeWithTranstionGroup = (text, context) => {
  const childVnode = new vueServerRender.VNode(undefined, undefined, undefined, text, undefined, context)
  const targetVnode = new vueServerRender.VNode('php', 0, [childVnode], undefined, undefined, context)
  return targetVnode
}

// 将所有纯 string 的 vnode 转换为 StringNode
const parseStringNode = nodes => {
  nodes.forEach((node, index) => {
    if (typeof node === 'string') {
      // console.warn('-----------处理啊', node)
      nodes[index] = createTagVnodeWithNormal(node)
    } else if (node.children && node.children.length) {
      parseStringNode(node.children)
    }
  })
}

Vue.prototype.__e = Vue.prototype._e
Vue.prototype.__s = Vue.prototype._s
Vue.prototype.__t = Vue.prototype._t
Vue.prototype.__l = Vue.prototype._l
Vue.prototype.__render = Vue.prototype._render

Vue.prototype._e = text => {
  const result = Vue.prototype.__e(text)
  // console.warn('----------Vue.prototype._e', result)
  return result
}

Vue.prototype._s = val => {
  const result = Vue.prototype.__s(val)
  // console.warn('----------Vue.prototype._s', result)
  return result
}

Vue.prototype._t = function() {
  const result = Vue.prototype.__t.apply(this, arguments)
  // console.warn('----------Vue.prototype._t', this.$slots.default[0].children.length)
  return result
}

Vue.prototype._l = function(list, render) {

  // console.warn('----------Vue.prototype.__l', global.instance, list, render)

  let result = ''
  const __l = Vue.prototype.__l
  // console.warn('list-render-gen', list, render)
  if (global.instance.transfer.validate(list)) {
    const listData = global.instance.transfer.getDataFromEcho(list)
    const params = getParameterNames(render)
    const forEachCodeBefore = global.instance.transfer.foreach.before(listData, params[0], params[1])
    const forEachCodeAfter = global.instance.transfer.foreach.after

    // 这里要对 render 进行 AST 处理
    const listVnode = __l(1, render)[0]
    if (listVnode.children && listVnode.children.length) {
      parseStringNode(listVnode.children)
    }
    // console.warn('-----------listVnode', listVnode)
    let resultVnodes = []
    // 如果是来自 transition-group
    if (listVnode.data && listVnode.data.attrs && listVnode.data.attrs.trnasfer === 'group') {
      const forEachCodeVnodeBefore = createTagVnodeWithTranstionGroup(forEachCodeBefore, this)
      const forEachCodeVnodeAfter = createTagVnodeWithTranstionGroup(forEachCodeAfter, this)
      resultVnodes.push(forEachCodeVnodeBefore)
      resultVnodes.push(listVnode)
      resultVnodes.push(forEachCodeVnodeAfter)
      // console.warn('没啥说的，走到这里了', render, listVnode)
    } else {
      resultVnodes = [createTagVnodeWithNormal(forEachCodeBefore, forEachCodeAfter, [listVnode])]
    }
    result = resultVnodes
  } else {
    result = __l(list, render)
  }
  // console.warn('-----------走到vue', result)
  return result
}

Vue.prototype._render = function() {
  // console.warn('-------------Vue.prototype._render', this)
  let result = null
  // 如果是php的则不转译
  if (canDeleteNoGenVNode(this.$vnode)) {
    console.warn(`无需处理的元素: ${this.$vnode.tag}，跳过!`)
    result = createTagVnodeWithNormal('', '')
  } else {
    // 1. 是子组件
    // 2. 拥有 render 函数
    // 3. 拥有 php 的 propdata 字段
    if (this && !!this.$parent && this.$options && this.$options.render && this.$options.propsData) {
      // 是否拥有 php 的字段
      // console.warn('------------------现在的任务就是修改他！！', this.$options.render)
      const vm = this
      const props = this.$options.propsData
      let renderFn = this.$options.render
      const rennder_ast = parseAst.bind(global.instance)(`${renderFn}`, vm, global.instance.options.variable)
      renderFn = parseAstToRenderFn.bind(global.instance)(rennder_ast)
      const keys = Object.keys(props).filter(key => global.transfer.validate(props[key]))
      // console.warn('-------------Vue.prototype._render keys', keys)
      const ast = parseAst.bind(global.instance)(`${renderFn}`, vm, keys, props)
      renderFn = parseAstToRenderFn.bind(global.instance)(ast)
      if (!!renderFn && typeof renderFn === 'string') {
        // console.log('-------------------------------------------------', '\n', renderFn)
        const renders = vueServerRender.renders(global.instance, vm)
        renderFn = buildGenerate.bind(global.instance)(renders, renderFn, vm)
        this.$options.render = renderFn
      }
    }
    result = Vue.prototype.__render.apply(this, arguments)
    if (result.children && result.children.length) {
      parseStringNode(result.children)
    }
  }
  // console.warn('----------Vue.prototype._render - result:', result)
  return result
}

Vue.config.warnHandler = (_null, msg, vm, trace) => {
  // console.error('出了个错', _null, msg, vm, trace)
}

// 判断这个元素是否需要被转译
const canDeleteNoGenVNode = vnode => {
  // 拦截所有不需要转义的组件
  if (vnode.data && vnode.data.directives && vnode.data.directives.length) {
    const isPhp = vnode.data.directives.some(d => d.name == 'php')
    if (isPhp) {
      return true
    } else {
      return false
    }
  }
}

// 将 renderfn 转换为 AST 并进行分析处理
const parseAst = function(renderFn, vm, keyword, prefix) {

  // options
  const instance = this
  const options = this.options
  const parses = parsesFns(instance)
  keyword = keyword || options.variable

  // 如果是字符串函数
  let renderFnAst = null
  if (typeof renderFn === 'string') {

    // 如果来自于原始文件
    // console.warn('草泥马为什么不行', renderFn.includes('function anonymous() {'))
    if (!!renderFn && renderFn.includes) {
      if (renderFn.includes('with(this){return ')) {
        renderFn = renderFn.replace('with(this){return ', '')
        renderFn = renderFn.substring(0, renderFn.length - 1)
      } else if (renderFn.includes('function anonymous() {')) {
        const anonyIndex = renderFn.indexOf('function anonymous() {')
        renderFn = renderFn.substring(anonyIndex + 22, renderFn.length - 1)
      } else if (renderFn.includes('function anonymous(){')) {
        const anonyIndex = renderFn.indexOf('function anonymous(){')
        renderFn = renderFn.substring(anonyIndex + 21, renderFn.length - 1)
      } else if (renderFn.includes('return ')) {
        const firstReturnIndex = renderFn.indexOf('return ')
        renderFn = renderFn.substring(firstReturnIndex + 7, renderFn.length - 1)
      }
    }

    // console.warn('解析的时候错了', renderFn)
    // ast
    renderFnAst = esprima.parse(renderFn, { sourceType: 'script' })
  } else {
    renderFnAst = renderFn
  }
    
  if (this.options.debug) {
    console.debug('原始-renderFn:')
    console.log(typeof renderFn, renderFn)
    console.debug('原始-renderFnAst:')
    console.log(renderFnAst)
  }

  // 处理 AST
  if (this.options.debug) {
    console.debug('开始处理ast:')
  }

  estraverse.replace(renderFnAst, {
    enter(node, parent) {
      /* 
        需要处理的：
        1. 变量
        2. _ssrClass(String, [Array, Object], other)
        3. _ssrStyle(String)
        3. _ssrAttr
      */
      // console.log('...', escodegen.generate(node), node, parent)
      switch(node.type) {
        // 处理类似 ! 这样的运算符
        case 'UnaryExpression':
          // console.log('一元表达式', node)
          return parses.UnaryExpression(node, parent, vm, keyword, prefix)
          break
        // 处理标识符（变量常量访问）
        case 'Identifier':
          return parses.Identifier(node, parent, vm, keyword, prefix)
          // console.log('标识符', node, parent)
          break
        // 处理数组
        case 'ArrayExpression':
          // console.log('数组', node, parent)
          break
        case 'ExpressionStatement':
          // console.log('表达式声明', node, parent)
          break
        case 'BinaryExpression':
          // console.log('表达式', node, parent)
          // node = parseFunctionParams(node)
          // return node
          break
        case 'Literal':
          // console.log('文本', node, parent)
          break
        // 处理函数
        case 'CallExpression':
          // console.log('调用表达式', node)
          return parses.CallExpression.bind(instance)(node, parent, vm, keyword, prefix)
          break
        // 处理三目运算
        case 'ConditionalExpression':
          // console.log('----------处理条件表达式1', escodegen.generate(node))
          const parsedAst = parses.ConditionalExpression(node, parent, vm, keyword, prefix)
          // console.log('----------处理条件表达式2', escodegen.generate(parsedAst))
          return parsedAst
          break
        // 处理对象属性访问
        case 'MemberExpression':
          // console.log('成员表达式', node)
          return parses.MemberExpression(node, parent, vm, keyword, prefix)
          break
        // 处理对象本身
        case 'ObjectExpression':
          // console.log('对象表达式', node, parent)
          // return parses.ObjectExpression(node, parent, vm, keyword, prefix)
          break
      }
    }
  })

  return renderFnAst
}

// 将 ast 转换为 RenderFn
const parseAstToRenderFn = function(ast) {
  return escodegen.generate(ast, {
    format: {
      indent: {
          style: '        ',
          base: 0,
          adjustMultilineComment: true
      },
      newline: '\n',
      space: '  ',
      json: false,
      renumber: true,
      hexadecimal: false,
      quotes: 'double',
      escapeless: false,
      compact: true,
      parentheses: true,
      semicolons: false,
      safeConcatenation: false
    }
  })
}

// 将 vm 转换为 html
const renderVmToHtml = function(vm) {
  const renders = vueServerRender.renders(this, vm)
  const { _ssrNode, _ssrList, _ssrAttr, _ssrClass, _ssrStyle, _ssrEscape } = renders
  vm._ssrList = _ssrList
  vm._ssrAttr = _ssrAttr
  vm._ssrClass = _ssrClass
  vm._ssrStyle = _ssrStyle
  vm._ssrEscape = _ssrEscape
  // console.warn('---------------- \nVM:\n', vm, '\nVue:\n', Vue.prototype)
  return new Promise(function (resolve, reject){
    vueServerRenderer.renderToString(vm, (err, string) => {
      if (err) {
        reject(err)
      } else {
        resolve(string)
      }
    })
  })
}

// 生成一个已对接好的 render对象
const buildGenerate = function(renders, renderFn, vm, doGen) {

  // 如果传入的 renderfn 本身包含了一层一名函数，则要去掉
  if (typeof renderFn === 'string' && renderFn.includes('function anonymous(){')) {
    renderFn = renderFn.replace('function anonymous(){', '')
    renderFn = renderFn.substring(0, renderFn.length - 1)
  }

  // console.warn('--------------------buildGenerate', renderFn)

  // 生成解析器
  eval(`
    var generateFn = function(utils) {
      const { renders, renderFn, vtaInstance } = utils
      const { _ssrNode, _ssrList, _ssrAttr, _ssrClass, _ssrStyle, _ssrEscape } = renders
      return function() {
        this._ssrNode = _ssrNode
        this._ssrList = _ssrList
        this._ssrAttr = _ssrAttr
        this._ssrClass = _ssrClass
        this._ssrStyle = _ssrStyle
        this._ssrEscape = _ssrEscape
        const __l = this._l
        this._l = function(list, render) {
          // console.warn('list-render-gen', list, render)
          if (vtaInstance.transfer.validate(list)) {
            const params = getParameterNames(render)
            const listData = vtaInstance.transfer.getDataFromEcho(list)
            const forEachCodeBefore = vtaInstance.transfer.foreach.before(listData, params[0], params[1]);
            const forEachCodeAfter = vtaInstance.transfer.foreach.after;
            const listVnode = __l(1, render)[0]
            let resultVnodes = []
            // 如果是来自 transition-group
            if (listVnode.data && listVnode.data.attrs && listVnode.data.attrs.trnasfer === 'group') {
              const forEachCodeVnodeBefore = createTagVnodeWithTranstionGroup(forEachCodeBefore, this)
              const forEachCodeVnodeAfter = createTagVnodeWithTranstionGroup(forEachCodeAfter, this)
              resultVnodes.push(forEachCodeVnodeBefore)
              resultVnodes.push(listVnode)
              resultVnodes.push(forEachCodeVnodeAfter)
              // console.warn('没啥说的，走到这里了', render, listVnode)
            } else {
              resultVnodes = [createTagVnodeWithNormal(forEachCodeBefore, forEachCodeAfter, [listVnode])]
            }
            // console.warn('-------走到gen', list, render, resultVnodes)
            return resultVnodes
          } else {
            return __l(list, render)
          }
        }
        with(this) {
          return ${renderFn}
        }
      }
    }`)

  generateFn = generateFn({
    renders,
    renderFn,
    vtaInstance: this
  })

  if (doGen) {
    return generateFn.bind(vm)()
  } else {
    return generateFn.bind(vm)
  }
}

// 将 render 函数解析为模板
const parseRenderFnToTarget = async function(renderFn, vm) {

  // 解析自定义组件
  const parseVnodeToComponenVm = vnode => {

    // console.log('--------------解析什么自定义组件啊', vnode)

    // 将内置的渲染的方式改为 render 函数（只需传递 inlineTemplate），这样就可以获得控制权
    vnode.data = vnode.data || {}
    vnode.data.inlineTemplate = vnode.data.inlineTemplate || {}

    // 处理来自组件内变量转换的组件
    if (vnode.text && this.transfer.validate(vnode.text)) {
      return vnode.text
    }

    if (canDeleteNoGenVNode(vnode)) {
      console.warn(`无需处理的元素: ${vnode.tag}，跳过!`)
      return false
    }

    // 有可能非局部组件，而是全局注册的
    // console.warn('这组件他妈的怎么了', vnode)
    if (!vnode.componentOptions && vnode.tag !== 'php') {
      if (this.options.debug) {
        console.warn('这是一个未知或全局组件， 暂不处理', vnode)
      }
      if (this.options.progress) {
        console.warn(`遇到一个无法处理的组件: ${vnode.tag}，跳过!`)
      }
      return null
    }
 
    // 通过props对象拿到服务端数据字段
    let props = ''
    vnode.componentOptions = vnode.componentOptions || {}
    const propsData = vnode.componentOptions.propsData
    if (propsData) {
      Object.keys(propsData).forEach(prop => {
        if (!this.transfer.validate(propsData[prop])) {
          // console.warn('---------propsData', propsData[prop])
          // if (propsData[prop].startsWith(this.options.variable)) {
            // console.warn('就是他了！！！', propsData[prop], this)
          // }
        }
      })
      props = Object.keys(propsData).filter(prop => this.transfer.validate(propsData[prop]))
    }

    // 拿去给ast处理
    let vm = vueServerRender.createComponentInstanceForVnode(vnode)
    const tag = vnode.componentOptions.tag
    const template = vnode.componentOptions.Ctor.options.template
    if (this.options.debug) {
      console.warn('局部组件：', vnode, vm)
    }
    if (this.options.progress) {
      console.log(`处理局部组件: ${vnode.tag}...`)
    }
    if (template) {
      const ssrCompile = compiler.ssrCompile(template)
      // console.warn('------------------------propsData', props, propsData)
      const renderAst = parseAst.bind(this)(ssrCompile.render, vm, props, propsData)
      const _renderFn = parseAstToRenderFn.bind(this)(renderAst)
      // console.debug('----------------------------------处理后 _renderFn:', ssrCompile.render, _renderFn)
      vnode.data.inlineTemplate.render = new Function(`with(this){return ${_renderFn} }`)
      vm = vueServerRender.createComponentInstanceForVnode(vnode)
    }

    // 处理 slot
    // console.warn('处理 slot', vm)
    const slots = vm.$slots
    if (slots) {
      const parseSlot = _slots => {
        let context
        _slots.forEach((_s, i) => {
          if (typeof _s === 'string') {
            _slots[i] = new vueServerRender.VNode(undefined, undefined, undefined, _slots[i], undefined, context)
            console.debug(_s, _slots[i], context)
          } else {
            if (typeof _s === 'object' && _s.constructor.name === 'VNode') {
              if (canDeleteNoGenVNode(_s)) {
                _slots.splice(i, 1)
                // console.log('可以删除！！！！！！', _slots)
              }
            }
            if (_s.children && _s.children.length) {
              context = _s.context
              parseSlot(_s.children)
            }
          }
        })
      }
      Object.keys(slots).forEach(s => {
        const slot = slots[s]
        if (slot.length) {
          parseSlot(slot)
        }
      })
    }
    // console.warn('---------parseVnodeToComponenVm', vm.$children)
    return vm
  }

  // 绑定 vnode 上下文并根据输出渲染数据拼接最终数据
  const getTemplateStringByTree = async nodes => {
    if (!nodes) return ''
    let result = ''
    for (const node of nodes) {
      if (typeof node === 'string') {
        result += node
      } else if (node.constructor.name === 'VNode') {
        const vm = parseVnodeToComponenVm(node)
        // console.warn('-------------node', vm)
        if (vm) {
          if (typeof vm === 'string') {
            result += vm
          } else {
            const resultComponent = await renderVmToHtml.bind(this)(vm)
            // console.warn('-----------------resultComponent', vm, resultComponent)
            result += resultComponent
          }
        }
      } else {
        result += node.open || ''
        if (node.children && node.children.length) {
          result += await getTemplateStringByTree(node.children) || ''
        }
        result += node.close || ''
      }
    }
    return result
  }

  const renders = vueServerRender.renders(this, vm)
  // console.debug('--------转译前模板函数:', renders, renderFn)
  let resultTemplate = buildGenerate.bind(this)(renders, renderFn, vm, true)
  if (this.options.debug) {
    console.debug('转译前模板:')
    console.log(resultTemplate)
  }

  if (typeof resultTemplate !== 'string') {
    if (resultTemplate instanceof Array) {
      resultTemplate = await getTemplateStringByTree(resultTemplate)
    } else if (resultTemplate.constructor.name === 'VNode') {
      const vm = parseVnodeToComponenVm(resultTemplate)
      if (vm) {
        if (typeof vm === 'string') {
          resultTemplate = vm
        } else {
          resultTemplate = await renderVmToHtml.bind(this)(vm)
        }
      }
    }
  }

  if (typeof resultTemplate === 'string') {
    resultTemplate = resultTemplate
                     .replace(/<php>/g, '\n')
                     .replace(/<\/php>/g, '\n')
                     .replace(/\n\n/g, '\n')
                     // .replace(/&amp;/g, '&')
                     .replace(/&lt;\?php/g, this.transfer.keywords.prefix)
                     .replace(/\?&gt;/g, this.transfer.keywords.postfix)
                     .replace(/\sdata-server-rendered=\"true\"/g, '')
  }
  if (this.options.debug) {
    console.debug('转译后模板:')
    console.log(resultTemplate)
  }
  return resultTemplate
}

// 格式化目标输出模板
const formatResultTemplate = template => {
  return prettydiff({ 
    source: template,
    mode: 'beautify',
    lang: 'html',
    inchar: '\t',
    insize: 1
  })
}

const doInitVmAndTransfer = async function(renderFn, componentVm, keyword = null) {

  if (this.options.progress) {
    console.log('创建实例...')
  }

  if (this.options.debug) {
    console.debug('renderFn:')
    console.log(renderFn)
    console.debug('componentVm:')
    console.log(componentVm)
  }

  if (this.options.progress) {
    console.log('解析AST...')
  }

  const renderAst = parseAst.bind(this)(renderFn, componentVm, keyword)

  if (this.options.progress) {
    console.log('解析RenderFn...')
  }

  const _renderFn = parseAstToRenderFn.bind(this)(renderAst)

  if (this.options.debug) {
    console.debug('最终-renderFn:')
    console.log(_renderFn)
  }

  if (this.options.progress) {
    console.log('渲染处理中...')
  }

  let result = await parseRenderFnToTarget.bind(this)(_renderFn, componentVm)

  if (!this.options.minify) {
    result = formatResultTemplate(result)
    if (this.options.debug) {
      console.debug('转译格式化后模板:')
      // console.log(result)
    }
    if (this.options.progress) {
      console.log('输出前格式化...')
    }
  }

  return result
}

// 根据入口组件建立上下文并转换
const initVmByFile = async function(entryComponent, filePath) {

  const vtaInstance = this
  global.instance = vtaInstance
  global.transfer = vtaInstance.transfer
  
  // compile
  const ssrCompile = compiler.ssrCompile(entryComponent)
  const parseComponent = compiler.parseComponent(entryComponent)

  if (this.options.debug) {
    // console.log('compile\n', compiler.compile(entryComponent))
    // console.log('ssrCompile\n', ssrCompile)
    // console.log('parseComponent\n', parseComponent)
  }

  if (this.options.progress) {
    console.log('分析文件...')
  }

  // 组件模板 + 脚本上下文
  const componentTemplate = parseComponent.template.content

   // 如果配置了全局组件的依赖信息
  let componentsConfig = {}
  if (filePath.includes('.vue')) {
    filePath = filePath.slice(0, filePath.lastIndexOf('/'))
  }
  // console.warn('filePath', filePath)
  if (parseComponent.customBlocks.length) {
    const configBlock = parseComponent.customBlocks.filter(block => block.type === 'config')[0]
    const components = JSON.parse(configBlock.content).components
    Object.keys(components).forEach(component => {
      components[component] = path.join(filePath, components[component])
    })
    // console.log('----------', components)
    componentsConfig = components
  }

  // 如果存在脚本
  let imports = {}
  let componentContextCode = ''
  if (parseComponent.script && parseComponent.script.content) {
    let componentScript = parseComponent.script.content
    componentScript = `var window = window || {};${componentScript}`

    // console.log('componentScript', componentScript)
    let componentContextBabel = babel.transform(componentScript, {
      presets: ['es2015']
    })

    // 模拟一个vm上下文
    componentContextCode = componentContextBabel.code

    // 相对路径
    imports = componentContextBabel.metadata.modules.imports
    imports = imports.reduce((_imports, _import) => {
      // 如果来自于路径简写，那就转换简写
      let resultPath = null;
      if (_import.source.startsWith('@/')) {
        resultPath = path.join(__dirname, '..', '..', '..', '..', '..', 'src', _import.source.replace('@/', ''))
      } else {
        resultPath = path.join(filePath, _import.source)
      }
      _imports[[_import.specifiers[0].local]] = resultPath
      return _imports
    }, componentsConfig)

    // console.log('最终的路径们', imports)

    // 将所以需要的文件加载进来
    for (_import in imports) {
      const tempPath = imports[_import]
      imports[_import] = fs.readFileSync(imports[_import], 'utf-8')
      imports[_import] = await initVmByFile.bind(this)(imports[_import], tempPath)
    }
    if (this.options.debug) {
      console.warn('componentContextBabel imports', imports)
    }
  }

  // 注释掉相关的require脚本, 仅保留库和.js结尾的require语句
  const componentContextAst = esprima.parse(componentContextCode, { sourceType: 'script' })
  // console.warn('需要注释脚本了？？？', imports, componentContextCode, componentContextAst)
  estraverse.replace(componentContextAst, {
    enter(node, parent) {
      // 如果在components里的对象，那么也是会报错的
      if (node.type === 'ObjectExpression' &&
          parent.type === 'Property' &&
          parent.key.name === 'components') {
        // console.warn('需要注释脚本', escodegen.generate(node), node, parent)
        // node.properties[0].value = {
        //   name: null,
        //   type: 'Identifier'
        // }
        return {
          name: '{}',
          type: 'Identifier'
        }
      }
      if (node.type === 'VariableDeclaration' &&
          node.kind === 'var' &&
          node.declarations &&
          node.declarations.length &&
          node.declarations[0].type === 'VariableDeclarator' &&
          node.declarations[0].init &&
          node.declarations[0].init.type === 'CallExpression' &&
          (node.declarations[0].init.callee.name === 'require' || 
          node.declarations[0].init.callee.name === '_interopRequireDefault')
          ) {
        const filePath = escodegen.generate(node.declarations[0].init.arguments[0]).replace(/^\'/g, '').replace(/\'$/g, '')
        const fileName = filePath.substring(filePath.lastIndexOf('/') + 1)
        // 非js库、文件均不能引入
        const isAnnotations = !/^[^\.]+(\.js)*$/.test(fileName)
        if (isAnnotations) {
          return {
            name: `// ${escodegen.generate(node)}`,
            type: 'Identifier'
          }
        // 如果是转义的则删除
        } else if (node.declarations[0].init.callee.name === '_interopRequireDefault') {
          // console.warn(escodegen.generate(node))
          return {
            name: `// ${escodegen.generate(node)}`,
            type: 'Identifier'
          }
        } else {
          // 如果是js文件则把路径前面加上绝对路径
          if (/^(\/|\.|@\/)/g.test(filePath)) {
            let entryFilePath
            // console.warn('这他妈是啥js文件-----------', filePath)
            if (filePath.startsWith('@/')) {
              entryFilePath = path.join(__dirname, '..', '..', '..', '..', '..', 'src', filePath.replace('@/', ''))
            } else {
              entryFilePath = vtaInstance.options.entryFile
              entryFilePath = entryFilePath.substring(0, entryFilePath.lastIndexOf('/'))
              entryFilePath = path.join(entryFilePath, filePath)
            }
            node.declarations[0].init.arguments[0].raw = entryFilePath
            node.declarations[0].init.arguments[0].value = entryFilePath
            // console.warn('js文件', filePath, entryFilePath, escodegen.generate(node))
            return node
          }
        }
      }
    }
  })

  componentContextCode = escodegen.generate(componentContextAst)
  // console.log('componentContextCode', componentContextCode)
  // console.warn('这就是最终的产出？？？？？', componentContextCode)
  
  // 合并 config 配置的全剧组件路径和局部组件
  let vueOptions = Object.assign({}, eval(componentContextCode), {
    template: componentTemplate
  })

  // 把所有fs进来的文件分析后的结果挂载到 components 对象下
  for (_import in imports) {
    vueOptions.components[_import] = imports[_import].options
  }

  return {
    options: vueOptions,
    render: ssrCompile.render
  }
}

const go = async function (entryComponent, filePath) {
  const { options, render } = await initVmByFile.bind(this)(entryComponent, filePath)
  if (this.options.debug) {
    console.warn('vueOptions', options)
    Vue.config.warnHandler = (_null, msg, vm, trace) => {
      // console.error('出了个错', _null, msg, vm, trace)
    }
  }
  return await doInitVmAndTransfer.bind(this)(render, new Vue(options))
}

module.exports = {
  go,
  parseAst,
  parseAstToRenderFn,
  parseRenderFnToTarget,
  formatResultTemplate,
  initVmByFile
}
