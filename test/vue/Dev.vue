<template>
  <div id="app" class="app" :class="appclass" :show="show + '123213'">

    <!-- 测试一个复杂的 -->
    <div v-if="PHPDATA.test.test">
      <!-- <p你说会有hello吗></p> -->
      <hello></hello>
    </div>
    <p v-else>haola</p>

    <hello v-if="PHPDATA.hello.test"></hello>
    <div v-else>213123123</div>

    <!-- 基本测试 -->
    <img class="local-img" src="./assets/logo.png">
    <img class="component-img" :src="img.src">
    <img class="php-img" :src="PHPDATA.img.src" :alt="PHPDATA.img.alt">
    <div class="php-class" :id="PHPDATA.div.id" :title="title"></div>

    <!-- 渲染逻辑 -->
    <p class="component-v-if" v-if="!isShow">{{ name }}</p>
    <p class="component-v-else-if" v-else-if="show2">{{ name + '213123' }}</p>
    <p class="component-v-else-if" v-else-if="show1">show1</p>
    <p class="component-v-else" v-else>else else</p>
    <p class="php-v-if" v-if="PHPDATA.tab === 1">{{ PHPDATA.name }}</p>
    <p class="php-v-else" v-else-if="PHPDATA.showtab">{{ name + '213123' }}</p>
    <p v-else>else hahah</p>
    <div v-if="!PHPDATA.style.if">我是测试服务端的 v-if</div>
    <div v-else>我是测试服务端的 v-else</div>
    <p class="component-v-if" v-if="isShow">{{ name }}</p>
    <p class="component-v-else-if" v-else-if="show2">{{ name + '213123' }}</p>
    <p class="component-v-else-if" v-else-if="show1">show1</p>
    <p class="component-v-else" v-else>else else</p>

    <!-- class - object -->
    <div class="test-class-object" 
         :class="{ 
          'hover': show,
          disabled: !PHPDATA.disabled,
          active: PHPDATA.active
        }">php - class - object</div>
    <!-- class - array -->
    <div class="test-class-array" :class="[
      !PHPDATA.active ? 'active' : 'noactive', 
      show ? 'gogoshow' : '',
      'class-test'
    ]">php - class - array</div>  

    <!-- style -->
    <div class="component-v-show" 
           v-show="isShow" 
           :style="{ 
            'active': show,
            color: textColor,
            backgroundColor: show 
           }">i am component v-show</div>
      <div class="php-v-show" 
           v-show="PHPDATA.style.visible" 
           :style="{ 
            'active': show,
            'font-size': PHPDATA.style.fontSize,
            color: PHPDATA.style.color,
            backgroundColor: PHPDATA.style.bg
           }">i am php v-show</div>
      <div style="color: red;" 
           :style="{ 
              visible: !PHPDATA.style.visible,
              backgroundColor: PHPDATA.bg.color
            }">我是测试服务端的style</div>

    <!-- 数据输出 -->
    <p class="php-name" v-text="PHPDATA.name.text"></p>
    <p class="component-name" v-text="name"></p>
    <div class="php-content" v-html="PHPDATA.article.content"></div>
    <div class="component-content" v-html="content"></div>
    <div class="mt-content">{{ content }}</div>

    <!-- 数据绑定 -->
    <input type="text" v-model="PHPDATA.name.model">
    <input type="number" :value="PHPDATA.number.model">
    <textarea :value="PHPDATA.textarea" id="" cols="30" rows="10"></textarea>

    <!-- 列表渲染 -->
    <ul>
      <li class="item" v-for="(item, key) in PHPDATA.arr">
        <div class="item-attr">{{ item.abc }} 12313</div>
        <span class="item-class" 
              :class="{ show: item.show }"
              :style="{ backgroundColor: item.background.color }">{{ item.name.aaa.bbb }}</span> 
        <span>下标是{{ key }}</span>
        <span>内容是{{ item.content }}</span>
        <span>{{ content }}</span>
        <span>我是辣子父组件的name属性{{ name }}</span>
      </li>
    </ul>

    <div class="media-list">
      <div v-for="(item, index) in PHPDATA.media.list">
        <a :href="item.link" :class="{ first: item === 0 }">
          <img :src="item.thumb">
          <span>{{ item.name }}</span>
        </a>
        <div>我要嵌套循环了</div>
        <div v-for="children in item.abc">
          <span>{{ name }}</span>
          <span>{{ children.name }}</span>
          <cdc></cdc>
          <div v-for="child in children.child">
            <span>{{ child.content }}</span>
            <span>{{ content }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 组件列表 -->
    <div class="component-list">
      <hello v-for="item in PHPDATA.his" :item="item.xxx">
        <div>我是插入hello的自定义插槽 {{ content }}</div>
      </hello>
    </div>
    
    <!-- 自定义组件和 slot -->
    <hello>
      <span>hello？？？ 23123</span>
      <div v-for="item in 10">{{ item }}</div>
      <slot>i am slot</slot>
    </hello>

    <!-- 全局组件 -->
    <global></global>

    <abc :thumbs="PHPDATA.thumbs"
         :title="PHPDATA.content.title" 
         :hahaha="'lkwhflwehrwh'"
         class="component-data"
         v-if="PHPDATA.ifelse">
      <span>23</span>
      <p>{{ PHPDATA.name }}</p>
      <p>{{ name }}</p>
      <cdc></cdc>
      <p slot="hello2">怎么还是？？？</p>
    </abc>

    <acc></acc>
    <cdc></cdc>

    <ul>
      <li class="item" v-for="(item, key) in PHPDATA.arr">
        <div class="item-attr">{{ item.abc }} 12313</div>
        <span class="item-class" 
              :class="{ show: item.show }"
              :style="{ backgroundColor: item.background.color }">{{ item.name.aaa.bbb }}</span> 
        <span>{{ key }}</span>
        <cdc></cdc>
      </li>
    </ul>

    <keep-alive>
      <cdc></cdc>
    </keep-alive>
    <transition>
      <span>transition</span>
    </transition>
    <transition-group tag="ul" class="local-transition-group" name="slide">
      <li v-for="item in 10" :key="item">local-transition-group{{ item }}</li>
    </transition-group>
    <transition-group tag="ul" class="php-transition-group" name="slide">
      <div v-for="item in PHPDATA.array" :key="item" trnasfer="group">
        <span>{{ item }}</span>
        <cdc></cdc>
        <div v-for="child in item.children">
          {{ child.index }}
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>

  // componennts（支持 .vue 结尾的路径）
  import Hello from './components/Hello.vue'

  // componennts（不支持）
  // import { Hello, Global } from './components'

  // libs（支持）
  const vue = require('vue')
  const a = require('./libs/a')
  const _a = require('./libs/a.js')
  // const __a = require('a.js')
  // const vue = require('some-libs')

  const PHPDATA = {
    active: true,
    name: '2222',
    content: '<p>我是content</p>'
  }
  export default {
    name: 'app',
    components: {
      // Hello,
      // hello: {
      //   template: '<div>hello</div>'
      // },
      cdc: {
        template: '<div>cdc</div>'
      },
      abc: {
        props: {
          name: {
            type: String,
            default: '哈哈'
          },
          thumbs: {},
          title: {
            type: Object,
            default() {
              return {
                abc: 123
              }
            }
          }
        },
        data() {
          return {
            text: '你好呀'
          }
        },
        template: `<div>
          {{ text }}
          {{ name }}
          {{ title.abc }}
          {{ thumbs.abs.xxx }}
          <slot></slot>
          <slot name="hello"></slot>
        </div>`
      }
    },
    data() {
      return {
        PHPDATA: PHPDATA,
        show: true,
        show1: false,
        isData: true,
        textColor: 'black',
        show2: false,
        title: 'i am title',
        name: 'i am component name',
        content: 'i am component content',
        img: {
          src: '../../../xxx.jpg'
        },
        appclass: ['aaa'],
        arrays: [
          { content: 'data1' },
          { content: 'data2' },
          { content: 'data3' }
        ]
      }
    },
    props: {
      test: {
        type: String,
        default: 'testprop'
      }
    },
    computed: {
      isShow() {
        return !this.show
      }
    },
    methods: {
      build(v) {
        return v
      }
    },
    mounted() {
      console.log('mounted', this)
    }
  }
</script>

<style>
  #app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
</style>

<config>
  {
    "components": {
      "global": "./components/Global.vue"
    }
  }
</config>
