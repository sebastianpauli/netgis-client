"use strict";

var netgis = netgis || {};

//TODO: refactor common panel class
//TODO: refactor common tree view class

netgis.LayerTree = function()
{
	this.client = null;
	this.root = null;
	this.list = null;
	this.folderImport = null;
	this.folderDraw = null;
};

netgis.LayerTree.prototype.load = function()
{
	this.root = document.createElement( "section" );
	this.root.className = "netgis-layer-list netgis-dialog netgis-shadow netgis-hide";
	
	this.list = document.createElement( "ul" );
	this.list.className = "root";
	this.root.appendChild( this.list );
	
	this.initDefaultFolders();
	
	this.tools = document.createElement( "div" );
	this.tools.className = "netgis-layer-tools";
	this.tools.innerHTML = "<hr/>";
	this.root.appendChild( this.tools );
	
	this.buttonAddService = document.createElement( "button" );
	this.buttonAddService.className = "netgis-text-primary netgis-hover-primary";
	this.buttonAddService.innerHTML = "<i class='fas fa-folder-plus'></i> Dienst hinzufügen";
	this.buttonAddService.setAttribute( "type", "button" );
	this.buttonAddService.addEventListener( "click", this.onAddServiceClick.bind( this ) );
	this.tools.appendChild( this.buttonAddService );
	
	this.client.root.appendChild( this.root );
	
	this.client.on( netgis.Events.CONTEXT_UPDATE, this.onContextUpdate.bind( this ) );
	this.client.on( netgis.Events.LAYER_LIST_TOGGLE, this.onLayerListToggle.bind( this ) );
	this.client.on( netgis.Events.LAYER_CREATED, this.onLayerCreated.bind( this ) );
	this.client.on( netgis.Events.EDIT_FEATURES_CHANGE, this.onEditFeaturesChange.bind( this ) );
	this.client.on( netgis.Events.ADD_SERVICE_WMS, this.onAddServiceWMS.bind( this ) );
	this.client.on( netgis.Events.ADD_SERVICE_WFS, this.onAddServiceWFS.bind( this ) );
	
	//TODO: kind of hack to hide if parcel search open
	this.client.on( netgis.Events.SET_MODE, this.onSetMode.bind( this ) );
};

netgis.LayerTree.prototype.initDefaultFolders = function()
{
	this.folderDraw = this.createFolder( "Zeichnung" );
	this.folderDraw.classList.add( "netgis-hide" );
	this.list.appendChild( this.folderDraw );
	
	this.folderImport = this.createFolder( "Importierte Ebenen" );
	this.folderImport.classList.add( "netgis-hide" );
	this.list.appendChild( this.folderImport );
	
	this.folderServices = this.createFolder( "Eigene Dienste" );
	this.folderServices.classList.add( "netgis-hide" );
	this.list.appendChild( this.folderServices );
};

netgis.LayerTree.prototype.clearAll = function()
{
	this.list.innerHTML = "";
	
	this.initDefaultFolders();
};

netgis.LayerTree.prototype.createFolder = function( title )
{	
	var item = document.createElement( "li" );
	item.className = "netgis-folder netgis-hover-light";
	item.setAttribute( "title", title );
	//item.innerHTML = "<span class='caret'>" + title + "</span>";
	
	var label = document.createElement( "label" );
	label.className = "netgis-icon";
	item.appendChild( label );
	
	var checkbox = document.createElement( "input" );
	checkbox.setAttribute( "type", "checkbox" );
	//checkbox.checked = checked;
	checkbox.addEventListener( "change", this.onFolderChange.bind( this ) );
	label.appendChild( checkbox );
	
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.className = "netgis-clip-text netgis-hover-text-primary";
	button.innerHTML = '<i class="fas fa-folder-open"></i>' + title;
	button.addEventListener( "click", this.onFolderClick.bind( this ) );
	item.appendChild( button );
	
	var folder = document.createElement( "ul" );
	item.appendChild( folder );
	
	return item;
};

netgis.LayerTree.prototype.createLayer = function( id, title, checked )
{
	var item = document.createElement( "li" );
	//item.dataset.id = id;
	item.setAttribute( "title", title );
	item.className = "netgis-folder-item netgis-hover-text-primary";
	
	var label = document.createElement( "label" );
	label.className = "netgis-label netgis-clip-text";
	item.appendChild( label );
	
	var span = document.createElement( "span" );
	span.className = "netgis-icon";
	label.appendChild( span );
	
	var checkbox = document.createElement( "input" );
	checkbox.setAttribute( "type", "checkbox" );
	checkbox.dataset.id = id;
	checkbox.checked = checked;
	checkbox.addEventListener( "change", this.onItemChange.bind( this ) );
	span.appendChild( checkbox );
	
	var icon = document.createElement( "i" );
	//icon.className = "fas fa-file";
	//icon.className = "fas fa-sticky-note";
	//icon.className = "far fa-map";
	icon.className = "fas fa-th-large";
	label.appendChild( icon );
	
	var text = document.createTextNode( title );
	label.appendChild( text );
	
	var appendix = document.createElement( "span" );
	label.appendChild( appendix );
	
	return item;
};

netgis.LayerTree.prototype.addToFolder = function( folder, item, prepend )
{
	var list;
	
	if ( folder )
	{
		list = folder.getElementsByTagName( "ul" )[ 0 ]; //TODO: folder.children[ 0 ] ?
		list.appendChild( item );
	}
	else
	{
		list = this.list;
	}
	
	if ( ! prepend )
	{
		list.appendChild( item );
	}
	else
	{
		list.insertBefore( item, list.firstChild );
	}
};

netgis.LayerTree.prototype.onFolderClick = function( e )
{
	/*
	var folder = e.currentTarget.parentElement.parentElement;
	folder.classList.toggle( "netgis-active" );
	*/
   
	//e.currentTarget.parentElement.querySelector(".nested").classList.toggle("active");
	
	var folder = e.currentTarget.parentElement;
	folder.classList.toggle( "netgis-active" );
};

/*netgis.LayerTree.prototype.updateFolderCheck = function( folder )
{
	var items = folder.getElementsByTagName( "input" );
	
	
};*/

netgis.LayerTree.prototype.onFolderChange = function( e )
{
	var checkbox = e.currentTarget;
	var checked = checkbox.checked;
	var folder = checkbox.parentElement.parentElement;
	var items = folder.getElementsByTagName( "input" );
	//var items = folder.getElementsByClassName( "netgis-folder-item" );
	
	//console.info( "Folder Change:", checked, folder, items );
	
	// Check Child Items
	for ( var i = 1; i < items.length; i++ )
	{
		var item = items[ i ];
		var childcheck = item;
		//var childcheck = item.getElementsByTagName( "input" )[ 0 ];
		
		childcheck.checked = checked;
		
		//console.info( "Folder Child:", item, childcheck, id, items );
		
		//var id = parseInt( childcheck.dataset.id );
		var id = childcheck.dataset.id;
		
		if ( netgis.util.isDefined( id ) )
		{
			id = parseInt( id );
			this.client.invoke( checked ? netgis.Events.LAYER_SHOW : netgis.Events.LAYER_HIDE, { id: id } );
		}
	}
	
	this.updateFolderChecks( folder );
	
	// Check Parent Folder
	var parentFolder = folder.parentElement.parentElement;
	if ( parentFolder.className.search( "netgis-folder" ) !== -1 )
		this.updateFolderChecks( parentFolder );
};

netgis.LayerTree.prototype.updateFolderChecks = function( folder )
{
	if ( ! netgis.util.isDefined( folder ) ) folder = this.list;
	
	// Count Child Checks
	var items = folder.getElementsByClassName( "netgis-folder-item" );
	
	var checks = 0;
	
	for ( var i = 0; i < items.length; i++ )
	{
		var checkbox = items[ i ].getElementsByTagName( "input" )[ 0 ];
		if ( checkbox.checked ) checks++;
	}
	
	// Set Checkbox State
	var checkbox = folder.getElementsByTagName( "input" )[ 0 ];
	
	var state = 0;
	if ( checks > 0 ) state = 1;
	if ( checks === items.length ) state = 2;
	
	switch ( state )
	{
		case 0:
		{
			// Unchecked
			checkbox.checked = false;
			checkbox.classList.remove( "netgis-partial" );
			break;
		}
		
		case 1:
		{
			// Partially Checked
			checkbox.checked = true;
			checkbox.classList.add( "netgis-partial" );
			break;
		}
		
		case 2:
		{
			// Fully Checked
			checkbox.checked = true;
			checkbox.classList.remove( "netgis-partial" );
			break;
		}
	}
	
	//TODO: use nearest ancestor selector
	var parentList = folder.parentElement;
	
	if ( parentList && parentList !== this.list )
	{
		// Recursion
		var parentFolder = parentList.parentElement;
		if ( parentFolder && parentFolder.className.search( "netgis-folder" ) !== -1 )
			this.updateFolderChecks( parentFolder );
	}
};

netgis.LayerTree.prototype.onItemChange = function( e )
{
	var checkbox = e.currentTarget;
	var checked = checkbox.checked;
	var listitem = checkbox.parentElement.parentElement.parentElement;
	var id = parseInt( checkbox.dataset.id );
	var folder = listitem.parentElement.parentElement;
	var items = folder.getElementsByTagName( "input" );
	
	// Check Parent Folder
	var checks = 0;
	
	for ( var i = 1; i < items.length; i++ )
	{
		var item = items[ i ];
		if ( item.checked ) checks++;
	}
	
	if ( folder.className.search( "netgis-folder" ) !== -1 )
		this.updateFolderChecks( folder );
	
	this.client.invoke( checked ? netgis.Events.LAYER_SHOW : netgis.Events.LAYER_HIDE, { id: id } );
};

netgis.LayerTree.prototype.onLayerListToggle = function( e )
{
	this.root.classList.toggle( "netgis-hide" );
};

netgis.LayerTree.prototype.onContextUpdate = function( e )
{
	this.clearAll();
	
	var folders = e.folders;
	var layers = e.layers;
   
	// Create Folders
	var folderItems = [];
   
	for ( var f = 0; f < folders.length; f++ )
	{
		var folder = folders[ f ];
		
		var item = this.createFolder( folder.title );
		folderItems.push( item );
	}
	
	// Create Layers
	for ( var l = 0; l < layers.length; l++ )
	{
		var layer = layers[ l ];
		
		var item = this.createLayer( l, layer.title, layer.active );
		this.addToFolder( folderItems[ layer.folder ], item );
	}
	
	// Append Folders
	for ( var f = 0; f < folders.length; f++ )
	{
		var folder = folders[ f ];
		var item = folderItems[ f ];
		
		if ( folder.parent === -1 )
		{
			this.list.appendChild( item );
		}
		else
		{
			this.addToFolder( folderItems[ folder.parent ], item );
		}
	}
	
	// Active State
	for ( var l = 0; l < layers.length; l++ )
	{
		var layer = layers[ l ];
		if ( layer.active ) this.client.invoke( netgis.Events.LAYER_SHOW, { id: l } );
	}
	for ( var f = 0; f < folderItems.length; f++ )
	{
		this.updateFolderChecks( folderItems[ f ] );
	}
};

netgis.LayerTree.prototype.onLayerCreated = function( e )
{
	var item = this.createLayer( e.id, e.title, e.checked );
	
	var folder;
	
	//TODO: this is a hack to get special folders working	
	if ( e.folder === "import" )
	{
		/*if ( ! this.folderImport )
		{
			this.folderImport = this.createFolder( "Importierte Ebenen" );
			this.list.insertBefore( this.folderImport, this.folderDraw ? this.folderDraw.nextSibling : this.list.firstChild );
		}
		*/
	   
		this.folderImport.classList.remove( "netgis-hide" );
	   
		folder = this.folderImport;
	}
	else if ( e.folder === "draw" )
	{
		/*if ( ! this.folderDraw )
		{
			this.folderDraw = this.createFolder( "Zeichnung" );
			this.list.insertBefore( this.folderDraw, this.list.firstChild );
		}*/
		
		this.folderDraw.classList.remove( "netgis-hide" );
		
		folder = this.folderDraw;
	}
	
	this.addToFolder( folder, item, true );
	this.updateFolderChecks( folder );
};

netgis.LayerTree.prototype.onEditFeaturesChange = function( e )
{
	// Enable draw layer if not already
	if ( this.folderDraw )
	{		
		var list = this.folderDraw.getElementsByTagName( "ul" )[ 0 ];
		var checks = list.getElementsByTagName( "input" );
		var checkbox = checks[ 0 ];
		var id = parseInt( checkbox.dataset.id );
		
		if ( ! checkbox.checked )
		{
			checkbox.checked = true;

			this.updateFolderChecks( this.folderDraw );
			this.client.invoke( netgis.Events.LAYER_SHOW, { id: id } );
		}
		
		// Update Area
		var label = list.getElementsByTagName( "label" )[ 0 ];
		var spans = label.getElementsByTagName( "span" );
		var appendix = spans[ spans.length - 1 ];
		
		if ( e.area && e.area > 0.0 )
		{
			appendix.innerText = " (Fläche: " + netgis.util.formatArea( e.area, true ) + ")";
		}
		else
		{
			appendix.innerText = "";
		}
	};
};

netgis.LayerTree.prototype.onAddServiceWMS = function( e )
{
	var item = this.createLayer( e.id, e.title, true );
	
	this.folderServices.classList.remove( "netgis-hide" );
	this.addToFolder( this.folderServices, item, true );
	this.updateFolderChecks( this.folderServices );
	
	this.client.invoke( netgis.Events.LAYER_SHOW, { id: e.id } );
};

netgis.LayerTree.prototype.onAddServiceWFS = function( e )
{
	var item = this.createLayer( e.id, e.title, true );
	
	this.folderServices.classList.remove( "netgis-hide" );
	this.addToFolder( this.folderServices, item, true );
	this.updateFolderChecks( this.folderServices );
	
	this.client.invoke( netgis.Events.LAYER_SHOW, { id: e.id } );
};

netgis.LayerTree.prototype.onSetMode = function( e )
{
	if ( e === netgis.Modes.SEARCH_PARCEL )
	{
		this.root.classList.add( "netgis-hide" );
	}
};

netgis.LayerTree.prototype.onAddServiceClick = function( e )
{
	this.client.invoke( netgis.Events.ADD_SERVICE_SHOW, null );
};