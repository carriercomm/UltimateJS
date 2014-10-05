//////////////////
/**
 * Resource Manager
 */

var Resources = (function() {
	// private interface
	var assets = new Array();

	var images = new Array();
	var resolutions = new Object();
	
	// enum of strings of current language
	var strings = new Object();

	var currentResolution = null;
	var defaultResolution = null;

	var loadImage = function(src, callback) {
		var image = new Image();
		image.src = src;
		image.onload = callback;
		return image;
	};
	
	var indexed = {};
	var INDEX_SEED = 1;

	return { // public interface

		init : function() {
		},

		setResolution : function(resolutionName) {
			assert(resolutions[resolutionName], "Resolution " + resolutionName
					+ " not exists!");
			currentResolution = resolutionName;
		},
		// if there's no picture in current resolution
		// it will be looking in default
		setDefaultResolution : function(resolutionName) {
			assert(resolutions[resolutionName], "Resolution " + resolutionName
					+ " not exists!");
			defaultResolution = resolutionName;
		},

		addResolution : function(resolutionName, imagesFolder, isDefault) {
			assert(!resolutions[resolutionName], "Resolution " + resolutionName
					+ " already exists!");
			resolutions[resolutionName] = {
				folder : imagesFolder,
				images : new Object()
			};

			if (isDefault) {
				Resources.setResolution(resolutionName);
				Resources.setDefaultResolution(resolutionName);
			}
		},

		addImage : function(name, resolution) {
			var resArray;
			if (typeof (resolution) == "string") {
				resArray = new Array();
				resArray(resolution);
			} else if (typeof (resolution) == "array") {
				resArray = resolution;
			} else {
				// adding on available resolutions
				resArray = new Array();
				for ( var i in resolutions) {
					resArray.push(i);
				}
			}

			for ( var i = 0; i < resArray.length; i++) {
				var resolutionName = resArray[i];
				assert(resolutions[resolutionName], "Resolution "
						+ resolutionName + " not exists!");
				resolutions[resolutionName].images[name] = name;
			}
		},
		index : function(value, index) {
			if (!index)
				index = INDEX_SEED++;
			if (typeof (value) == "string" && !isNaN(index))
				indexed[value] = index;
			return index;
		},
		getIndex : function(value) {
			if (value && value.length && indexed[value])
				return indexed[value];
			else
				return -1;
		},
		getValueAtIndex : function(index) {
			if (!idNaN(index))
				$.each(indexed, function(src, idx){
					if (idx == index)
						return src;
				});
			return null;
		},
		// returnes string
		getString : function(stringId, rand) {
			if (strings[stringId]) {
			var str = strings[stringId];
				if(strings[stringId] instanceof Array){
					if (rand == false) {
						return strings[stringId];
					}
					var lbl = str[Math.floor(Math.random() * strings[stringId].length)];
					return lbl; 
				}
				return strings[stringId];
			} else {
				// console.error(stringId + " Not Found");
				return stringId;
			}

		},
		// loads json with set language
		setLanguage : function(language, array) {
			if ((array == true) && (typeof language == "object")) {
				strings = language;
			} else {
				if (language) {
					var fileName = "resources/localization/" + language + ".json";
					$['getJSON'](fileName, function(data) {
						strings = data;
					}).error(function () {
					    fileName = "resources/localization/" + "EN" + ".json";
					    $['getJSON'](fileName, function (data) {
					        strings = data;
					    })
					});
					Device.setStorageItem("language", language);
					if (Device.isNative())
					    Native.Screen.SetLanguage(language);
				} else
				    Resources.setLanguage(Device.getStorageItem("language", Device.isNative() ? Native.Screen.GetLanguage() : "EN"));
			}
		},
		// returns filename of an image for current resolution
		getImage : function(name, preload, preloadCallback) {
			var imageFilename = null;
			var image = null;

			// we are not using resolutions
			if (!currentResolution) {
				if (preload) {
					image = loadImage(name, preloadCallback);
				}
				imageFilename = name;
			} else {
				if (resolutions[currentResolution].images[name]) {
					imageFilename = resolutions[currentResolution].folder
							+ resolutions[currentResolution].images[name];
				}

				if (!imageFilename && defaultResolution
						&& defaultResolution != currentResolution
						&& resolutions[defaultResolution].images[name]) {
					imageFilename = resolutions[defaultResolution].folder
							+ resolutions[defaultResolution].images[name];
				}

				// when we are lazy to add all images by the Resource.addImage
				// function
				// we simply add current resolution folder to the requesting
				// name
				// supposing that we have all images for this resolution
				// available
				if (!name || name == 'undefined') {
					return null;
				} 
				
				if (!imageFilename) {
					imageFilename = resolutions[currentResolution].folder
							+ name;
				}

				if (preload) {
					image = loadImage(name, preloadCallback);
				}
			}

			if (preloadCallback && image && image.complete) {
				preloadCallback();
			}
			
			if(assets[name]){
//				console.log("IN ASS", assets[name].complete);
			}

			return imageFilename;
		},

		// return an asset preloaded
		getAsset : function(id) {
			if (assets[id]) {
				return assets[id];
			}
			return false;
		},
		
		getImageAsset : function(id, callback) {
			if (assets[id]) {
				if (callback)
					callback(assets[id]);
				return assets[id];
			}
			var obj = new Image();
			obj.src = Resources.getImage(id);
			obj.onload = function() {
				if (callback)
					callback(obj);
				assets[id] = obj;
			};
			return obj;
		},		
		// return an array of registered images filenames,
		// used for preloading
		getUsedImages : function() {
			var images = new Array();

			// walking through default resolution for all images
			// looking for images in current resolution
			for ( var i in resolutions[defaultResolution].images[i]) {
				if (resolutions[currentResolution].images[i]) {
					images.push(Resources.getImage(i));
				}
			}
			return images;
		},

		// "preloading" font by creating and destroying item with all fonts
		// classes
		preloadFonts : function(fontClasses) {
			for ( var i = 0; i < fontClasses.length; ++i) {
				$("#root")['append']("<div id='fontsPreload" + i
						+ "' style='opacity:0.1;font-size:1px'>.</div>");
				var testDiv = $("#fontsPreload" + i);
				testDiv['addClass'](fontClasses[i]);
				setTimeout(function() {
					testDiv.remove();
				}, 1000);
			}
		},

		// temporary borrowed from CraftyJS game engine
		// TODO rewrite
		loadMedia : function(data, oncomplete, onprogress, onerror) {
			
			var i = 0, l = data.length, current, obj, total = l, j = 0, ext;
			
			function onAssetLoad(isImageTypeAsset) {
				++j;
				// if progress callback, give information of assets loaded,
				// total and percent
				if (onprogress) {
					onprogress.call(this, {
						loaded : j,
						total : total,
						percent : (j / total * 100)
					});
				}
				if (j === total && oncomplete) {
					if (!Device.isNative())
						oncomplete();
					else {
						var texturesToLoad = null;
						var indexesToLoad = null;
						$.each(indexed, function(src, idx){
							if (texturesToLoad == null)
								texturesToLoad = src;
							else
								texturesToLoad += "," + src;
							if (indexesToLoad == null)
								indexesToLoad = idx + "";
							else
								indexesToLoad += "," + idx;
						});
						if (texturesToLoad != null) {
							ONASSETSLOADCALLBACKS[ASSETSLOADCALLBACK_SEED] = {};
							ONASSETSLOADCALLBACKS[ASSETSLOADCALLBACK_SEED].oncomplete = oncomplete;
							ONASSETSLOADCALLBACKS[ASSETSLOADCALLBACK_SEED].onprogress = onprogress;
							ONASSETSLOADCALLBACKS[ASSETSLOADCALLBACK_SEED].onerror = onerror;
							Native.Loader.LoadTextures(texturesToLoad, indexesToLoad, ASSETSLOADCALLBACK_SEED++);
						} else
							oncomplete();
					}
				}
			};

			// if there is an error, pass it in the callback (this will be
			// the object that didn't load)
			function onAssetError() {
				if (onerror) {
					onerror.call(this, {
						loaded : j,
						total : total,
						percent : (j / total * 100)
					});
				} else {
					j++;
					if (j === total) {
						if (oncomplete)
							oncomplete();
					}
				}
			};
			
			
			for (; i < l; ++i) {
				current = data[i];
				ext = current.substr(current.lastIndexOf('.') + 1)
						.toLowerCase();

				if ((ext === "mp3" || ext === "wav" || ext === "ogg" || ext === "mp4")) {
					obj = new Audio(current);
					// Chrome doesn't trigger onload on audio, see
					// http://code.google.com/p/chromium/issues/detail?id=77794
					if (navigator.userAgent.indexOf('Chrome') != -1)
						j++;
				} else if (ext === "jpg" || ext === "jpeg" || ext === "gif"
						|| ext === "png") {
					if (Device.isNative()) {
					    //						ImageTable[Resources.getImage(current)] = ImageTableSeed;
					    if (!indexed[Resources.getImage(current)]) {

					        var imageId = Resources.index(Resources.getImage(current));//Native.Loader.LoadImageIndexed(Resources.getImage(current));
					        if (imageId > 0) {
//					            Resources.index(Resources.getImage(current), imageId);
					            onAssetLoad(true);
					        } else
					            onAssetError();
					    } else
					        onAssetLoad(true);
					} else {
						obj = new Image();
						obj.src = Resources.getImage(current);
					}
				} else {
					total--;
					continue; // skip if not applicable
				}

				// add to global asset collection
				assets[current] = obj;

				if (!Device.isNative()) {
					obj.onload = onAssetLoad;
	
					// if there is an error, pass it in the callback (this will be
					// the object that didn't load)
					obj.onerror = onAssetError;
				}
			}
		}
	};
})();
