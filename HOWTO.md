# NetGIS Client - How To...

## Client Integration
- [Migrate from the old Legacy Client (mobilemap2)](#migrate-from-the-old-legacy-client)
- [Load a config JSON from a URL](#load-a-config-json-from-a-url)
- [Include the client in a web form for input submission](#include-the-client-in-a-web-form-for-input-submission)
- [Load a WMC document at startup](#load-a-wmc-document-at-startup)

## User Interface
- [Add a web link to the top menu bar](#add-a-web-link-to-the-top-menu-bar)
- [Add dropdown menus to the top menu bar](#add-dropdown-menus-to-the-top-menu-bar)
- [Add a menu with selectable scales](#add-a-menu-with-selectable-scales)
- [Add nested folders to the layer tree](#add-nested-folders-to-the-layer-tree)
- [Create a search input with zoomable results](#create-a-search-input-with-zoomable-results)

## Map & Layers
- [Add a dynamic scalebar to the map](#add-a-dynamic-scalebar-to-the-map)
- [Change the main map projection](#change-the-main-map-projection)
- [Add a WMS layer](#add-a-wms-layer)
- [Add a password protected WMS/WFS layer](#add-a-password-protected-wmswfs-layer)
- [Add a geolocation button to the map controls](#add-a-geolocation-button-to-the-map-controls)
- [Enable feature info queries on a WMS layer](#enable-feature-info-queries-on-a-wms-layer)
- [Add an invisible layer for data queries](#add-an-invisible-layer-for-data-queries)
- [Enable vector feature edit tools](#enable-vector-feature-edit-tools)

### Migrate from the old Legacy Client

If you want to migrate from the old legacy Client (e.g. "mobilemap2"), the easiest way is probably to have your old ```netgis.config``` present
(could also be loaded directly from ```/mobilemap2/scripts/netgis/config.js```):

```js
netgis.config = 
{
	MAP_CONTAINER_ID:		"map-container",

	// etc.
};
```

And then just create a new Client Instance without any parameters:

```js
var client = new netgis.Client();
```

The client will then try to auto load the old config format, which result in roughly the same Client setup:

![Screenshot](https://sebastianpauli.net/netgis/demo/howto_legacy.jpg)

Comparison Links (same config):
- Old Client: [https://www.geoportal.rlp.de/mapbender/extensions/mobilemap2/index.html?wmc_id=27581](https://www.geoportal.rlp.de/mapbender/extensions/mobilemap2/index.html?wmc_id=27581)
- New Client: [https://sebastianpauli.net/netgis/demo/geoportal_legacy.html?wmc_id=27581](https://sebastianpauli.net/netgis/demo/geoportal_legacy.html?wmc_id=27581)

You can find a working example in the [Demo](https://github.com/sebastianpauli/netgis-client/blob/main/demo/geoportal_legacy.html) section.

### Load a config JSON from a URL

A config JSON file can be loaded from an external URL. Just pass a valid address as a string to the client config parameter like this:
```js
var client = new netgis.Client( "container", "https://sebastianpauli.net/netgis/demo/test_config_lanis.json" );
```

### Include the client in a web form for input submission

Make sure you have the client configured for [vector feature editing](#enable-vector-feature-edit-tools).
The client will then automatically store all edited features as a GeoJSON string in an input element.
There are two ways to configure this storage element:
1. If the element already exists somewhere in your HTML document, you can pass its id in the edit tools config section:
```html
<div id="container" style="height: 400px"></div>

<form method="POST">
	<input type="text" id="my-edit-features" name="edit_features" />
</form>
```
```js
"tools":
{
	"output_id": "my-edit-features"
}
```
2. If the element with the given output id does not exist (or none is specified) 
the client will automatically create a hidden storage element as child of the client container (with the class "netgis-storage" added), 
which could also be part of a form:
```html
<form method="POST">
	<div id="container" style="height: 400px"></div>
</form>
```
```js
console.info( "Output GeoJSON:", form.getElementsByClassName( "netgis-storage" )[ 0 ].value );
```
For the second approach you could also configure a new id and/or input name for the created element:
```js
"tools":
{
	"output_id": "my-edit-features",
	"output_name": "edit_features"
}
```

Either way if the form is submitted, the GeoJSON value stored in the input will be send with the post data (e.g. as ```$_POST[ "edit_features" ]```).
You can also easily access the storage element from your JavaScript as a member of the client instance like this:
```js
console.info( "Output GeoJSON:", client.output.value );
```

### Load a WMC document at startup

To load a Web Map Context document, you need to add the wmc section to the config with at least the service URL including an ```{id}``` placeholder.
The id to insert into the URL can then come either from the config like this:

```js
"wmc":
{
	"url": "./proxy.php?https://www.geoportal.rlp.de/mapbender/php/mod_exportWmc2Json.php?confFileName=mobilemap2&epsg=25832&withHierarchy=1&wmc_id={id}",
	"id": 14971
}
```

Or from a URL parameter:

```
geoportal.html?wmc_id=14971
```

### Add a web link to the top menu bar

Just add an entry to the menu sections items list with a URL parameter and it will act as a link:
```js
"menu":
{
	"items":
	[
		{ "id": "my-link", "title": "<i class='fas fa-link'></i><span>Link</span>", "url": "http://www.example.com" }
	]
}
```

### Add dropdown menus to the top menu bar

If a menu item itself has no id but an items parameter, it will act as a dropdown menu:
```js
"menu":
{
	"items":
	[
		{
			"title": "<i class='fas fa-caret-down'></i><span>Dropdown</span>",
			"items":
			[
				{ "id": "sub-item-1", "title": "<i class='fas fa-caret-right'></i><span>Item 1</span>" },
				{ "id": "sub-item-2", "title": "<i class='fas fa-caret-right'></i><span>Item 2</span>" },
				{ "id": "sub-item-3", "title": "<i class='fas fa-caret-right'></i><span>Item 3</span>" }
			]
		}
	]
}
```

### Add a menu with selectable zoom scales

To achieve this you could add a dropdown to the menu section with the scale items.
The easiest way to add selectable scales is to add sub items manually with the special id ```zoom_scale``` and a scale value as title:

```js
"menu":
{
	"items":
	[
		{
			"title": "<i class='fas fa-ruler-horizontal'></i><span>Scale</span>",
			"items":
			[
				{ "id": "zoom_scale", "title": "1:500" },
				{ "id": "zoom_scale", "title": "1:1000" },
				{ "id": "zoom_scale", "title": "1:10000" }
			]
		}
	]
}
```

If you do not want to create the scale entries manually, you can also add a scales array to the map section:

```js
"map":
{
	"scales": [ 500, 1000, 5000, 10000, 100000 ]
}
```

And if you then leave the sub items for the dropdown menu empty and give it the special id ```scales``` 
then the client will automatically populate the menu with the configured map scales:

```js
"menu":
{
	"items":
	[
		{ "id": "scales", "title": "<i class='fas fa-ruler-horizontal'></i><span>Scale</span>", "items": [] }
	]
}
```

### Add nested folders to the layer tree

First add a "folders" section to the configuration:

```js
"folders":
[
]
```

Then you can add folder items to it:

```js
"folders":
[
	{ "id": "my-folder", "title": "My Folder" },
	{ "id": "my-folder-2", "title": "My Second Folder" }
]
```

To add layers to your folders just set the folder property of layer to the folder id:

```js
{ "id": "child_layer", "folder": "my-folder-2", "type": "OSM", "title": "Open Street Map" }
```

To nest folders as sub folders you can set their ```parent``` property to the id of another folder:

```js
{ "id": "my-folder-2", "parent": "my-folder", "title": "My Second Folder" }
```

### Create a search input with zoomable results

First enable the ```searchplace``` module:

```js
"modules":
{
	"searchplace": true
}
```

You should now see a search bar at the top of the map view, but it won't do anything useful yet.
To enable dynamic searching you need to set the URL (with a ```{query}``` placeholder) to a search API in the searchplace config section.
Here is an example to a Geoportal endpoint:

```js
"searchplace":
{
	"url": "https://www.geoportal.rlp.de/mapbender/geoportal/gaz_geom_mobile.php?outputFormat=json&resultTarget=web&searchEPSG=4326&maxResults=5&maxRows=5&featureClass=P&style=full&searchText={query}&name_startsWith={query}"
}
```

As of this writing the client mainly understands this response JSON format (more to come):

```js
{
	"geonames":
	[
		{ "title": "Trier (Ort)", "category": "haus", "minx": "6.5566040767685", "miny": "49.700494985294", "maxx": "6.7305812957277", "maxy": "49.835273380968" }
	]
}
```

### Add a dynamic scalebar to the map

Just set the ```scalebar``` option in the map section to true:

```js
"map":
{
	"scalebar": true
}
```

Now a dynamic scalebar should appear at the bottom right of the map view.
If you also provide a list of scales in your map section, the scalebar will also act as a clickable scale selector.

### Change the main map projection

The common web projections EPSG:4326 and EPSG:3857 are always included in the client.
If you define your own projections make sure to include the PROJ4JS library in your HTML:

```html
<script type="text/javascript" src="/libs/proj4js/2.6.0/proj4.js"></script>
```

Then create a ```projections``` section in your configuration and add PROJ4 definitions as needed:

```js
"projections":
[
	[ "EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs" ],
	[ "EPSG:25833",b"+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs" ]
]
```

Now you can set the main projection of your map view to a projection id like this:

```js
"map":
{
	"projection": "EPSG:25832"
}
```

### Add a WMS layer

Create a layer item of type ```WMS``` to your ```layers``` config section:

```js
"layers":
[
	{ "id": "top", "type": "WMS", "title": "TopPlusOpen", "attribution": "BKG", "url": "https://sgx.geodatenzentrum.de/wms_topplus_open?", "name": "web" }
]
```

### Add a password protected WMS/WFS layer

Just add ```username``` and ```password``` properties to a WMS or WFS layer that is basic auth protected:

```js
{ "id": "my_wms", "type": "WMS", "title": "Flurstücke", "url": "https://example.com/protected-wms", "name": "layername", "username": "username", "password": "password" }
```

### Add a geolocation button to the map controls

First enable the ```geolocation``` module:

```js
"modules":
{
	"geolocation": true
}
```

Then you can add a geolocation button to your map controls section:

```js
"controls":
{
	"buttons":
	[
		{ "id": "geolocation", "icon": "<i class='fas fa-crosshairs'></i>", "title": "Device Location" }
	]
}
```

This will then show a geolocation settings popup if the user clicks on it.

### Enable feature info queries on a WMS layer

First enable the ```info``` module:

```js
"modules":
{
	"info": true
}
```

Then you can add a ```query_url``` parameter to your layer with special placeholders (```bbox, proj, width, height, px, py```) like this:

```js
{ "id": "topo", "type": "WMS", "title": "Topo WMS", "url": "https://ows.mundialis.de/services/service?", "name": "TOPO-WMS", "query_url": "https://ows.mundialis.de/services/service?service=WMS&version=1.1.0&request=GetFeatureInfo&styles=&layers=TOPO-WMS&query_layers=TOPO-WMS&bbox={bbox}&srs={proj}&width={width}&height={height}&x={px}&y={py}" }
```

Now the layer should be marked as queryable in the layer tree (pointer icon) and it a info popup should open after clicking on the map.

### Add an invisible layer for data queries

Make sure you have the ```info``` module activated:

```js
"modules":
{
	"info": true
}
```

Then as with the WMS info queries you can also add a query URL parameter to a layer of type ```HIDDEN``` so that it won't be visible on the map or the layer tree.
For example such a hidden layer could be used to make altitude queries for each click based on a Digital Elevation Model like this:

```js
{ "id": "dem_hidden", "title": "DEM", "hidden": true, "active": true, "type": "HIDDEN", "query": true, "query_url": "https://www.geoportal.rlp.de/mapbender/extensions/mobilemap2/scripts/heightRequest.php?&lang=de&coord={x},{y}" }
```

The URL placeholders ```x``` and ```y``` will be replaced by the click coordinates for each request.

### Enable vector feature edit tools

First activate edit mode by setting the client to editable.
Either set the config parameter in the tools section:

```js
"tools":
{
	"editable": true
}
```

Or set the data-editable attribute on the container element like this:

```html
<div id="container" data-editable="true"></div>
```

Now your client should be in edit mode. You now need to provide some vector feature editing tools.
One of the easiest ways to do this is to add drawing tool buttons to the top menu.
In this example we add a button to go into polygon drawing mode and one to switch back to the default viewing/panning mode:

```js
"menu":
{
	"items":
	[
		{ "id": "view", "title": "<i class='fas fa-hand-paper'></i><span>View</span>" },
		{ "id": "draw_polygons", "title": "<i class='fas fa-pen'></i><span>Draw</span>" }
	]
}
```

Note the special id values as specified in the [Commands](https://sebastianpauli.net/netgis/docs/global.html#Commands) section.
