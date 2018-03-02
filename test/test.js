
const path = require('path')
const VueToAny = require('../src')

// 实例化
const vueToAny = new VueToAny({
	debug: false,
	progress: true,
	entryFile: path.join(__dirname, '/vue/', 'Test.vue'),
  outFile: path.join(__dirname, '/out/', 'test.php')
})

// console.log(vueToAny)

// 执行转换输出转换
vueToAny.generate()
