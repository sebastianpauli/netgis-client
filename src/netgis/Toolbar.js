"use strict";

var netgis = netgis || {};

netgis.Toolbar = function()
{
	this.client = null;
	this.toolbars = {};
	this.searchValue = "";
};

netgis.Toolbar.prototype.load = function()
{
	var config = this.client.config;
	
	this.root = document.createElement( "section" ); // header?
	this.root.className = "netgis-toolbars";
	
	if ( this.client.editable )
	{
		// Draw
		this.toolbars[ netgis.Modes.DRAW_POINTS ] = this.createToolbar();
		this.append( this.toolbars[ netgis.Modes.DRAW_POINTS ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Punkte zeichnen:</span>', this.onToolbarClose.bind( this ) ) );
		this.append( this.toolbars[ netgis.Modes.DRAW_POINTS ], this.createToolbarCheckbox( "Einrasten", this.onSnapChange.bind( this ) ) );
		this.root.appendChild( this.toolbars[ netgis.Modes.DRAW_POINTS ] );

		this.toolbars[ netgis.Modes.DRAW_LINES ] = this.createToolbar();
		this.append( this.toolbars[ netgis.Modes.DRAW_LINES ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Linien zeichnen:</span>', this.onToolbarClose.bind( this ) ) );
		this.append( this.toolbars[ netgis.Modes.DRAW_LINES ], this.createToolbarCheckbox( "Einrasten", this.onSnapChange.bind( this ) ) );
		this.root.appendChild( this.toolbars[ netgis.Modes.DRAW_LINES ] );

		this.toolbars[ netgis.Modes.DRAW_POLYGONS ] = this.createToolbar();
		this.append( this.toolbars[ netgis.Modes.DRAW_POLYGONS ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Polygone zeichnen:</span>', this.onToolbarClose.bind( this ) ) );
		this.append( this.toolbars[ netgis.Modes.DRAW_POLYGONS ], this.createToolbarCheckbox( "Einrasten", this.onSnapChange.bind( this ) ) );
		this.root.appendChild( this.toolbars[ netgis.Modes.DRAW_POLYGONS ] );

		// Edit
		this.toolbars[ netgis.Modes.CUT_FEATURE_BEGIN ] = this.createToolbar();
		this.append( this.toolbars[ netgis.Modes.CUT_FEATURE_BEGIN ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Feature zum Ausschneiden wählen:</span>', this.onToolbarClose.bind( this ) ) );
		this.root.appendChild( this.toolbars[ netgis.Modes.CUT_FEATURE_BEGIN ] );

		this.toolbars[ netgis.Modes.CUT_FEATURE_DRAW ] = this.createToolbar();
		this.append( this.toolbars[ netgis.Modes.CUT_FEATURE_DRAW ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Fläche zum Ausschneiden zeichnen:</span>', this.onToolbarClose.bind( this ) ) );
		this.root.appendChild( this.toolbars[ netgis.Modes.CUT_FEATURE_DRAW ] );

		this.toolbars[ netgis.Modes.MODIFY_FEATURES ] = this.createToolbar();
		this.append( this.toolbars[ netgis.Modes.MODIFY_FEATURES ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Features verschieben:</span>', this.onToolbarClose.bind( this ) ) );
		this.root.appendChild( this.toolbars[ netgis.Modes.MODIFY_FEATURES ] );

		this.toolbars[ netgis.Modes.DELETE_FEATURES ] = this.createToolbar();
		this.append( this.toolbars[ netgis.Modes.DELETE_FEATURES ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Features löschen:</span>', this.onToolbarClose.bind( this ) ) );
		this.root.appendChild( this.toolbars[ netgis.Modes.DELETE_FEATURES ] );

		this.toolbars[ netgis.Modes.BUFFER_FEATURE_BEGIN ] = this.createToolbar();
		this.append( this.toolbars[ netgis.Modes.BUFFER_FEATURE_BEGIN ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Feature zum Puffern wählen:</span>', this.onToolbarClose.bind( this ) ) );
		this.root.appendChild( this.toolbars[ netgis.Modes.BUFFER_FEATURE_BEGIN ] );

		this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ] = this.createToolbar();
		
		//var wrapper = document.createElement( "div" );
		//this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ].appendChild( wrapper );
		
		var bufferDefaultRadius = 1000;
		var bufferDefaultSegments = 3;
		
		if ( netgis.util.isDefined( config.tools ) )
		{
			if ( netgis.util.isDefined( config.tools.buffer.defaultRadius ) ) bufferDefaultRadius = config.tools.buffer.defaultRadius;
			if ( netgis.util.isDefined( config.tools.buffer.defaultSegments ) ) bufferDefaultSegments = config.tools.buffer.defaultSegments;
		}	
		
		this.append( this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Feature puffern:</span>', this.onBufferCancel.bind( this ) ) );
		this.append( this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ], this.createToolbarInput( "Radius in Meter:", bufferDefaultRadius, this.onBufferChange.bind( this ) ) );
		this.append( this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ], this.createToolbarInput( "Segmente:", bufferDefaultSegments, this.onBufferChange.bind( this ) ) );
		this.append( this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ], this.createToolbarButton( '<i class="fas fa-check"></i><span>OK</span>', this.onBufferAccept.bind( this ) ) );
		
		//var self = this;
		//setTimeout( function() { self.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ].classList.remove( "netgis-hide" ); }, 100 );
		
		/*
		this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ].appendChild( this.createToolbarButton( '<i class="fas fa-times"></i><span>Feature puffern:</span>', this.onBufferCancel.bind( this ) ) );
		this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ].appendChild( this.createToolbarInput( "Radius in Meter:", this.client.config.tools.buffer.defaultRadius, this.onBufferChange.bind( this ) ) );
		this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ].appendChild( this.createToolbarInput( "Segmente:", this.client.config.tools.buffer.defaultSegments, this.onBufferChange.bind( this ) ) );
		*/
		
		var bufferInputs = this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ].getElementsByTagName( "input" );
		bufferInputs[ 0 ].addEventListener( "keyup", this.onBufferKeyUp.bind( this ) );
		bufferInputs[ 1 ].addEventListener( "keyup", this.onBufferKeyUp.bind( this ) );
		bufferInputs[ 1 ].setAttribute( "min", 1 );
		
		//this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ].appendChild( this.createToolbarButton( '<i class="fas fa-check"></i><span>OK</span>', this.onBufferAccept.bind( this ) ) );
		this.root.appendChild( this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ] );
	}
	
	// Search
	this.toolbars[ netgis.Modes.SEARCH_PLACE ] = this.createToolbar();
	this.append( this.toolbars[ netgis.Modes.SEARCH_PLACE ], this.createToolbarButton( '<i class="fas fa-times"></i><span>Suche:</span>', this.onToolbarClose.bind( this ) ) );
	
	var searchInput = this.createToolbarInputText( "Adresse...", "", null );
	searchInput.style.position = "relative";
	
	this.searchInput = searchInput.getElementsByTagName( "input" )[ 0 ];
	//this.searchInput.addEventListener( "change", this.onSearchChange.bind( this ) );
	//this.searchInput.addEventListener( "keypress", this.onSearchKeyPress.bind( this ) );
	this.searchInput.addEventListener( "keyup", this.onSearchKeyUp.bind( this ) );
	this.searchInput.addEventListener( "focus", this.onSearchFocus.bind( this ) );
	this.searchInput.addEventListener( "blur", this.onSearchBlur.bind( this ) );
	
	/*var searchClear = document.createElement( "button" );
	searchClear.innerHTML = "<i class='fas fa-undo-alt'></i>";
	searchInput.appendChild( searchClear );*/
	
	this.append( this.toolbars[ netgis.Modes.SEARCH_PLACE ], searchInput );
	
	this.searchList = document.createElement( "ul" );
	this.searchList.className = "netgis-dropdown-content netgis-search-list netgis-dialog netgis-shadow netgis-hide";
	searchInput.appendChild( this.searchList );
	
	//TODO: search dropdown not working if toolbar has overflow-y hidden
	
	//TODO: refactor search list to abstract dropdown component ( see head menus )
	
	//this.toolbars[ netgis.MapModes.SEARCH_PLACE ].appendChild( this.createToolbarButton( '<i class="fas fa-check"></i>OK', this.onBufferAccept.bind( this ) ) );
	this.append( this.toolbars[ netgis.Modes.SEARCH_PLACE ], this.createToolbarButton( '<i class="fas fa-undo"></i>', this.onSearchClear.bind( this ) ) );
	
	this.root.appendChild( this.toolbars[ netgis.Modes.SEARCH_PLACE ] );
	
	this.client.root.appendChild( this.root );
	
	// Events
	this.client.on( netgis.Events.SET_MODE, this.onSetMode.bind( this ) );
	this.client.on( netgis.Events.SEARCH_PLACE_RESPONSE, this.onSearchPlaceResponse.bind( this ) );
};

netgis.Toolbar.prototype.createToolbar = function()
{
	var toolbar = document.createElement( "div" );
	toolbar.className = "netgis-toolbar netgis-dialog netgis-shadow netgis-hide";
	
	var wrapper = document.createElement( "div" );
	toolbar.appendChild( wrapper );
	
	return toolbar;
};

netgis.Toolbar.prototype.append = function( toolbar, child )
{
	var wrapper = toolbar.getElementsByTagName( "div" )[ 0 ];
	wrapper.appendChild( child );
};

netgis.Toolbar.prototype.createToolbarButton = function( content, callback )
{
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.className = "netgis-hover-light";
	button.innerHTML = content;
	button.addEventListener( "click", callback );
	
	return button;
};

netgis.Toolbar.prototype.createToolbarCheckbox = function( title, callback )
{
	var label = document.createElement( "label" );
	label.className = "netgis-hover-light";
	
	var checkbox = document.createElement( "input" );
	checkbox.setAttribute( "type", "checkbox" );
	checkbox.addEventListener( "change", callback );
	label.appendChild( checkbox );
	
	var text = document.createTextNode( title );
	label.appendChild( text );
	
	return label;
};

netgis.Toolbar.prototype.createToolbarInput = function( title, value, callback )
{
	var label = document.createElement( "label" );
	label.className = "netgis-hover-light";
	
	var text = document.createTextNode( title );
	label.appendChild( text );
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "number" );
	input.setAttribute( "min", 0 );
	input.value = value;
	input.addEventListener( "change", callback );
	label.appendChild( input );
	
	return label;
};

netgis.Toolbar.prototype.createToolbarInputText = function( title, value, callback )
{
	var label = document.createElement( "label" );
	label.className = "netgis-hover-light";
	
	/*var text = document.createTextNode( title );
	label.appendChild( text );*/
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "text" );
	input.setAttribute( "placeholder", title );
	input.value = value;
	if ( callback ) input.addEventListener( "change", callback );
	label.appendChild( input );
	
	return label;
};

netgis.Toolbar.prototype.onSetMode = function( e )
{
	var mode = e;
	
	// Store old search mode to allow toggling search toolbar
	var searchMode = ! this.toolbars[ netgis.Modes.SEARCH_PLACE ].classList.contains( "netgis-hide" );
	
	// Toggle Toolbars
	netgis.util.foreach
	(
		this.toolbars,
		function( index, toolbar )
		{
			if ( index === mode )
				toolbar.classList.remove( "netgis-hide" );
			else
				toolbar.classList.add( "netgis-hide" );
		}
	);
	
	// Mode
	switch ( mode )
	{
		case netgis.Modes.SEARCH_PLACE:
		{
			//TODO: toggle mode event ?
			
			if ( ! searchMode )
				this.searchInput.focus();
			else
				this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.VIEW );
			
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURE_EDIT:
		{
			this.updateBuffer();
			break;
		}
	}
};

netgis.Toolbar.prototype.onToolbarClose = function( e )
{
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.VIEW );
};

netgis.Toolbar.prototype.searchRequest = function( value )
{
	value = value.trim();
	
	if ( value !== this.searchValue )
	{
		this.searchValue = value;

		if ( value.length > 0 )
		{
			this.client.invoke( netgis.Events.SEARCH_PLACE_REQUEST, { query: value } );
		}
	}
	
	//TODO: refactor into search module ?
};

netgis.Toolbar.prototype.searchClear = function()
{
	this.searchInput.value = "";
	this.searchList.innerHTML = "";
};

netgis.Toolbar.prototype.searchSelectFirst = function()
{
	var buttons = this.searchList.getElementsByTagName( "button" );
	
	if ( buttons.length > 0 )
	{
		this.onSearchItemClick( { target: buttons[ 0 ] } );
	}
};

netgis.Toolbar.prototype.onSearchKeyUp = function( e )
{
	var input = e.target;
	var key = e.keyCode;
	
	// a-z = 65-90
	// 0-9 = 48-57
	
	switch ( key )
	{
		// Enter
		case 13:
		{
			this.searchSelectFirst();
			this.searchList.classList.add( "netgis-hide" );
			break;
		}
		
		// Escape
		case 27:
		{
			this.searchClear();
			break;
		}
		
		default:
		{
			this.searchRequest( input.value );
			break;
		}
	}
};

netgis.Toolbar.prototype.onSearchChange = function( e )
{
	var input = e.target;
	this.searchRequest( input.value );
	
	/*this.client.invoke( netgis.Events.SEARCH_PLACE_REQUEST, { query: input.value } );
	console.info( "Search Change:", input.value );*/
};

netgis.Toolbar.prototype.onSearchClear = function( e )
{
	this.searchClear();
	this.searchInput.focus();
};

netgis.Toolbar.prototype.onSearchFocus = function( e )
{
	this.searchList.classList.remove( "netgis-hide" );
};

netgis.Toolbar.prototype.onSearchBlur = function( e )
{
	this.searchList.classList.add( "netgis-hide" );
};

netgis.Toolbar.prototype.onSearchPlaceResponse = function( e )
{
	this.searchList.innerHTML = "";
	
	var results = e.geonames;
	
	for ( var i = 0; i < results.length; i++ )
	{
		var result = results[ i ];
		
		var item = document.createElement( "li" );
		item.className = "netgis-hover-light";

		var button = document.createElement( "button" );
		button.setAttribute( "type", "button" );
		button.innerHTML = result.title;
		button.dataset.title = result.title;
		button.dataset.minx = result.minx;
		button.dataset.miny = result.miny;
		button.dataset.maxx = result.maxx;
		button.dataset.maxy = result.maxy;
		button.addEventListener( "mousedown", this.onSearchItemClick.bind( this ) );
		item.appendChild( button );
		
		this.searchList.appendChild( item );
	}
};

netgis.Toolbar.prototype.onSearchItemClick = function( e )
{
	var button = e.target;
	
	var title = button.dataset.title;
	var minx = Number.parseFloat( button.dataset.minx );
	var miny = Number.parseFloat( button.dataset.miny );
	var maxx = Number.parseFloat( button.dataset.maxx );
	var maxy = Number.parseFloat( button.dataset.maxy );
	
	this.client.invoke( netgis.Events.MAP_SET_EXTENT, { minx: minx, miny: miny, maxx: maxx, maxy: maxy } );
	
	//this.searchInput.value = title;
	this.searchValue = title;
};

netgis.Toolbar.prototype.updateBuffer = function()
{
	var inputs = this.toolbars[ netgis.Modes.BUFFER_FEATURE_EDIT ].getElementsByTagName( "input" );
	var radius = Number.parseFloat( inputs[ 0 ].value );
	var segments = Number.parseInt( inputs[ 1 ].value );
	
	this.client.invoke( netgis.Events.BUFFER_CHANGE, { radius: radius, segments: segments } );
};

netgis.Toolbar.prototype.onBufferChange = function( e )
{
	this.updateBuffer();
};

netgis.Toolbar.prototype.onBufferKeyUp = function( e )
{
	var key = e.keyCode;
	
	// Enter
	//if ( key === 13 )
	{
		this.updateBuffer();
	}
};

netgis.Toolbar.prototype.onBufferAccept = function( e )
{
	this.client.invoke( netgis.Events.BUFFER_ACCEPT, null );
	//this.setMode( netgis.Modes.VIEW );
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.VIEW );
};

netgis.Toolbar.prototype.onBufferCancel = function( e )
{
	this.client.invoke( netgis.Events.BUFFER_CANCEL, null );
	//this.setMode( netgis.Modes.VIEW );
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.VIEW );
};

netgis.Toolbar.prototype.onSnapChange = function( e )
{
	var input = e.target;
	var on = input.checked;
	
	this.toolbars[ netgis.Modes.DRAW_POINTS ].getElementsByTagName( "input" )[ 0 ].checked = on;
	this.toolbars[ netgis.Modes.DRAW_LINES ].getElementsByTagName( "input" )[ 0 ].checked = on;
	this.toolbars[ netgis.Modes.DRAW_POLYGONS ].getElementsByTagName( "input" )[ 0 ].checked = on;
	
	this.client.invoke( on ? netgis.Events.SNAP_ON : netgis.Events.SNAP_OFF, null );
};