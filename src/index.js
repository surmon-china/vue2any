
// libs
const fs = require('fs')
const fsExtra = require('fs-extra')
const path = require('path')

// generate
const phpTransfer = require('./transfers/php.js')
const generate = require('./solution/render-ast/generate')

// VueToAny
class VueToAny {

  // constructor
  constructor(options) {

    // 初始化配置
    this.options = Object.assign({}, {

      // 使用的语言
      language: 'php',

      // 使用的服务端通讯字段
      variable: 'PHPDATA',

      // 文件是否压缩后输出
      minify: false,

      debug: false,
      progress: false,

      // 文件及路径
      entryFile: path.join(__dirname, '/..', '/test', '/vue/', 'Dev.vue'),
      outFile: path.join(__dirname, '/..', '/test', '/out/', 'dev.php')
      
    }, options)

    // 不同语言版本的转换器
    this.transfers = {
      php: phpTransfer
    }

    // 中间件
    this.middlewares = {
      before: [],
      after: []
    }
  }

  // 更新配置
  updateOptions(newOptions) {
    this.options = Object.assign(this.options, newOptions)
  }

  // 增加不同语言解析器
  addTransfer(transfer) {
    this.transfers.push(transfer)
  }

  // 设置使用什么语言
  setTransfer(language) {
    this.language = language
  }

  // 增加插件（中间件）
  useMiddleware(event, middleware) {
    this.middlewares[event] = this.middlewares[event] || []
    this.middlewares[event].push(middleware)
  }

  // 删除插件
  delMiddleware(event = null, middleware = null) {
    if (middleware) {
      if (this.middlewares[event] && this.middlewares[event].length) {
        this.middlewares[event]
        .splice(this.middlewares[event]
        .findIndex(mw => Object.is(mw, middleware)), 1)
      }
    } else if (event) {
      this.middlewares[event] = []
    } else {
      this.middlewares = {}
    }
  }

  // 转换文件
  generate() {
    if (this.options.debug) {
      console.group('vue-to-any')
      console.debug('读取文件...')
    }
    if (this.options.progress) {
      console.log('读取文件...')
    }
    const entryFile = fs.readFileSync(this.options.entryFile, 'utf-8')
    if (this.middlewares.before.length) {
      this.middlewares.before.forEach(middleware => {
        middleware.bind(this)(result)
      })
    }
    // console.debug('执行转换')
    return generate.go.bind(this)(entryFile, this.options.entryFile).then(result => {

      // 如果由于字符串被内存复制，则这里改为一个 实例 + 文件内容 对象来做参数
      if (this.middlewares.after.length) {
        this.middlewares.after.forEach(middleware => {
          const _result = middleware.bind(this)(result)
          if (_result !== undefined) {
            result = _result
          }
        })
      }
      // console.debug('执行输出')
      fsExtra.outputFileSync(this.options.outFile, result, 'utf8')
      if (this.options.debug) {
        console.debug('输出完成 Done!')
        console.groupEnd('vue-to-any')
      }
      if (this.options.progress) {
        console.log('输出文件...Done!')
      }
    })
  }

  get transfer() {
    return this.transfers[this.options.language]
  }
}

module.exports = VueToAny
