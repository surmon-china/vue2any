<div id="app" show="true123213" class="app aaa"><img src="./assets/logo.png" class="local-img">
	<img src="../../../xxx.jpg" class="component-img">
	<img src="<?php echo $PHPDATA['img']['src']; ?>" alt="<?php echo $PHPDATA['img']['alt']; ?>" class="php-img">
	<div id="<?php echo $PHPDATA['div']['id']; ?>" title="i am title" class="php-class"></div>
	<p class="component-v-if">i am component name</p>
	<?php if($PHPDATA['tab'] === 1): ?>
	<p class="php-v-if"><?php echo strip_tags($PHPDATA['name']); ?></p>
<?php elseif($PHPDATA['showtab']): ?>
	<p class="php-v-else">i am component name213123</p>
<?php else: ?>
	<p>else hahah</p><?php endif; ?>
	<?php if(!$PHPDATA['style']['if']): ?>
	<div>我是测试服务端的 v-if</div>
<?php else: ?>
	<div>我是测试服务端的 v-else</div><?php endif; ?>
	<p class="component-v-else">else else</p>
	<div class="test-class-object <?php echo !$PHPDATA['disabled'] ? 'disabled' : ''; ?> <?php echo $PHPDATA['active'] ? 'active' : ''; ?> hover">php - class - object</div>
	<div class="test-class-array <?php if(!$PHPDATA['active']): ?>active<?php else: ?>noactive<?php endif; ?> gogoshow class-test">php - class - array</div>
	<div class="component-v-show" style="active:true;color:black;background-color:true;display:none;">i am component v-show</div>
	<div class="php-v-show" style="active:true;font-size:<?php echo $PHPDATA['style']['fontSize']; ?>;color:<?php echo $PHPDATA['style']['color']; ?>;background-color:<?php echo $PHPDATA['style']['bg']; ?>;display:<?php if($PHPDATA['style']['visible']): ?><?php else: ?>none<?php endif; ?>;">i am php v-show</div>
	<div style="color:red;visible:<?php echo !$PHPDATA['style']['visible']; ?>;background-color:<?php echo $PHPDATA['bg']['color']; ?>;">我是测试服务端的style</div>
	<p class="php-name"><?php echo strip_tags($PHPDATA['name']['text']); ?></p>
	<p class="component-name">i am component name</p>
	<div class="php-content"><?php echo $PHPDATA['article']['content']; ?></div>
	<div class="component-content">i am component content</div>
	<div class="mt-content">i am component content</div>
	<input type="text" value="<?php echo $PHPDATA['name']['model']; ?>">
	<input type="number" value="<?php echo $PHPDATA['number']['model']; ?>">
	<textarea id="id" cols="30" rows="10" value="<?php echo $PHPDATA['textarea']; ?>"></textarea>
	<ul><?php foreach ($PHPDATA['arr'] as $key => $item):?>
		<li class="item">
			<div class="item-attr"><?php echo strip_tags($item['abc']); ?>
				12313</div>
			<span class="item-class <?php echo $item['show'] ? 'show' : ''; ?>" style="background-color:<?php echo $item['background']['color']; ?>;"><?php echo strip_tags($item['name']['aaa']['bbb']); ?></span>
			<span>下标是<?php echo strip_tags($key); ?></span>
			<span>内容是<?php echo strip_tags($item['content']); ?></span>
			<span>i am component content</span>
			<span>我是辣子父组件的name属性i am component name</span></li><?php endforeach; ?></ul>
	<div class="media-list"><?php foreach ($PHPDATA['media']['list'] as $index => $item):?>
		<div>
			<a href="<?php echo $item['link']; ?>" class=" <?php echo $item === 0 ? 'first' : ''; ?>"><img src="<?php echo $item['thumb']; ?>">
				<span><?php echo strip_tags($item['name']); ?></span></a>
			<div>我要嵌套循环了</div>
			<?php foreach ($item['abc'] as $children):?>
			<div>
				<span>i am component name</span>
				<span><?php echo strip_tags($children['name']); ?></span>
				<div>cdc</div>
				<?php foreach ($children['child'] as $child):?>
				<div>
					<span><?php echo strip_tags($child['content']); ?></span>
					<span>i am component content</span></div><?php endforeach; ?></div><?php endforeach; ?></div><?php endforeach; ?></div>
	<div class="component-list"><?php foreach ($PHPDATA['his'] as $item):?>
		<div>
			<div>i'm hello</div>
			<div>我是插入hello的自定义插槽 i am component content</div>
			<p><?php echo $item['xxx']['name']; ?></p>
		</div><?php endforeach; ?></div>
	<div>
		<div>i'm hello</div>
		<span>hello？？？ 23123</span>
		<div>1</div>
		<div>2</div>
		<div>3</div>
		<div>4</div>
		<div>5</div>
		<div>6</div>
		<div>7</div>
		<div>8</div>
		<div>9</div>
		<div>10</div>
		i am slot
		<p></p>
	</div>
	<div>
		<div>i'm a Global Component hahhahahha</div>
		<div>i'm a Global image Component
			<?php echo $PHPDATA['imgsrc']; ?></div>
	</div>
<?php if($PHPDATA['ifelse']): ?>
	<div hahaha="lkwhflwehrwh" class="component-data">
		你好呀 哈哈
		<?php echo $PHPDATA['content']['title']['abc']; ?>
		<?php echo $PHPDATA['thumbs']['abs']['xxx']; ?>
		<span>23</span>
		<p><?php echo $PHPDATA['name']; ?></p>
		<p>i am component name</p>
		<div>cdc</div>
	</div>
<?php else: ?><?php endif; ?>
	<div>cdc</div>
	<ul><?php foreach ($PHPDATA['arr'] as $key => $item):?>
		<li class="item">
			<div class="item-attr"><?php echo strip_tags($item['abc']); ?>
				12313</div>
			<span class="item-class <?php echo $item['show'] ? 'show' : ''; ?>" style="background-color:<?php echo $item['background']['color']; ?>;"><?php echo strip_tags($item['name']['aaa']['bbb']); ?></span>
			<span><?php echo strip_tags($key); ?></span>
			<div>cdc</div>
		</li><?php endforeach; ?></ul>
	<div>cdc</div>
	<span>transition</span>
	<ul class="local-transition-group">
		<li>local-transition-group1</li>
		<li>local-transition-group2</li>
		<li>local-transition-group3</li>
		<li>local-transition-group4</li>
		<li>local-transition-group5</li>
		<li>local-transition-group6</li>
		<li>local-transition-group7</li>
		<li>local-transition-group8</li>
		<li>local-transition-group9</li>
		<li>local-transition-group10</li>
	</ul>
	<ul class="php-transition-group">
		<?php foreach ($PHPDATA['array'] as $item):?>
		<div trnasfer="group">
			<span><?php echo $item; ?></span>
			<div>cdc</div>
			<?php foreach ($item['children'] as $child):?>
			<div>
				<?php echo $child['index']; ?>
			</div><?php endforeach; ?></div>
		<?php endforeach; ?>
	</ul>
</div>