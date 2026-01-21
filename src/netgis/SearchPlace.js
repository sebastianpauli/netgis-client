"use strict";

var netgis = netgis || {};

/**
 * Search Place Module.
 * @param {JSON} config [SearchPlace.Config]{@link netgis.SearchPlace.Config}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.SearchPlace = function( config )
{
	this.config = config;
	
	this.initElements();
	this.initEvents();
	this.initConfig( config );
};

/**
 * Config Section "searchplace"
 * @memberof netgis.SearchPlace
 * @enum
 */
netgis.SearchPlace.Config =
{
	/**
	 * Search input placeholder title
	 * @type String
	 */
	"title": "Search...",
	
	/**
	 * URL to send search requests to, should contain <code>{query}</code> placeholder
	 * @type String
	 */
	"url": "",
	
	/**
	 * Default zoom level for search results
	 * @type Number
	 */
	"zoom": 17,
	
	/**
	 * Marker color for search results in CSS format
	 * @type String
	 */
	"marker_color": "darkgray",
	
	/**
	 * Marker title for search results
	 * @type String
	 */
	"marker_title": "Search-Result"
};

netgis.SearchPlace.prototype.initElements = function()
{
	this.search = new netgis.Search( "" );
	
	this.container = this.search.container;
	this.container.classList.add( "netgis-search-place", "netgis-responsive" );
	
	this.search.container.addEventListener( netgis.Events.SEARCH_CHANGE, this.onSearchChange.bind( this ) );
	this.search.container.addEventListener( netgis.Events.SEARCH_SELECT, this.onSearchSelect.bind( this ) );
	this.search.container.addEventListener( netgis.Events.SEARCH_CLEAR, this.onSearchClear.bind( this ) );
};

netgis.SearchPlace.prototype.initEvents = function()
{
};

netgis.SearchPlace.prototype.initConfig = function( config )
{
	var cfg = config[ "searchplace" ];
	
	if ( ! cfg ) return;
	
	if ( cfg[ "title" ] ) this.search.setTitle( cfg[ "title" ] );
};

netgis.SearchPlace.prototype.attachTo = function( parent )
{
	this.search.attachTo( parent );
	
	parent.addEventListener( netgis.Events.SEARCHPLACE_TOGGLE, this.onSearchPlaceToggle.bind( this ) );
};

netgis.SearchPlace.prototype.onSearchPlaceToggle = function( e )
{
	var params = e.detail;
	
	if ( params && params.on )
		this.search.show();
	else
		this.search.toggle();
	
	// Auto Focus
	if ( this.search.isVisible() )
	{
		var search = this.search;
		window.setTimeout( function() { search.focus(); }, 200 );
	}
};

netgis.SearchPlace.prototype.onSearchChange = function( e )
{
	var params = e.detail;
	
	var cfg = this.config[ "searchplace" ];
	
	if ( ! cfg ) return;
	if ( ! cfg[ "url" ] ) return;
	
	var url = cfg[ "url" ];
	url = netgis.util.replace( url, "{query}", window.encodeURIComponent( params.query ) );
	url = netgis.util.replace( url, "{epsg}", 4326 ); // 25823 ?
	
	netgis.util.request( url, this.onSearchResponse.bind( this ) );
};

netgis.SearchPlace.prototype.onSearchResponse = function( data )
{
	var json = JSON.parse( data );
	
	this.search.clearResults();
	
	var empty = true;
	
	if ( json[ "geonames" ] )
	{
		// Old Geoportal API
		var results = json[ "geonames" ];
		
		for ( var i = 0; i < results.length; i++ )
		{
			var result = results[ i ];
			var title = result[ "title" ];
			
			var minx = Number.parseFloat( result[ "minx" ] );
			var miny = Number.parseFloat( result[ "miny" ] );
			var maxx = Number.parseFloat( result[ "maxx" ] );
			var maxy = Number.parseFloat( result[ "maxy" ] );
			
			var lon = ( minx + maxx ) * 0.5;
			var lat = ( miny + maxy ) * 0.5;

			var resultData =
			{
				type: result[ "category" ],
				id: i,
				title: title,
				lon: lon,
				lat: lat,
				minlon: minx,
				minlat: miny,
				maxlon: maxx,
				maxlat: maxy
			};

			this.search.addResult( title, JSON.stringify( resultData ) );
			
			empty = false;
		}
	}
	else if ( json[ "data" ] )
	{
		// New Search API
		var results = json[ "data" ];

		for ( var i = 0; i < results.length; i++ )
		{
			var result = results[ i ];
			var title = result[ "name" ];
			
			var lon = Number.parseFloat( result[ "wgs_x" ] );
			var lat = Number.parseFloat( result[ "wgs_y" ] );

			var resultData =
			{
				type: "street",
				id: result[ "strid" ],
				title: title,
				lon: lon,
				lat: lat,
				minlon: lon - 0.001,
				minlat: lat - 0.001,
				maxlon: lon + 0.001,
				maxlat: lat + 0.001
			};

			this.search.addResult( title, JSON.stringify( resultData ) );
			
			empty = false;
		}
	}
	
	if ( empty )
	{
		this.search.input.classList.add( "netgis-round" );
		this.search.container.classList.remove( "netgis-round" );
	}
	else
	{
		this.search.input.classList.remove( "netgis-round" );
		this.search.container.classList.add( "netgis-round" );
	}
};

netgis.SearchPlace.prototype.onSearchSelect = function( e )
{
	var params = e.detail;
	var data = JSON.parse( params.data );
	
	////netgis.util.invoke( this.container, netgis.Events.MAP_ZOOM_LONLAT, { lon: data.lon, lat: data.lat, zoom: this.config[ "searchplace" ][ "zoom" ] } );
	
	netgis.util.invoke( this.container, netgis.Events.SEARCHPLACE_SELECT, data );
	
	// Search Detail Request
	if ( data.type === "street" )
	{
		var url = this.config[ "searchplace" ][ "url_detail" ];

		if ( url )
		{
			// TODO: replace all result props to support any url variable (like popup html) ?

			url = netgis.util.replace( url, "{id}", data.id );
			netgis.util.request( url, this.onSearchDetailResponse.bind( this ) );
		}
	}
};

netgis.SearchPlace.prototype.onSearchDetailResponse = function( data )
{
	var json = JSON.parse( data );
	var results = json[ "hsnrarr" ];
	
	if ( results.length === 0 ) return;
	
	this.search.clearResults();
	
	for ( var i = 0; i < results.length; i++ )
	{
		var result = results[ i ];
		var title = json[ "strname" ] + " " + result[ "hsnr" ];
		
		var resultData =
		{
			type: "address",
			lon: Number.parseFloat( result[ "wgs_x" ] ),
			lat: Number.parseFloat( result[ "wgs_y" ] )
		};
		
		this.search.addResult( title, JSON.stringify( resultData ) );
	}
};

netgis.SearchPlace.prototype.onSearchClear = function( e )
{
	this.search.input.classList.add( "netgis-round" );
	this.search.container.classList.remove( "netgis-round" );
	
	netgis.util.invoke( this.container, netgis.Events.SEARCHPLACE_CLEAR, null );
};