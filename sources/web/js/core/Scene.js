/**
 * Scene - Container for VisualEntities
 */

function Scene() {
	Scene.parent.constructor.call(this);
};

Scene.inheritsFrom(VisualEntity);
Scene.prototype.className = "Scene";

Scene.prototype.createInstance = function(params) {
	var entity = new Scene();
	entity.init(params);
	return entity;
};

entityFactory.addClass(Scene);

Scene.prototype.init = function(params) {
	Scene.parent.init.call(this, params);
};

Scene.prototype.createVisual = function(noChildAttach) {
	var params = this.params;
	var visual = guiFactory.createObject("GuiScene", {
		parent : this.guiParent,
		style : "scene",
		x : params['x'],
		y : params['y'],
		width : params['width'],
		height : params['height'],
		background : params['background']
	});

	var visualInfo = {};
	visualInfo.visual = visual;
	this.addVisual(null, visualInfo);

	var that = this;
	this.children = this.children ? this.children : new Array();
	
	if (!Screen.isDOMForced() && params['canvas']) {
		this.canvas = guiFactory.createObject("GuiCanvas", {
			"parent" : visualInfo.visual,
			"style": "canvasSurface",
			"z": 10,
			"wrap": false
		});
		visualInfo.visual.addGui(this.canvas, "canvasSurface");
	}
	
	if(!noChildAttach){
		$['each'](this.children, function(id, val) {
			that.attachChildVisual(val);
		});
	}
};

Scene.prototype.attachChildVisual = function(child) {
	if (child.attachToGui) {
		child.attachToGui(this.getVisual(), true);
	}
};

Scene.prototype.destroy = function() {
	if (this.canvas)
		Account.instance.removeRenderEntity(this.canvas);
	Scene.parent.destroy.call(this);
};

Scene.prototype.move = function(dx, dy, parallaxDepth) {
	var visual = this.getVisual();
	if (parallaxDepth) {
		$['each'](visual.backgrounds, function(i, back) {
			if (!back)
				return;
			if (i != visual.backgrounds.length - 1) {
				visual.setBackgroundPosition(visual.backgrounds[i].left
						- (dx * (i / parallaxDepth)), visual.backgrounds[i].top
						- (dy * (i / parallaxDepth)), i);
			}
		});
	}

	visual.move(dx, dy);
};

Scene.prototype.getCanvas = function() {
	return this.canvas;
};
