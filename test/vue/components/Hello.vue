<template>
	<div>
		<div>i'm hello</div>
		<slot></slot>
		<p>{{ item.name }}</p>
	</div>
</template>

<script>
	export default {
		name: 'hello',
		props: {
			item: {
				default() {
					return 'gogoogo'
				}
			}
		}
	}
</script>