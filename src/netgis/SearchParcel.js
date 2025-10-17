"use strict";

var netgis = netgis || {};

/**
 * Search Parcels Module.
 * @param {JSON} config [SearchParcel.Config]{@link netgis.SearchParcel.Config}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.SearchParcel = function( config )
{
	this.config = config;
	
	this.districtsLayerID = "searchparcel_districts";
	this.fieldsLayerID = "searchparcel_fields";
	this.parcelsLayerID = "searchparcel_parcels";
	
	this.selected = {};
	
	this.initElements();
	this.initEvents();
	this.initConfig( config );
};

/**
 * Config Section "searchparcel"
 * @memberof netgis.SearchParcel
 * @enum
 */
netgis.SearchParcel.Config =
{
	/**
	 * Show panel at startup
	 * @type Boolean
	 */
	"open": false,
	
	/**
	 * District (Gemarkung) search URL, should contain <code>{q}</code> placeholder
	 * @type String
	 */
	"name_url": "./proxy.php?https://geodaten.naturschutz.rlp.de/kartendienste_naturschutz/mod_alkis/gem_search.php?placename={q}",
	
	/**
	 * Parcel (Flurstück) search URL, should contain <code>{district}, {field}, {parcelA}, {parcelB}</code> placeholders
	 * @type String
	 */
	"parcel_url": "./proxy.php?https://geodaten.naturschutz.rlp.de/kartendienste_naturschutz/mod_alkis/flur_search.php?gmk_gmn={district}&fln={field}&fsn_zae={parcelA}&fsn_nen={parcelB}&export=json",

	/**
	 * Layer settings for district features (Gemarkungen), see [Map.Layers]{@link netgis.Map.Layers} for options, e.g. [LayerTypes.WFS]{@link LayerTypes}
	 * @type JSON
	 */
	"districts_service":
	{
		"type": "WFS",
		"url": "http://geo5.service24.rlp.de/wfs/verwaltungsgrenzen_rp.fcgi?",
		"name": "vermkv:gemarkungen_rlp",
		"format": "application/json; subtype=geojson",
		"min_zoom": 12
	},

	/**
	 * Layer settings for field features (Fluren), see [Map.Layers]{@link netgis.Map.Layers} for options, e.g. [LayerTypes.WFS]{@link LayerTypes}
	 * @type JSON
	 */
	"fields_service":
	{
		"url": "http://geo5.service24.rlp.de/wfs/verwaltungsgrenzen_rp.fcgi?",
		"name": "vermkv:fluren_rlp",
		"filter_property": "gmkgnr"
	}
};

netgis.SearchParcel.prototype.initElements = function()
{
	// Container Panel
	this.panel = new netgis.Panel( "Flurstücks-Suche" );
	this.panel.container.style.minWidth = "92mm";
	
	this.panel.container.addEventListener( netgis.Events.PANEL_TOGGLE, this.onPanelToggle.bind( this ) );
	
	this.container = document.createElement( "section" );
	this.container.className = "netgis-search-parcel";
	this.panel.content.appendChild( this.container );
	
	// Parcel Map Popup
	this.popup = new netgis.Popup();
	this.popup.setHeader( "Flurstück" );
	
	// Top
	var top = document.createElement( "section" );
	this.top = top;
	this.container.appendChild( top );
	
	// Name Input ("Gemarkung")
	var nameLabel = this.createInput( "Gemarkungsname:" );
	nameLabel.style.position = "relative";
	top.appendChild( nameLabel );
	
	this.nameInput = nameLabel.children[ 0 ];
	this.nameInput.setAttribute( "title", "ENTER: Auswählen, ESCAPE: Zurücksetzen" );
	this.nameInput.addEventListener( "keyup", this.onInputNameKey.bind( this ) );
	
	this.nameLoader = document.createElement( "div" );
	this.nameLoader.className = "netgis-loader netgis-text-primary netgis-hide";
	this.nameLoader.innerHTML = "<i class='fas fa-spinner'></i>";
	nameLabel.appendChild( this.nameLoader );
	
	// Name Results
	this.nameList = document.createElement( "ul" );	
	top.appendChild( this.nameList );
	
	// District Input ("Gemarkung")
	var districtLabel = this.createInput( "Gemarkungsnummer:" );
	this.districtInput = districtLabel.children[ 0 ];
	top.appendChild( districtLabel );
	
	// Field Input ("Flur")
	var fieldLabel = this.createInput( "Flurnummer:" );
	this.fieldInput = fieldLabel.children[ 0 ];
	this.fieldInput.addEventListener( "keyup", this.onInputFieldKey.bind( this ) );
	top.appendChild( fieldLabel );
	
	// Parcel Input ("Flurstück")
	var parcelLabel = this.createInput( "<span>Flurstücksnummer (Zähler/Nenner):</span>" );
	this.parcelInputA = parcelLabel.children[ 1 ];
	this.parcelInputA.style.width = "48%";
	this.parcelInputB = this.parcelInputA.cloneNode( true );
	this.parcelInputB.style.marginLeft = "4%";
	parcelLabel.appendChild( this.parcelInputB );
	top.appendChild( parcelLabel );
	
	// Parcel Search
	var parcelButton = document.createElement( "button" );
	parcelButton.setAttribute( "type", "button" );
	parcelButton.addEventListener( "click", this.onParcelSearchClick.bind( this ) );
	parcelButton.className = "netgis-color-a netgis-hover-c";
	parcelButton.innerHTML = "Flurstücke suchen";
	parcelButton.style.marginTop = "4mm";
	top.appendChild( parcelButton );
	
	// Bottom Section
	var bottom = document.createElement( "section" );
	bottom.className = "netgis-hide";
	this.bottom = bottom;
	
	this.container.appendChild( bottom );
	
	var header = document.createElement( "button" );
	header.className = "netgis-button netgis-clip-text netgis-color-c netgis-gradient-a";
	header.innerHTML = "<span>Flurstücke</span> <span></span><i class='netgis-icon fas fa-times'></i>";
	header.setAttribute( "type", "button" );
	header.addEventListener( "click", this.onBottomHeaderClick.bind( this ) );
	bottom.appendChild( header );
	
	this.parcelCount = header.getElementsByTagName( "span" )[ 1 ];
	
	// Parcel Results
	this.parcelInfo = document.createElement( "p" );
	
	this.parcelTable = this.createTable( [ "Flur", "Zähler", "Nenner", "FKZ", "Fläche (qm)" ] );
	this.parcelTable.classList.add( "netgis-hide" );
	this.parcelTable.style.position = "absolute";
	this.parcelTable.style.width = "100%";
	this.parcelTable.style.top = "12mm";
	this.parcelTable.style.bottom = "0mm";
	this.parcelTable.style.margin = "0mm";
	this.parcelTable.style.overflow = "auto";
	bottom.appendChild( this.parcelTable );
	
	this.parcelList = this.parcelTable.getElementsByTagName( "tbody" )[ 0 ];
	
	this.parcelReset = document.createElement( "button" );
	this.parcelReset.setAttribute( "type", "button" );
	this.parcelReset.addEventListener( "click", this.onResetClick.bind( this ) );
	this.parcelReset.className = "netgis-color-a netgis-hover-c";
	this.parcelReset.innerHTML = "Zurücksetzen";
	this.parcelReset.style.marginTop = "4mm";
	top.appendChild( this.parcelReset );
};

netgis.SearchParcel.prototype.initEvents = function()
{
	this.resizeObserver = new ResizeObserver( this.onTopResize.bind( this ) ).observe( this.top );
};

netgis.SearchParcel.prototype.initConfig = function( config )
{
	// Districts Layer
	this.districtsLayer = config[ "searchparcel" ][ "districts_service" ];
	
	this.districtsLayer[ "id" ] = this.districtsLayerID;
	this.districtsLayer[ "style" ] = config[ "styles" ][ "parcel" ];
	this.districtsLayer[ "order" ] = 99999;
	
	config[ "layers" ].push( this.districtsLayer );
	
	// Fields Layer
	this.fieldsLayer =
	{
		"id": this.fieldsLayerID,
		"type": netgis.LayerTypes.GEOJSON,
		"style": config[ "styles" ][ "parcel" ],
		"order": 99999,
		"data": null
	};
	
	config[ "layers" ].push( this.fieldsLayer );
	
	// Parcels Layer
	this.parcelsLayer =
	{
		"id": this.parcelsLayerID,
		"type": netgis.LayerTypes.WKT,
		"style": config[ "styles" ][ "parcel" ],
		"order": 99999,
		"data": null
	};
	
	config[ "layers" ].push( this.parcelsLayer );
	
	// Initial State	
	if ( config[ "searchparcel" ][ "open" ] === true )
	{
		var self = this;
		window.setTimeout( function() { self.panel.show(); }, 100 );
	}
};

netgis.SearchParcel.prototype.attachTo = function( parent )
{
	this.panel.attachTo( parent );
	this.popup.attachTo( parent );
	
	parent.addEventListener( netgis.Events.CLIENT_SET_MODE, this.onClientSetMode.bind( this ) );
	parent.addEventListener( netgis.Events.SEARCHPARCEL_TOGGLE, this.onSearchParcelToggle.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_FEATURE_ENTER, this.onMapFeatureEnter.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_FEATURE_CLICK, this.onMapFeatureClick.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_FEATURE_LEAVE, this.onMapFeatureLeave.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_COPY_FEATURE_TO_EDIT, this.onMapCopyFeatureToEdit.bind( this ) );
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
	button.className = "netgis-color-e netgis-hover-a netgis-text-a netgis-hover-text-e";
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
	row.className = "netgis-color-d netgis-shadow";
	head.appendChild( row );
	
	// Filter Checkbox
	var th = document.createElement( "th" );
	row.appendChild( th );
	
	var input = document.createElement( "input" );
	input.setAttribute( "type", "checkbox" );
	input.addEventListener( "change", this.onTableFilterChange.bind( this ) );
	input.setAttribute( "title", "Nur markierte Parzellen anzeigen" );
	th.appendChild( input );
	
	this.tableFilter = input;
	
	// Header Columns
	for ( var i = 0; i < columnNames.length; i++ )
	{
		th = document.createElement( "th" );
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
	// TODO: store geometry data on element vs. seperate data array ?
	
	var tr = document.createElement( "tr" );
	tr.className = "netgis-hover-d";
	tr.setAttribute( "title", "Klicken zum zoomen" );
	tr.setAttribute( "data-id", id );
	tr.setAttribute( "data-field", field );
	tr.setAttribute( "data-parcel-a", parcelA );
	tr.setAttribute( "data-parcel-b", parcelB );
	tr.setAttribute( "data-bbox", bbox );
	tr.setAttribute( "data-geom", geom );
	tr.addEventListener( "pointerenter", this.onParcelEnter.bind( this ) );
	tr.addEventListener( "pointerleave", this.onParcelLeave.bind( this ) );
	tr.addEventListener( "click", this.onParcelClick.bind( this ) );
	
	var buttonCell = document.createElement( "td" );
	tr.appendChild( buttonCell );
	
	//if ( this.client.editable ) // TODO: how to prevent importing geoms if not editable ?
	{
		var importButton = document.createElement( "button" );
		importButton.setAttribute( "type", "button" );
		importButton.setAttribute( "title", "Geometrie übernehmen" );
		importButton.addEventListener( "click", this.onParcelImportClick.bind( this ) );
		importButton.className = "netgis-hover-a";
		importButton.innerHTML = "<i class='fas fa-paste'></i>";
		buttonCell.appendChild( importButton );
	}
	
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
	idCell.innerHTML = netgis.util.trim( id, "_" );
	tr.appendChild( idCell );
	
	var areaCell = document.createElement( "td" );
	areaCell.innerHTML = area;
	tr.appendChild( areaCell );
	
	return tr;
};

netgis.SearchParcel.prototype.reset = function()
{
	this.hideBottom();
	
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
	this.tableFilter.checked = false;
	this.parcelList.classList.remove( "netgis-filter-active" );
	this.selected = {};
	
	this.parcelReset.classList.add( "netgis-hide" );
	
	this.parcelCount.innerHTML = "";
	
	var self = this;
	window.setTimeout( function() { self.top.scrollTop = 0; self.parcelTable.scrollTop = 0; }, 10 );
	
	netgis.util.invoke( this.container, netgis.Events.SEARCHPARCEL_RESET, null );
	
	if ( this.panel.visible() )
	{
		this.showDistricts( true );
	}
	
	this.showFields( false );
	this.showParcels( false );
};

netgis.SearchParcel.prototype.showDistricts = function( on )
{
	if ( on )
	{
		netgis.util.invoke( this.container, netgis.Events.MAP_LAYER_TOGGLE, { id: this.districtsLayerID, on: true } );
		netgis.util.invoke( this.container, netgis.Events.MAP_ZOOM_LEVEL, { z: this.config[ "searchparcel" ][ "districts_service" ][ "min_zoom" ] } );
	}
	else
	{
		netgis.util.invoke( this.container, netgis.Events.MAP_LAYER_TOGGLE, { id: this.districtsLayerID, on: false } );
	}
};

netgis.SearchParcel.prototype.showFields = function( on, geojson )
{
	if ( on )
	{
		// TODO: parcels WFS delivers UTM coords, but OL detects EPSG:4326
		// NOTE: "crs":{"type":"name","properties":{"name":"urn:ogc:def:crs:EPSG::25832"}}
		
		geojson[ "crs" ] = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::25832" } };
	
		this.fieldsLayer[ "data" ] = geojson;
	
		netgis.util.invoke( this.container, netgis.Events.MAP_LAYER_TOGGLE, { id: this.fieldsLayerID, on: true } );
		netgis.util.invoke( this.container, netgis.Events.MAP_ZOOM_LAYER, { id: this.fieldsLayerID } );
	}
	else
	{
		netgis.util.invoke( this.container, netgis.Events.MAP_LAYER_TOGGLE, { id: this.fieldsLayerID, on: false } );
		
		this.fieldsLayer[ "data" ] = null;
	}
};

netgis.SearchParcel.prototype.showParcels = function( on, data )
{
	if ( on )
	{
		var features = [];
		
		for ( var i = 0; i < data.length; i++ )
		{
			var item = data[ i ];
			
			var feature =
			{
				id: item[ "fsk" ],
				geometry: item[ "geometry" ],
				properties:
				{
					"flaeche": item[ "flaeche" ],
					"fln": item[ "fln" ],
					"fsk": item[ "fsk" ],
					"fsn_nen": item[ "fsn_nen" ],
					"fsn_zae": item[ "fsn_zae" ]
				}
			};
	
			features.push( feature );
		}
		
		this.parcelsLayer[ "data" ] = features;
	
		netgis.util.invoke( this.container, netgis.Events.MAP_LAYER_TOGGLE, { id: this.parcelsLayerID, on: true } );
		netgis.util.invoke( this.container, netgis.Events.MAP_ZOOM_LAYER, { id: this.parcelsLayerID } );
	}
	else
	{
		netgis.util.invoke( this.container, netgis.Events.MAP_LAYER_TOGGLE, { id: this.parcelsLayerID, on: false } );
	}
};

netgis.SearchParcel.prototype.onSearchParcelToggle = function( e )
{
	this.panel.toggle();
};

netgis.SearchParcel.prototype.onClientSetMode = function( e )
{
	var params = e.detail;
	
	this.popup.clearContent();
	this.popup.hide();
	
	if ( params.mode === netgis.Modes.SEARCH_PARCEL )
	{
		this.reset();
	}
	else
	{
		this.showDistricts( false );
		this.showFields( false );
		this.showParcels( false );
	}
};

netgis.SearchParcel.prototype.onPanelToggle = function( e )
{
	var params = e.detail;
	
	if ( params.visible === false )
	{
		netgis.util.invoke( this.panel.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.VIEW } );
	}
	else
	{
		netgis.util.invoke( this.panel.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.SEARCH_PARCEL } );
	}
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
	
	var url = this.config[ "searchparcel" ][ "name_url" ];
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
	this.parcelReset.classList.remove( "netgis-hide" );
	
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
	
	this.requestFields( id );
};

netgis.SearchParcel.prototype.requestFields = function( districtID )
{
	var service = this.config[ "searchparcel" ][ "fields_service" ];
		
	var url = service[ "url" ];
	url += "service=WFS";
	url += "&version=1.0.0";
	url += "&request=GetFeature";
	url += "&outputFormat=application/json; subtype=geojson";
	url += "&typename=" + service[ "name" ];
	url += "&filter=<Filter><PropertyIsEqualTo>";
	url += "<PropertyName>" + service[ "filter_property" ] + "</PropertyName>";
	url += "<Literal>" + districtID + "</Literal>";
	url += "</PropertyIsEqualTo></Filter>";
	
	netgis.util.request( url, this.onFieldsResponse.bind( this ) );
};

netgis.SearchParcel.prototype.onFieldsResponse = function( data )
{
	var json = JSON.parse( data );
	
	this.showDistricts( false );
	this.showFields( true, json );
	this.showParcels( false );
};

netgis.SearchParcel.prototype.selectFirstName = function()
{
	var buttons = this.nameList.getElementsByTagName( "button" );
	
	if ( buttons.length > 0 )
	{
		buttons[ 0 ].click();
	}
};

netgis.SearchParcel.prototype.setDistrict = function( name, id )
{
	this.nameInput.value = name;
	this.districtInput.value = id;
	
	this.requestFields( id );
};

netgis.SearchParcel.prototype.setFieldNumber = function( fnr )
{
	this.fieldInput.value = fnr;
	
	this.onParcelSearchClick();
};

netgis.SearchParcel.prototype.setParcelNumber = function( a, b )
{
	this.parcelInputA.value = a;
	this.parcelInputB.value = b;
	
	this.onParcelSearchClick();
};

netgis.SearchParcel.prototype.showBottom = function()
{
	this.top.classList.add( "netgis-resize-bottom" );
	this.top.style.height = "50%";
	this.top.style.bottom = "auto";
	
	this.bottom.classList.remove( "netgis-hide" );
};

netgis.SearchParcel.prototype.hideBottom = function()
{
	this.top.classList.remove( "netgis-resize-bottom" );
	this.top.style.height = "auto";
	this.top.style.bottom = "0mm";
	
	this.bottom.classList.add( "netgis-hide" );
};

netgis.SearchParcel.prototype.onInputFieldKey = function( e )
{
	switch ( e.keyCode )
	{
		// Enter
		case 13:
		{
			this.onParcelSearchClick();
			break;
		}
	}
};

netgis.SearchParcel.prototype.onParcelSearchClick = function( e )
{
	this.requestParcels
	(
		this.districtInput.value.trim(),
		this.fieldInput.value.trim(),
		this.parcelInputA.value.trim(),
		this.parcelInputB.value.trim()
	);
};

netgis.SearchParcel.prototype.requestParcels = function( district, field, parcelA, parcelB )
{
	var url = this.config[ "searchparcel" ][ "parcel_url" ];
	
	url = netgis.util.replace( url, "{district}", district ? district : "" );
	url = netgis.util.replace( url, "{field}", field ? field : "" );
	url = netgis.util.replace( url, "{parcelA}", parcelA ? parcelA : "" );
	url = netgis.util.replace( url, "{parcelB}", parcelB ? parcelB : "" );
	
	// Reset Parcels Tables
	this.parcelTable.classList.add( "netgis-hide" );
	this.parcelList.innerHTML = "";
	this.parcelList.classList.remove( "netgis-filter-active" );
	this.tableFilter.checked = false;
	this.selected = {};
	this.parcelInfo.innerHTML = "Suche Flurstücke...";
	
	netgis.util.request( url, this.onParcelsResponse.bind( this ) );
};

netgis.SearchParcel.prototype.updateTableRows = function()
{
	var list = this.parcelList;
	var rows = list.getElementsByTagName( "tr" );
	
	for ( var i = 0; i < rows.length; i++ )
	{
		var tr = rows[ i ];
		var rid = tr.getAttribute( "data-id" );
		var button = tr.getElementsByTagName( "button" )[ 0 ];
		
		if ( this.selected[ rid ] === true )
		{
			tr.classList.add( "netgis-active", "netgis-text-a", "netgis-hover-text-a" );
			
			button.setAttribute( "disabled", "disabled" );
			button.setAttribute( "title", "Geometrie bereits übernommen" );
			button.classList.remove( "netgis-hover-a" );
		}
		else
		{
			tr.classList.remove( "netgis-active", "netgis-text-a", "netgis-hover-text-a" );
			
			button.removeAttribute( "disabled" );
			button.setAttribute( "title", "Geometrie übernehmen" );
			button.classList.add( "netgis-hover-a" );
		}
	}
};

netgis.SearchParcel.prototype.onParcelsResponse = function( data )
{
	var json = JSON.parse( data );
	
	this.parcelCount.innerHTML = "(" + json[ "count" ] + ")";
	
	if ( json.count === 0 )
	{
		// TODO: if ( json.count === 0 ) -> json.Info
		this.parcelInfo.innerHTML = json[ "Info" ];
	}
	else
	{
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
		
		this.showBottom();
		
		this.showDistricts( false );
		this.showFields( false );
		this.showParcels( true, json.data );
	}
	
	if ( ! this.container.classList.contains( "netgis-hide" ) )
		this.parcelTable.scrollIntoView();
};

netgis.SearchParcel.prototype.onParcelEnter = function( e )
{
	var tr = e.target;
	var geom = tr.getAttribute( "data-geom" );
	
	var data =
	{
		id: tr.getAttribute( "data-id" ),
		field: tr.getAttribute( "data-field" ),
		parcelA: tr.getAttribute( "data-parcel-a" ),
		parcelB: tr.getAttribute( "data-parcel-b" ),
		geom: geom
	};
	
	netgis.util.invoke( this.container, netgis.Events.SEARCHPARCEL_ITEM_ENTER, data );
};

netgis.SearchParcel.prototype.onParcelLeave = function( e )
{
	var tr = e.target;
		
	netgis.util.invoke( this.container, netgis.Events.SEARCHPARCEL_ITEM_LEAVE, { id: tr.getAttribute( "data-id" ) } );
};

netgis.SearchParcel.prototype.onParcelClick = function( e )
{
	var tr = e.currentTarget;
	
	netgis.util.invoke( this.container, netgis.Events.SEARCHPARCEL_ITEM_CLICK, { id: tr.getAttribute( "data-id" ) } );
};

netgis.SearchParcel.prototype.onParcelImportClick = function( e )
{
	e.stopPropagation();
	
	var tr = e.currentTarget.parentElement.parentElement;
	var id = tr.getAttribute( "data-id" );
	var geom = tr.getAttribute( "data-geom" );
	
	netgis.util.invoke( this.container, netgis.Events.MAP_COPY_FEATURE_TO_EDIT, { source: this.parcelsLayerID, id: id } );
};

netgis.SearchParcel.prototype.onResetClick = function( e )
{
	this.reset();
};

netgis.SearchParcel.prototype.onTopResize = function( e )
{
	if ( this.bottom.classList.contains( "netgis-hide" ) ) return;
	
	var rect = this.top.getBoundingClientRect();
	var parent = this.top.parentNode.getBoundingClientRect();
	var top = rect.bottom - parent.top;
	
	this.bottom.style.top = top + "px";
};

netgis.SearchParcel.prototype.onBottomHeaderClick = function( e )
{
	this.reset();
};

netgis.SearchParcel.prototype.onMapFeatureEnter = function( e )
{
	var map = e.target;
	var params = e.detail;
	
	switch ( params.layer )
	{
		case this.districtsLayerID:
		{
			var title = params.properties[ "gemarkung" ];
			map.setAttribute( "title", title );
			break;
		}
		
		case this.fieldsLayerID:
		{
			var title = params.properties[ "flurname" ];
			map.setAttribute( "title", title );
			break;
		}
		
		case this.parcelsLayerID:
		{
			var title = "Flur: " + params.properties[ "fln" ] + " / Zähler: " + params.properties[ "fsn_zae" ] + " / Nenner: " + params.properties[ "fsn_nen" ];
			map.setAttribute( "title", title );
			
			break;
		}
	}
};

netgis.SearchParcel.prototype.onMapFeatureClick = function( e )
{
	var params = e.detail;
	
	// TODO: after copying feature info results in double entries ?
	
	this.popup.hide();
	
	switch ( params.layer )
	{
		case this.districtsLayerID:
		{
			var name = params.properties[ "gemarkung" ] + " (" + params.properties[ "ldkreis" ] + ")";
			var nr = params.properties[ "gmkgnr" ];
			this.setDistrict( name, nr );
			
			break;
		}
		
		case this.fieldsLayerID:
		{
			var fnr = params.properties[ "flur" ];
			this.setFieldNumber( fnr );
			
			break;
		}
		
		case this.parcelsLayerID:
		{			
			//if ( this.editable === true )
			{
				var id = params.properties[ "fsk" ];
				
				if ( ! this.selected[ id ] )
				{
					// Popup
					if ( this.popup.container !== params.overlay )
					{
						this.popup.attachTo( params.overlay );
					}
					
					var html = "<table style='margin: 1mm;'>";
					html += "<tr><th>Flur:</th><td>" + params.properties[ "fln" ] + "</td>";
					html += "<tr><th>Zähler:</th><td>" + params.properties[ "fsn_zae" ] + "</td>";
					html += "<tr><th>Nenner:</th><td>" + params.properties[ "fsn_nen" ] + "</td>";
					html += "<tr><th>Fläche:</th><td>" + params.properties[ "flaeche" ] + " qm</td>";
					html += "</table>";
					html += "<button type='button' class='netgis-hover-a'><i class='netgis-icon fas fa-paste' style='margin-right: 3mm;'></i><span>Geometrie übernehmen</span></button>";
				   
					this.popup.setContent( html );
					
					var button = this.popup.content.getElementsByTagName( "button" )[ 1 ];
					button.setAttribute( "data-id", id );
					button.addEventListener( "click", this.onParcelPopupButtonClick.bind( this ) );
					
					this.popup.show();
				}
			}
			
			break;
		}
	}
};

netgis.SearchParcel.prototype.onParcelPopupButtonClick = function( e )
{
	var button = e.currentTarget;
	var id = button.getAttribute( "data-id" );
	
	netgis.util.invoke( this.container, netgis.Events.MAP_COPY_FEATURE_TO_EDIT, { source: this.parcelsLayerID, id: id } );
	
	this.popup.hide();
};

netgis.SearchParcel.prototype.onMapFeatureLeave = function( e )
{
	var map = e.target;
	var params = e.detail;
	
	switch ( params.layer )
	{
		case this.districtsLayerID:
		case this.fieldsLayerID:
		{
			map.setAttribute( "title", "" );
			break;
		}
		
		case this.parcelsLayerID:
		{
			map.setAttribute( "title", "" );			
			break;
		}
	}
};

netgis.SearchParcel.prototype.onMapCopyFeatureToEdit = function( e )
{
	var params = e.detail;
	var id = params.id;
	
	if ( params.source !== this.parcelsLayerID ) return;
	
	if ( ! this.selected[ id ] ) this.selected[ id ] = true;
	
	this.updateTableRows();
};

netgis.SearchParcel.prototype.onTableFilterChange = function( e )
{
	var input = e.currentTarget;
	var on = input.checked;
	
	this.parcelList.classList.toggle( "netgis-filter-active", on );
};