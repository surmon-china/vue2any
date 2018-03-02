
const path = require('path')
const VueToAny = require('../src')

// 实例化
const vueToAny = new VueToAny({
	debug: true,
	progress: true,
	entryFile: path.join(__dirname, '../../../', '/src/mobile/pages/user-x/', 'page.vue'),
	outFile: path.join(__dirname, '../../../', '/src/mobile/pages/user-x/', 'page.php')
	// entryFile: path.join(__dirname, '/vue/', 'Dev.vue'),
  // outFile: path.join(__dirname, '/out/', 'dev.php')
})

console.clear()
console.log(vueToAny)

// 执行转换输出转换
vueToAny.generate()

setTimeout(() => {}, 10000000)
