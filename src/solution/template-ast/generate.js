
// lib
const fs = require('fs')
const path = require('path')
const compiler = require('vue-template-compiler')

// file
const entryFile = 'App.vue'
const entryPath = path.join(__dirname, '/test/', entryFile)
const entryComponent = fs.readFileSync(entryPath, 'utf-8')

// config
const config = require('./config.js')

// render
const html = require('./renders/html')
const directive = require('./renders/directive')
const render = { html, directive }

// compile
const compileResult = compiler.compile(entryComponent)

console.log('ast\n', compileResult)

// transfer
const transfer = asts => {
  // console.log('asts', asts)
  
  return asts.reduce((template, currentAst, i, a) => {
    console.log('currentAst', currentAst)

    // 是否为自闭合标签
    let isSelfCloseTag = false

    // 是否为循环元素
    let isLoopElement = false

    // 验证数据是否来自服务端变量
    const dataIsFromServer = data => {
      return data.indexOf(config.variable) === 0
    }

    // 确保为非根元素
    if (currentAst.tag !== 'template') {

      // 普通文档节点
      if (currentAst.type === 1) {

        // 是否为自闭合标签
        isSelfCloseTag = render.html.isSelfCloseTag(currentAst.tag)

        // 是否为循环元素
        isLoopElement = currentAst.for && currentAst.alias

        // 构建静态class
        const astClass = () => {
          const staticClass = currentAst.staticClass
          return staticClass ? `class=${staticClass}` : ''
        }

        // 构建属性
        const astAttrs = () => {
          const attrs = currentAst.attrs
          const staticClass = currentAst.staticClass
          return (attrs && attrs.length) ? attrs.reduce((attrs, attr, i) => {
            // 如果是一些有意义的属性则添加
            if (render.html.isHtmlAttr(attr.name)) {
              attrs += `${attr.name}=${attr.value} `
            }
            return attrs
          }, '') : ''
        }

        // 构架闭合符
        const astCloseSign = () => {
          return isSelfCloseTag ? '/' : ''
        }

        // 生成前缀标签
        // 如果拥有for属性，则是需要迭代的元素，生成PHP的标签
        if (isLoopElement) {
          console.log('是要循环的元素')
          // 只有解析的数据是来自服务端数据时才进行转换
          if (dataIsFromServer(currentAst.for)) {
            template += config.languageCode.foreach.before(currentAst.for, currentAst.alias, currentAst.iterator1)
          }
        } else {
          template += `<${currentAst.tag} ${astClass()} ${astAttrs()} ${astCloseSign()}>\n`
          template = template.replace(/\s+(>|\/>)/g, replacement =>  replacement.includes('/') ? '/>' : '>')
        }

        // 构建所有支持的指令
        const directives = currentAst.directives
        if (directives && directives.length) {
          directives.forEach(directive => {
            // console.log('处理对应的 directive', directive, config.variable)
            // 只有解析的数据是来自服务端PHP数据时才进行转换
            if (dataIsFromServer(directive.value)) {
              const renderDirective = render.directive[directive.name]
              if (renderDirective) {
                template += renderDirective(directive.value)
              }
            }
          })
        }

      // 文本节点
      } else if (currentAst.type === 3) {
        template += currentAst.text

      // 特殊文档节点
      } else if (currentAst.type === 2) {
        if (currentAst.text) {
          template += currentAst.text
        }
      }
    }
    // 如果存在子节点则递归编译
    if (currentAst.children && currentAst.children.length) {
      template += transfer(currentAst.children)
    }
    // 闭合标签
    if (currentAst.tag !== 'template') {
      // 如果是循环元素则添加php闭合标签
      if (currentAst.type === 1) {
        if (isLoopElement) {
          template += `\n${config.languageCode.foreach.after}\n`
        } else if (!isSelfCloseTag) {
          template += `\n</${currentAst.tag}>\n`
        }
      }
    }
    return template
  }, '')
}

const result = transfer([compileResult.ast])
console.log('result\n\n', result)
