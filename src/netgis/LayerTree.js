"use strict";

var netgis = netgis || {};

/**
 * Layer Tree Module.
 * @param {JSON} config [LayerTree.Config]{@link netgis.LayerTree.Config}<br/>
 * [LayerTree.Folders]{@link netgis.LayerTree.Folders}<br/>
 * [Map.Layers]{@link netgis.Map.Layers}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.LayerTree = function( config )
{
	this.config = config;
	
	this.importFolder = null;
	
	this.initElements( config );
	this.initFolders();
	this.initConfig( config );
};

/**
 * Config Section "layertree"
 * @memberof netgis.LayerTree
 * @enum
 */
netgis.LayerTree.Config =
{
	/**
	 * Open panel at startup
	 * @type Boolean
	 */
	"open": false,
	
	/**
	 * Panel title
	 * @type String
	 */
	"title": "Layers",
	
	/**
	 * Enable drag-and-drop for layers and folders
	 * @type Boolean
	 */
	"draggable": false,
	
	/**
	 * Additional buttons below the tree. See {@link Commands} for special ID values.
	 * <ul>
	 *	<li>Button Items:<br/><code>{ "id": {String}, "title": {String} }</code></li>
	 * </ul>
	 * @type Array
	 */
	"buttons": []
};

/**
 * Config Section "folders"
 * <ul>
 *	<li>Layer Tree Folder Items:<br/><code>{ "id": {String}, "title": {String}, "parent": {String}, "radio": {Boolean} }</code></li>
 * </ul>
 * @memberof netgis.LayerTree
 * @type Array
 */
netgis.LayerTree.Folders =
[
];

netgis.LayerTree.prototype.initElements = function( config )
{
	var cfg = config[ "layertree" ];
	
	this.panel = new netgis.Panel( "Layers" );
	
	this.tree = new netgis.Tree( cfg[ "draggable" ] );
	this.tree.attachTo( this.panel.content );
	
	this.tree.container.addEventListener( netgis.Events.TREE_ITEM_CHANGE, this.onTreeItemChange.bind( this ) );
	this.tree.container.addEventListener( netgis.Events.TREE_ITEM_SLIDER_CHANGE, this.onTreeItemSliderChange.bind( this ) );
	this.tree.container.addEventListener( netgis.Events.TREE_ITEM_ORDER_CHANGE, this.onTreeItemOrderChange.bind( this ) );
	
	if ( cfg[ "draggable" ] === true )
	{
		this.panel.content.addEventListener( "dragover", this.onDragOver.bind( this ) );
		this.panel.content.addEventListener( "drop", this.onDragDrop.bind( this ) );
	}
};

netgis.LayerTree.prototype.initFolders = function()
{
	// TODO: store constant internal folder ids in enum
	
	this.editFolder = this.tree.addFolder( null, "edit-folder", "Zeichnung", true, true );

	this.tree.addCheckbox( this.editFolder, netgis.LayerID.EDITABLE, "Editierbar" );
	this.tree.setItemChecked( netgis.LayerID.EDITABLE, true );

	this.tree.addCheckbox( this.editFolder, netgis.LayerID.NON_EDITABLE, "Nicht-Editierbar" );
	this.tree.setItemChecked( netgis.LayerID.NON_EDITABLE, true );
	
	this.editFolder.classList.add( "netgis-hide" );
};

netgis.LayerTree.prototype.initConfig = function( config, prependFolders )
{
	var cfg = config[ "layertree" ];
	
	// Header
	if ( cfg && cfg[ "title" ] )
		this.panel.setTitle( cfg[ "title" ] );
	
	// TODO: layer tree folders/layers from array functions ?
	
	// Folders
	var configFolders = config[ "folders" ];
	
	var folders = {};
	
	if ( configFolders )
	{
		for ( var i = 0; i < configFolders.length; i++ )
		{
			var folder = configFolders[ i ];

			var item = this.tree.addFolder( null, folder[ "id" ], folder[ "title" ], prependFolders, false, folder[ "draggable" ] );
			folders[ folder[ "id" ] ] = item;

			if ( folder[ "open" ] === true ) this.tree.setFolderOpen( folder[ "id" ], true );
		}

		// Folder Parents
		for ( var i = 0; i < configFolders.length; i++ )
		{
			var folder = configFolders[ i ];
			var id = folder[ "id" ];
			var parent = folder[ "parent" ];

			if ( parent === -1 ) parent = null;
			if ( parent === "" ) parent = null;

			if ( ! parent ) continue;

			this.tree.setFolderParent( folders[ id ], folders[ parent ] );
		}
	}
	
	// Layers
	var configLayers = config[ "layers" ];
	
	if ( configLayers )
	{
		for ( var i = 0; i < configLayers.length; i++ )
		{
			var layer = configLayers[ i ];
			var folder = folders[ layer[ "folder" ] ] ? folders[ layer[ "folder" ] ] : null;

			var id = layer[ "id" ] ? layer[ "id" ] : i.toString();

			var radio = false;

			if ( folder )
			{
				for ( var j = 0; j < configFolders.length; j++ )
				{
					var configFolder = configFolders[ j ];

					if ( configFolder[ "id" ] === layer[ "folder" ] )
					{
						radio = configFolder[ "radio" ];
					}
				}
			}

			// Label Icons
			var title = layer[ "title" ];
			var icon = '<i class="fas fa-mouse-pointer" title="Ebene ist abfragbar"></i>';

			if ( config[ "layertree" ] && config[ "layertree" ][ "query_icon" ] ) icon = config[ "layertree" ][ "query_icon" ];

			if ( ( layer[ "query" ] === true || ( layer[ "query_url" ] && layer[ "query_url" ] !== "" ) ) && icon && icon !== "" )
			{
				var wrapper = '<span class="netgis-right">' + icon + "</span>";
				title += wrapper;
			}

			// Create Layer Item
			var item;
			
			var removable = layer[ "removable" ];

			if ( radio === true )
				item = this.tree.addRadioButton( folder, id, title, layer[ "active" ], this.createDefaultDetails( layer, true, removable ) );
			else
				item = this.tree.addCheckbox( folder, id, title, layer[ "active" ], false, this.createDefaultDetails( layer, true, removable ) );

			item.addEventListener( "contextmenu", this.onTreeItemMenu.bind( this ) );

			// Hidden Layers
			if ( layer[ "hidden" ] === true ) item.classList.add( "netgis-hide" );
		}
	}
	
	// Folder Checks
	this.tree.updateFolderChecks();
	
	// Buttons
	if ( cfg && cfg[ "buttons" ] )
	{
		var buttons = config[ "layertree" ][ "buttons" ];

		for ( var i = 0; i < buttons.length; i++ )
		{
			var button = buttons[ i ];
			this.tree.addButton( null, button[ "id" ], button[ "title" ], this.onTreeButtonClick.bind( this ) );
		}
	}
	
	// Initial State
	if ( cfg && cfg[ "open" ] === true ) this.panel.show();
};

netgis.LayerTree.prototype.attachTo = function( parent )
{
	this.panel.attachTo( parent );
	
	parent.addEventListener( netgis.Events.CLIENT_CONTEXT_RESPONSE, this.onClientContextResponse.bind( this ) );
	parent.addEventListener( netgis.Events.LAYERTREE_TOGGLE, this.onLayerTreeToggle.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_CREATE, this.onMapLayerCreate.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_TOGGLE, this.onMapLayerToggle.bind( this ) );
	parent.addEventListener( netgis.Events.IMPORT_LAYER_ACCEPT, this.onImportLayerAccept.bind( this ) );
	parent.addEventListener( netgis.Events.IMPORT_GEOPORTAL_SUBMIT, this.onImportGeoportalSubmit.bind( this ) );
	parent.addEventListener( netgis.Events.CONTEXTMENU_SLIDER_CHANGE, this.onContextMenuSliderChange.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_EDIT_LAYER_LOADED, this.onMapEditLayerChange.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_EDIT_LAYER_CHANGE, this.onMapEditLayerChange.bind( this ) );
};

netgis.LayerTree.prototype.createDefaultDetails = function( layer, opacitySlider, deleteButton )
{
	var details = [];
	
	if ( opacitySlider === true ) details.push( { title: "<i class='netgis-icon fas fa-eye-slash'></i> Transparenz:", type: "slider", val: layer[ "transparency" ] ? Math.round( layer[ "transparency" ] * 100 ) : 0 } );
	if ( deleteButton === true ) details.push( { title: "<i class='netgis-icon fas fa-times'></i> Entfernen", type: "button", callback: this.onTreeItemDeleteClick.bind( this ) } );
	
	return details;
};

netgis.LayerTree.prototype.onTreeItemChange = function( e )
{
	var params = e.detail;
	netgis.util.invoke( e.target, netgis.Events.MAP_LAYER_TOGGLE, { id: params.id, on: params.checked } );
};

netgis.LayerTree.prototype.onClientContextResponse = function( e )
{
	var params = e.detail;
	this.initConfig( params.context.config, true );
};

netgis.LayerTree.prototype.onLayerTreeToggle = function( e )
{
	this.panel.toggle();
};

netgis.LayerTree.prototype.onTreeButtonClick = function( e )
{
	var button = e.currentTarget;
	var id = button.getAttribute( "data-id" );
	
	// Buttons With Default Behaviors
	netgis.Client.handleCommand( button, id );
};

netgis.LayerTree.prototype.onMapLayerCreate = function( e )
{
	var params = e.detail;
	this.addLayerItem( params, null );
	
	// TODO: folder from params ?
};

netgis.LayerTree.prototype.onMapLayerToggle = function( e )
{
	var params = e.detail;
	
	this.tree.setItemChecked( params.id, params.on, true );
	this.tree.updateFolderChecks();
};

netgis.LayerTree.prototype.onImportLayerAccept = function( e )
{
	var params = e.detail;
	var layer = params;
	
	if ( ! this.importFolder )
	{
		this.importFolder = this.tree.addFolder( null, "_import", "Import", true, false );
	}
	
	this.addLayerItem( layer, this.importFolder );
	
	this.tree.updateFolderChecks();
};

netgis.LayerTree.prototype.addLayerItem = function( params, folder )
{
	// Label Icons
	var title = params[ "title" ];
	var icon = '<i class="fas fa-mouse-pointer" title="Ebene ist abfragbar"></i>';

	if ( config[ "layertree" ] && config[ "layertree" ][ "query_icon" ] ) icon = config[ "layertree" ][ "query_icon" ];

	if ( ( params[ "query" ] === true || ( params[ "query_url" ] && params[ "query_url" ] !== "" ) ) && icon && icon !== "" )
	{
		var wrapper = '<span class="netgis-right">' + icon + "</span>";
		title += wrapper;
	}
	
	// TODO: refactor layer item creation with init config, import handlers
	
	var item = this.tree.addCheckbox( folder, params[ "id" ], title, true, true, this.createDefaultDetails( params, true, true ) );
	
	item.addEventListener( "contextmenu", this.onTreeItemMenu.bind( this ) );
};

netgis.LayerTree.prototype.onImportGeoportalSubmit = function( e )
{
	var params = e.detail;
	
	var fid = params.folder.id;
	var folder = this.tree.getFolder( fid );
	
	if ( ! folder )
		folder = this.tree.addFolder( null, fid, params.folder.title, true, false );
	
	var id = params.layer.id;
	
	var config =
	{
		id: id,
		folder: fid,
		title: params.layer.title,
		active: true,
		type: netgis.LayerTypes.WMS,
		url: params.layer.url,
		name: params.layer.name,
		order: 10000,
		transparency: 0.0
	};
	
	this.config[ "layers" ].push( config );
	
	// TODO: refactor layer item creation with init config, import handlers
	
	this.tree.addCheckbox( folder, id, params.layer.title, false, false, this.createDefaultDetails( config, true, true ) );
	this.tree.setItemChecked( id, true, false );
};

netgis.LayerTree.prototype.onTreeItemMenu = function( e )
{
	e.preventDefault();
	
	/*
	var x = e.clientX;
	var y = e.clientY;
	
	var input = e.currentTarget.getElementsByTagName( "input" )[ 0 ];
	var id = input.getAttribute( "data-id" );
	
	var transparency = 0.0;
	var configLayers = this.config[ "layers" ];
	
	for ( var i = 0; i < configLayers.length; i++ )
	{
		var layer = configLayers[ i ];
		
		if ( layer[ "id" ] === id )
		{
			transparency = layer[ "transparency" ] ? layer[ "transparency" ] : 0.0;
			break;
		}
	}
	
	var items =
	[
		{ id: "layer_trans_" + id, title: "Transparenz", type: "slider", val: Math.round( transparency * 100 ), min: 0, max: 100 }
	];
	
	netgis.util.invoke( e.currentTarget, netgis.Events.CONTEXTMENU_SHOW, { x: x, y: y, items: items } );
	*/
	
	return false;
};

netgis.LayerTree.prototype.onContextMenuSliderChange = function( e )
{
	var params = e.detail;
	var t = params.val * 0.01;
	
	// Parse Layer ID
	var id = null;
	
	if ( params.id.indexOf( "layer_trans_" ) === 0 )
	{
		id = params.id.split( "layer_trans_" )[ 1 ];
	}
	
	// Update Config
	var configLayers = this.config[ "layers" ];
	
	for ( var i = 0; i < configLayers.length; i++ )
	{
		var layer = configLayers[ i ];
		
		if ( layer[ "id" ] === id )
		{
			layer[ "transparency" ] = t;
			break;
		}
	}
	
	netgis.util.invoke( this.tree.container, netgis.Events.MAP_LAYER_TRANSPARENCY, { id: id, transparency: t } );
};

netgis.LayerTree.prototype.onTreeItemSliderChange = function( e )
{
	var params = e.detail;
	var id = params.id;
	var t = params.val * 0.01;
	
	// Update Config
	var configLayers = this.config[ "layers" ];
	
	for ( var i = 0; i < configLayers.length; i++ )
	{
		var layer = configLayers[ i ];
		
		if ( layer[ "id" ] === id )
		{
			layer[ "transparency" ] = t;
			break;
		}
	}
	
	netgis.util.invoke( this.tree.container, netgis.Events.MAP_LAYER_TRANSPARENCY, { id: id, transparency: t } );
};

netgis.LayerTree.prototype.onTreeItemOrderChange = function( e )
{
	var params = e.detail;
	var items = params.items;
	
	var layers = this.config[ "layers" ];
	var order = items.length;
	
	for ( var i = 0; i < items.length; i++ )
	{
		var item = items[ i ];
		var input = item.getElementsByTagName( "input" )[ 0 ];
		var id = input.getAttribute( "data-id" );
		
		for ( var j = 0; j < layers.length; j++ )
		{
			var layer = layers[ j ];
			
			if ( layer[ "id" ] !== id ) continue;
			
			layer[ "order" ] = order;
			
			netgis.util.invoke( this.tree.container, netgis.Events.MAP_LAYER_ORDER, { id: id, order: order } );
		}
		
		order--;
	}
};

netgis.LayerTree.prototype.onTreeItemDeleteClick = function( e )
{
	var button = e.currentTarget;
	var label = button.parentNode;
	var details = label.parentNode.parentNode;
	var item = details.parentNode;
	var check = item.getElementsByTagName( "input" )[ 0 ];
	var id = check .getAttribute( "data-id" );
	
	netgis.util.invoke( this.tree.container, netgis.Events.MAP_LAYER_DELETE, { id: id } );
	
	this.tree.removeItem( id );
};

netgis.LayerTree.prototype.onMapEditLayerChange = function( e )
{
	this.editFolder.classList.remove( "netgis-hide" );
};

netgis.LayerTree.prototype.onDragOver = function( e )
{
	e.preventDefault();
};

netgis.LayerTree.prototype.onDragDrop = function( e )
{
	var li = this.tree.dragElement;
	
	if ( li.nodeName.toLowerCase() === "summary" ) li = li.parentNode.parentNode;
	
	li.parentNode.removeChild( li );
	
	if ( this.tree.container.childNodes.length > 0 )
		this.tree.container.insertBefore( li, this.tree.container.childNodes[ 0 ] );
	else
		this.tree.container.appendChild( li );
	
	netgis.util.invoke( this.tree.container, netgis.Events.TREE_ITEM_ORDER_CHANGE, { items: this.tree.container.getElementsByClassName( "netgis-item" ) } );
	
	// TODO: put this into tree module to also handle on parent drops consistently ?
};