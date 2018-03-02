
const path = require('path')
const VueToAny = require('../src')

// 实例化
const vueToAny = new VueToAny({
	debug: true,
	progress: true,
	entryFile: path.join(__dirname, '../../../', '/src/pc/pages/index/', 'page.vue'),
	outFile: path.join(__dirname, '../../../', '/src/pc/pages/index/', 'page.php')
	// entryFile: path.join(__dirname, '/vue/', 'Test.vue'),
  // outFile: path.join(__dirname, '/out/', 'test.php')
})

console.log(vueToAny)

// 执行转换输出转换
vueToAny.generate()
