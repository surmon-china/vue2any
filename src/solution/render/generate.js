
// lib
require('core-js')
const Vue = require('vue')
const babel = require('babel-core')
const compiler = require('vue-template-compiler')
const prettydiff = require('prettydiff2')
const esprima = require('esprima')
const estraverse = require('estraverse')
const escodegen = require('escodegen')

// global
global.babel = babel
global.esprima = esprima
global.escodegen = escodegen
global.estraverse = estraverse

// render
const parses = require('./parses')
const vueServerRender = require('./build')

// generate
const generate = function(renderFn, componentVm) {

  // options
  const options = this.options

  // renders
  // const { _ssrNode, _ssrStyle, _l, _ssrAttr, _ssrClass, _ssrEscape, _ssrList } = vueServerRender.renders(this)
  // 分析出render与剧中的所有 配置变量，并将变量名称转换为对应的语言版本 [string]，在 render 解析过程中判断是否为目标语言
  
  renderFn = renderFn.replace('with(this){return ', '')
  renderFn = renderFn.substring(0, renderFn.length - 1)
  
  // 原始
  if (this.options.debug) {
    console.debug('原始-renderFn:')
    console.log(renderFn)
  }

  // 替换 :style 部分的数据至目标语言
  // renderFn = parses.parseStyle.bind(this)(renderFn, options.variable)
  // console.log('\n处理 style 后-renderFn\n\n', renderFn)

  // 替换 :class 部分的数据至目标语言
  // renderFn = parses.parseClass.bind(this)(renderFn, options.variable)
  // console.log('\n处理 class 后-renderFn\n\n', renderFn)

  // 替换 :attr 部分的数据至目标语言
  // renderFn = parses.parseAttr.bind(this)(renderFn, options.variable)
  // console.log('\n处理 attr 后-renderFn\n\n', renderFn)

  // 替换 v-if 部分的数据至目标语言
  renderFn = parses.parseConditionalExpression.bind(this)(renderFn, options.variable, componentVm)
  console.log('\n处理 v-if 后-renderFn\n\n', renderFn)

  // 替换对应的服务端通信变量至目标语言
  // renderFn = parses.parseVariable.bind(this)(renderFn, options.variable)

  if (this.options.debug) {
    console.debug('最终-renderFn:')
    console.log(renderFn)
  }

  // 生成解析器  
  const _generate = new Function('renders', `
    var _l = renders._l
    var _ssrNode = renders._ssrNode
    var _ssrStyle = renders._ssrStyle
    var _ssrAttr = renders._ssrAttr
    var _ssrClass = renders._ssrClass
    var _ssrEscape = renders._ssrEscape
    var _ssrList = renders._ssrList
    with(this) {
      return ${renderFn}
    }
  `)

  if (this.options.debug) {
    // console.debug('generateFn:')
    // console.log(_generate)
  }

  // 绑定 vnode 上下文并根据输出渲染数据拼接最终数据
  let resultTemplate = _generate.bind(componentVm)(vueServerRender.renders(this))
  const getTemplateStringByTree = nodes => {
    if (!nodes) return ''
    return nodes.reduce((result, node) => {
      result += node.open || ''
      if (node.children && node.children.length) {
        result += getTemplateStringByTree(node.children) || ''
      }
      result += node.close || ''
      return result
    }, '')
  }
  resultTemplate = getTemplateStringByTree(resultTemplate)
  if (this.options.debug) {
    console.debug('转译后模板:')
    console.log(resultTemplate)
  }
  return resultTemplate
}

// doGenerate
const doGenerate = function(entryComponent) {
  
  // compile
  const compileResult = compiler.compile(entryComponent)
  const ssrCompile = compiler.ssrCompile(entryComponent)
  const parseComponent = compiler.parseComponent(entryComponent)

  // console.log('compileResult\n', compileResult)
  // console.log('ssrCompile\n', ssrCompile)
  // console.log('parseComponent\n', parseComponent)

  // 组件模板 + 脚本上下文
  const componentTemplate = parseComponent.template.content
  // console.log('componentTemplate - template', componentTemplate)

  const componentContext = babel.transform(parseComponent.script.content, {
    presets: ['es2015']
  }).code

  // console.log('componentContext', componentContext)

  // 模拟一个vm上下文
  const vueOptions = Object.assign({}, eval(componentContext), {
    template: componentTemplate
  })

  // 实例一个用于解析的 vm
  const componentVm = new Vue(vueOptions)

  if (this.options.debug) {
    console.debug('ssrCompile:')
    console.log(ssrCompile)
    console.debug('componentVm:')
    console.log(componentVm)
  }

  // ssr render result
  // console.log('vueServerRender', vueServerRender)
  /*
  vueServerRender.createRenderer().renderToString(componentVm, (err, html) => {
    if (err) {
      console.log('js render error');
    } else {
      console.log('html', html)
    }
  })
  */

  let result = generate.bind(this)(ssrCompile.render, componentVm)
  if (!this.options.minify) {
    result = prettydiff({ 
      source: result,
      mode: 'beautify',
      lang: 'php',
      inchar: '\t',
      insize: 1
    })
  }
  if (this.options.debug) {
    console.debug('转译格式化后模板:')
    console.log(result)
  }
  return result
}

module.exports = doGenerate
