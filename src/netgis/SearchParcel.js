"use strict";

var netgis = netgis || {};

netgis.SearchParcel = function()
{
	this.client = null;
};

netgis.SearchParcel.prototype.load = function()
{
	this.root = document.createElement( "section" );
	this.root.className = "netgis-search-parcel netgis-dialog netgis-shadow netgis-hide";
	
	// Head
	var head = document.createElement( "h3" );
	head.innerHTML = "Flurstücks-Suche:";
	this.root.appendChild( head );
	
	// Form
	var form = document.createElement( "div" );
	this.root.appendChild( form );
	
	// Name Input ( "Gemarkung" )
	var nameLabel = this.createInput( "Gemarkungsname:" );
	nameLabel.style.position = "relative";
	form.appendChild( nameLabel );
	
	this.nameInput = nameLabel.children[ 0 ];
	this.nameInput.setAttribute( "title", "ENTER: Auswählen, ESCAPE: Zurücksetzen" );
	this.nameInput.addEventListener( "keyup", this.onInputNameKey.bind( this ) );
	
	this.nameLoader = document.createElement( "div" );
	this.nameLoader.className = "netgis-loader netgis-text-primary netgis-hide";
	this.nameLoader.innerHTML = "<i class='fas fa-spinner'></i>";
	nameLabel.appendChild( this.nameLoader );
	
	// Name Results
	this.nameList = document.createElement( "ul" );	
	form.appendChild( this.nameList );
	
	// District Input ( "Gemarkung" )
	var districtLabel = this.createInput( "Gemarkungsnummer:" );
	this.districtInput = districtLabel.children[ 0 ];
	form.appendChild( districtLabel );
	
	// Field Input ( "Flur" )
	var fieldLabel = this.createInput( "Flurnummer:" );
	this.fieldInput = fieldLabel.children[ 0 ];
	form.appendChild( fieldLabel );
	
	// Parcel Input ( "Flurstück" )
	var parcelLabel = this.createInput( "Flurstücksnummer (Zähler/Nenner):" );
	this.parcelInputA = parcelLabel.children[ 0 ];
	this.parcelInputA.style.width = "48%";
	this.parcelInputB = this.parcelInputA.cloneNode( true );
	this.parcelInputB.style.marginLeft = "4%";
	parcelLabel.appendChild( this.parcelInputB );
	form.appendChild( parcelLabel );
	
	// Parcel Search
	var parcelButton = document.createElement( "button" );
	parcelButton.setAttribute( "type", "button" );
	parcelButton.addEventListener( "click", this.onParcelSearchClick.bind( this ) );
	parcelButton.className = "netgis-primary netgis-hover-primary";
	parcelButton.innerHTML = "Flurstücke suchen";
	parcelButton.style.marginTop = "4mm";
	form.appendChild( parcelButton );
	
	// Parcel Results
	this.parcelInfo = document.createElement( "p" );
	form.appendChild( this.parcelInfo );
	
	this.parcelTable = this.createTable( [ "", "Flur", "FS Zähler", "FS Nenner", "FKZ", "Fläche (qm)" ] );
	this.parcelTable.classList.add( "netgis-hide" );
	form.appendChild( this.parcelTable );
	
	this.parcelList = this.parcelTable.getElementsByTagName( "tbody" )[ 0 ];
	
	this.parcelReset = document.createElement( "button" );
	this.parcelReset.setAttribute( "type", "button" );
	this.parcelReset.addEventListener( "click", this.onParcelResetClick.bind( this ) );
	this.parcelReset.className = "netgis-primary netgis-hover-primary";
	this.parcelReset.innerHTML = "Zurücksetzen";
	this.parcelReset.style.marginTop = "4mm";
	form.appendChild( this.parcelReset );
	
	// Initial State
	this.reset();
	
	// Test
	this.requestParcel( "072856", "1" );
	
	// Attach To Client
	this.client.root.appendChild( this.root );
	
	this.client.on( netgis.Events.SET_MODE, this.onSetMode.bind( this ) );
	this.client.on( netgis.Events.LAYER_LIST_TOGGLE, this.onLayerListToggle.bind( this ) );
};

netgis.SearchParcel.prototype.createInput = function( title )
{
	var label = document.createElement( "label" );
	label.className = "netgis-hover-text-primary";
	label.innerHTML = title;
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "text" );
	label.appendChild( input );
	
	return label;
};

netgis.SearchParcel.prototype.createNameItem = function( title )
{
	var li = document.createElement( "li" );
	
	var button = document.createElement( "button" );
	button.setAttribute( "type", "button" );
	button.addEventListener( "click", this.onNameItemClick.bind( this ) );
	button.className = "netgis-text-primary netgis-hover-light";
	button.innerHTML = title;
	li.appendChild( button );
	
	return li;
};

netgis.SearchParcel.prototype.createTable = function( columnNames )
{
	var wrapper = document.createElement( "div" );
	wrapper.className = "netgis-table-wrapper";
	
	var table = document.createElement( "table" );
	wrapper.appendChild( table );
	
	// Head
	var head = document.createElement( "thead" );
	table.appendChild( head );
	
	var row = document.createElement( "tr" );
	row.className = "netgis-light";
	row.style.position = "sticky";
	head.appendChild( row );
	
	for ( var i = 0; i < columnNames.length; i++ )
	{
		var th = document.createElement( "th" );
		th.innerHTML = columnNames[ i ];
		row.appendChild( th );
	}
	
	// Body
	var body = document.createElement( "tbody" );
	table.appendChild( body );
	
	return wrapper;
};

netgis.SearchParcel.prototype.createParcelItem = function( field, parcelA, parcelB, id, area, bbox, geom )
{
	//TODO: store geometry data on element vs. seperate data array ?
	
	var tr = document.createElement( "tr" );
	tr.className = "netgis-hover-light netgis-hover-text-primary";
	tr.setAttribute( "title", "Klicken zum zoomen" );
	tr.setAttribute( "data-bbox", bbox );
	tr.setAttribute( "data-geom", geom );
	tr.addEventListener( "mouseenter", this.onParcelEnter.bind( this ) );
	tr.addEventListener( "mouseleave", this.onParcelLeave.bind( this ) );
	tr.addEventListener( "click", this.onParcelClick.bind( this ) );
	
	var buttonCell = document.createElement( "td" );
	tr.appendChild( buttonCell );
	
	var importButton = document.createElement( "button" );
	importButton.setAttribute( "type", "button" );
	importButton.setAttribute( "title", "Geometrie übernehmen" );
	importButton.addEventListener( "click", this.onParcelImportClick.bind( this ) );
	importButton.className = "netgis-text-primary netgis-hover-primary";
	importButton.innerHTML = "<i class='fas fa-paste'></i>";
	buttonCell.appendChild( importButton );
	
	var fieldCell = document.createElement( "td" );
	fieldCell.innerHTML = field;
	tr.appendChild( fieldCell );
	
	var parcelCellA = document.createElement( "td" );
	parcelCellA.innerHTML = parcelA;
	tr.appendChild( parcelCellA );
	
	var parcelCellB = document.createElement( "td" );
	parcelCellB.innerHTML = parcelB;
	tr.appendChild( parcelCellB );
	
	var idCell = document.createElement( "td" );
	idCell.innerHTML = id;
	tr.appendChild( idCell );
	
	var areaCell = document.createElement( "td" );
	areaCell.innerHTML = area;
	tr.appendChild( areaCell );
	
	return tr;
};

netgis.SearchParcel.prototype.reset = function()
{
	this.nameLoader.classList.add( "netgis-hide" );
	
	this.nameInput.value = "";
	this.districtInput.value = "";
	this.fieldInput.value = "";
	this.parcelInputA.value = "";
	this.parcelInputB.value = "";
	
	this.nameList.innerHTML = "";
	this.parcelInfo.innerHTML = "";
	this.parcelList.innerHTML = "";
	this.parcelTable.classList.add( "netgis-hide" );
	
	this.parcelReset.classList.add( "netgis-hide" );
	
	this.root.scrollTop = 0;
};

netgis.SearchParcel.prototype.onInputNameKey = function( e )
{
	switch ( e.keyCode )
	{
		// Enter
		case 13:
		{
			this.selectFirstName();
			break;
		}
		
		// Escape
		case 27:
		{
			this.reset();
			break;
		}
		
		default:
		{
			this.requestName( this.nameInput.value.trim() );
			break;
		}
	}
};

netgis.SearchParcel.prototype.requestName = function( query )
{
	if ( this.nameDebounce ) window.clearTimeout( this.nameDebounce );
	
	if ( query.length === 0 ) return;
	
	/*var url = "https://geodaten.naturschutz.rlp.de/kartendienste_naturschutz/mod_alkis/gem_search.php?placename={q}";
	url = "/geoportal/client/proxy.php?" + url;*/
	var url = this.client.config.searchParcel.nameURL;
	url = netgis.util.replace( url, "{q}", window.encodeURIComponent( query ) );
	
	this.nameDebounce = window.setTimeout( this.onInputNameDebounce.bind( this, url ), 200 );
	
	this.nameLoader.classList.remove( "netgis-hide" );
};

netgis.SearchParcel.prototype.onInputNameDebounce = function( url )
{
	netgis.util.request( url, this.onInputNameResponse.bind( this ) );
};

netgis.SearchParcel.prototype.onInputNameResponse = function( data )
{
	this.nameLoader.classList.add( "netgis-hide" );
	
	this.nameList.innerHTML = "";
	
	if ( data.charAt( 0 ) !== '{' && data.charAt( 0 ) !== '[' ) return;
	
	var json = JSON.parse( data );
	
	for ( var i = 0; i < json.data.length; i++ )
	{
		var item = json.data[ i ];
		var li = this.createNameItem( item[ "gmk_name" ] );
		li.getElementsByTagName( "button" )[ 0 ].setAttribute( "data-id", item[ "gmk_gmn" ] );
		this.nameList.appendChild( li );
	}
};

netgis.SearchParcel.prototype.onNameItemClick = function( e )
{
	var button = e.target;
	var id = button.getAttribute( "data-id" );
	
	this.nameInput.value = button.innerHTML;
	this.nameList.innerHTML = "";
	
	this.districtInput.value = id;
};

netgis.SearchParcel.prototype.selectFirstName = function()
{
	var buttons = this.nameList.getElementsByTagName( "button" );
	
	if ( buttons.length > 0 )
	{
		buttons[ 0 ].click();
	}
};

netgis.SearchParcel.prototype.onParcelSearchClick = function( e )
{
	this.requestParcel
	(
		this.districtInput.value.trim(),
		this.fieldInput.value.trim(),
		this.parcelInputA.value.trim(),
		this.parcelInputB.value.trim()
	);
};

netgis.SearchParcel.prototype.requestParcel = function( district, field, parcelA, parcelB )
{
	//var url = "https://geodaten.naturschutz.rlp.de/kartendienste_naturschutz/mod_alkis/flur_search.php?gmk_gmn={district}&fln={field}&fsn_zae={parcelA}&fsn_nen={parcelB}&export=json";
	
	var url = this.client.config.searchParcel.parcelURL;
	
	url = netgis.util.replace( url, "{district}", district ? district : "" );
	url = netgis.util.replace( url, "{field}", field ? field : "" );
	url = netgis.util.replace( url, "{parcelA}", parcelA ? parcelA : "" );
	url = netgis.util.replace( url, "{parcelB}", parcelB ? parcelB : "" );
	
	//url = "/geoportal/client/proxy.php?" + url;
	
	this.parcelTable.classList.add( "netgis-hide" );
	this.parcelList.innerHTML = "";
	this.parcelInfo.innerHTML = "Suche Flurstücke...";
	
	netgis.util.request( url, this.onParcelResponse.bind( this ) );
};

netgis.SearchParcel.prototype.onParcelResponse = function( data )
{
	var json = JSON.parse( data );
	
	if ( json.count === 0 )
	{
		//TODO: if ( json.count === 0 ) -> json.Info
		this.parcelInfo.innerHTML = json[ "Info" ];
	}
	else
	{
		this.parcelInfo.innerHTML = "Flurstücke gefunden: <span class='netgis-text-primary'>" + json[ "count" ] + "</span>";
		
		for ( var i = 0; i < json.data.length; i++ )
		{
			var result = json.data[ i ];
			var item = this.createParcelItem
			(
				result[ "fln" ],
				result[ "fsn_zae" ],
				result[ "fsn_nen" ],
				result[ "fsk" ],
				result[ "flaeche" ],
				result[ "bbox" ],
				result[ "geometry" ]
			);
			this.parcelList.appendChild( item );
		}
		
		this.parcelTable.classList.remove( "netgis-hide" );
	}
	
	this.parcelReset.classList.remove( "netgis-hide" );
	
	if ( ! this.root.classList.contains( "netgis-hide" ) )
		this.parcelTable.scrollIntoView();
};

netgis.SearchParcel.prototype.onParcelEnter = function( e )
{
	var tr = e.target;
	var geom = tr.getAttribute( "data-geom" );
	
	this.client.invoke( netgis.Events.PARCEL_SHOW_PREVIEW, { geom: geom } );
};

netgis.SearchParcel.prototype.onParcelLeave = function( e )
{
	this.client.invoke( netgis.Events.PARCEL_HIDE_PREVIEW, null );
};

netgis.SearchParcel.prototype.onParcelClick = function( e )
{
	var tr = e.currentTarget;
	var bbox = tr.getAttribute( "data-bbox" );
	
	this.client.invoke( netgis.Events.MAP_ZOOM_WKT, bbox );
};

netgis.SearchParcel.prototype.onParcelImportClick = function( e )
{
	var tr = e.currentTarget.parentElement.parentElement;
	var geom = tr.getAttribute( "data-geom" );
	
	this.client.invoke( netgis.Events.IMPORT_WKT, geom );
};

netgis.SearchParcel.prototype.onParcelResetClick = function( e )
{
	this.reset();
};

netgis.SearchParcel.prototype.onSetMode = function( e )
{
	if ( e === netgis.Modes.SEARCH_PARCEL && this.root.classList.contains( "netgis-hide" ) )
	{
		this.root.classList.remove( "netgis-hide" );
	}
	else
	{
		this.root.classList.add( "netgis-hide" );
	}
};

netgis.SearchParcel.prototype.onLayerListToggle = function( e )
{
	this.root.classList.add( "netgis-hide" );
};