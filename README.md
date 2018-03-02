# vue2any
Transfer vue file to any language code.

## 解决方案

1. ast（已暂停）
2. ssrRender（已暂停）
3. ssrRenderAst（最终方案）

## todo

1. ~~v-if v-else-if v-else 三目运算 AST的抽象及转译~~
2. ~~list 内部嵌套的解析~~
3. ~~组件的嵌套解析~~
4. ~~slot的解析处理~~
5. ~~局部组件依赖的处理（组件会被解析为一个`vnode`而非`string` + `vue`文件内的依赖需要转化）~~
6. ~~全局组件的处理~~
7. ~~组件 + v-if 的处理（三目运算的计算从正则迁移至AST即可解决）~~
8. ~~动态组件 <component :is="componentName"></component>~~
9. 特殊工具方法的处理

## 工作原理

1. `.vue` 组件 => `vue-template-compiler` => `ssrRender`
2. `ssrRender` => `esprima` => `js-ast`
3. `js-ast` => `estraverse(各种替换/解析处理)` => `result-js-ast`
4. `result-js-ast` => `escodegen` => `result-ssrRender`
5. `result-ssrRender` => `vue-server-rander` => `html-php-code`
6. 递归处理 `html-php-code` 中无法解析的 `vnode(component)` => `html-php-code`

**核心问题：**

1. js 方法无法转换为 PHP 方法
2. 组件的依赖无法被捕获

**相关工具：**
- esprima: http://esprima.org/demo/parse.html#(将代码转换为标准 ast)
- espree: https://github.com/eslint/espree
- escodegen: https://github.com/estools/escodegen(将ast生成为标准code)
- estraverse: https://github.com/estools/estraverse(遍历并且更新抽象语法树)

**相关资料:**

AST三板斧：

- 通过 esprima 把源码转化为AST
- 通过 estraverse 遍历并更新AST
- 通过 escodegen 将AST重新生成源码

esprima文档: http://esprima.readthedocs.io/en/latest/getting-started.html#using-node-js-to-play-with-esprima
http://www.cnblogs.com/ziyunfei/p/3183325.html
http://blog.csdn.net/dear_mr/article/details/72587908

**已有实践：**
- flowjs: https://github.com/channg/flowjs/blob/master/src/esparse.js
- js2php: https://github.com/endel/js2php/blob/master/index.js#L1

解决痛点：通过专业的语法解析工具，避免了单薄可用性低的正则匹配，且可以根据不同的(ES默认方)法来定制转译后的 PHP 方法，以支持 PHP 基本方法的使用，可以参考 js2php

## 如何安装

```bash
npm i vue-to-any --save
```

## 基础使用

```javascript
const VueToAny = require('vue-to-any')

// 实例化（options部分可选）
const vueToAny = new VueToAny({

  // 目标语言（default: php）
  language: 'php',

  // 转译使用的服务端通讯字段，无需$等特殊符（default: PHPDATA）
  variable: 'PHPDATA',

  // 文件是否压缩后输出（default: false）
  minify: false,

  // 是否展示调试信息
  debug: false,

  // 是否输出进度
  progress: true,

  // 分别为 [ 入口/出口 ] 文件的 [ 路径和文件名字 ]（必须指定，默认指向开发文件夹）
  entryFile: path.join(__dirname, '/..', '/test', '/vue/', 'Test.vue'),
  outFile: path.join(__dirname, '/..', '/test', '/out/', 'test.php')
})

// 执行转换输出转换
vueToAny.generate()
```

## 进阶使用

```javascript
console.log(vueToAny)

// 插件/中间件（可选），方便分别对 [ 转译前/后 ] 的数据进行中间处理

// 处理转译前的 [ ssrRender ] 数据
vueToAny.useMiddleware('before', ssrRender => {
  return ssrRender
})

// 处理转译后的 [ targetLangCode ] 数据
vueToAny.useMiddleware('after', resultTemplate => {
  return resultTemplate
})

// 移除指定中间件（注意：如果要想移除指定某个中间件，则之前 use 时需要传入函数名字，而不是一个匿名函数实体）
vueToAny.delMiddleware('after', oldAfterMiddleware)

// 移除所有编译后中间件
vueToAny.delMiddleware('after')

// 移除所有中间件
vueToAny.delMiddleware()

// 添加不同语言版本的转译器（参考：transfers/php.js）
vueToAny.addTransfer({
  'ejs': ejsTransfer
})

// 设置使用哪个语言版本进行工作
vueToAny.setTransfer('ejs')

// 更新实例配置对象
vueToAny.updateOptions({ ...newOptions })
```

## 使用限制（待完善）

1. 所有组件内数据的引用均不受任何限制
2. 所有组件内引用的服务端数据（即约定通信字段），均不能 [ 包含  ] 任何 js 计算
3. 暂时不支持组件内部引入包含依赖`window`对象的js文件或库
4. 组件内部对外部资源的引用比如遵循下面规则：
    - 引用组件必须用 `import` 语句引入 `.vue`结尾的相对路径
    - 引用其他资源必须用`require`语句 
    - 全局组件由于转译器不能识别，所以要自己加一个叫 `config`的`block`，以`json`的形式配置路径

**假设以`SERVERDATA`字段为约定字段：**

### 不支持的形式：

```html
<div v-text="parseMethod(SERVERDATA.xxx.content)"></div>
<div>{{ SERVERDATA.xxx.content + '222' }}</div>
<img class="php-img" :src="SERVERDATA.imgSrc || '22'" alt="a image">
<img class="php-img" :src="SERVERDATA.imgSrc ? SERVERDATA.imgSrc : localImage">
<ul>
  <li class="item" v-for="(item, key) in SERVERDATA.arr.filter(a => !!a.id)">
    <div>{{ item.abc + 'string' }}</div>
  </li>
</ul>
```


### 支持的形式：

- 数据输出
- 数据绑定
- 数据翻转 (!PHPDATA.xxx)
- 基本的计算符 (PHPDATA.xxx === 'xxx') (PHPDATA.xxx < 'xxx')
- 动态 class、style 在 object || array 形式的时候允许和本地数据混合使用
- 列表输出
- 各种嵌套
- 依赖的组件调用
- transition-group 里的 v-for 元素（包括组件），要加属性：`trnasfer="group"`

```html
<div>{{ SERVERDATA.name }}</div>
<input type="text" v-model="SERVERDATA.name.model">
<div v-text="SERVERDATA.arr.content"></div>
<div v-html="SERVERDATA.arr.xxx"></div>
<div v-show="SERVERDATA.isShow">show</div>
<div v-if="SERVERDATA.isRender">show</div>
<div v-else-if="SERVERDATA.isRenderElse">show</div>
<div v-else>not show</div>
<div class="static-class" :class="{ 
  active: SERVERDATA.active, first: localData 
}"></div>
<div class="static-class" :class="[
  SERVERDATA.active ? 'active': '', 'static-class', localFitst ? 'first' : ''
]"></div>
<div class="static-class" :style="{ 
  background: SERVERDATA.bg,
  fontSize: localData.fontSize
}"></div>
<ul>
  <li class="item" v-for="item in SERVERDATA.arr">
    <div>{{ item.abc }}string</div>
  </li>
</ul>
<ul>
  <li class="item" v-for="(item, key) in SERVERDATA.arr">
    <div>{{ item.abc }} - {{ key }}</div>
    <div>嵌套循环</div>
      <div v-for="children in item.childrens">
        {{ children.name }}
      </div>
    </div>
  </li>
</ul>
```

## 相关指令

```bash
# 安装依赖
npm install

# 进入开发模式
npm run dev

# 构建
npm run build

# 测试脚本
npm run test
```

## 目录结构

```
nuxt.js-blog/
   |
   ├──src/                     * 主程序
   │   │
   │   │──index.js             * 核心类
   │   │
   │   └──transfers            * 不同语言的转译器方法
   │   │
   │   └──solution(render-ast) * 核心解决方案
   │       │
   │       │──build.js         * vue-server-render 的衍生版
   │       │
   │       │──parses.js        * 对 ast 函数的匹配和替换
   │       │
   │       └──generate.js      * ast 抽象 + vm 创建 / 文件分析 / 依赖分析 / 转换执行
   │
   │──test/                    * 测试用的文件
   │   │
   │   ├──dev.js               * 开发脚本
   │   │
   │   └──test.js              * 测试脚本
   │   │
   │   ├──vue                  * 用于测试/开发的 vue 组件
   │   │
   │   └──out                  * 测试/开发输出的 php 脚本
   │
   │──package.json             * 包信息
   │
   │──.babelrc                 * Babel配置
   │
   │──.gitignore               * Git忽略文件配置
   │
   └──.editorconfig            * 编码风格配置
```

