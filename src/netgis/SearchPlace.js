"use strict";

var netgis = netgis || {};

netgis.SearchPlace = function()
{
	this.client = null;
	this.timeout = null;
	this.lastRequest = null;
};

netgis.SearchPlace.prototype.load = function()
{
	this.client.on( netgis.Events.SEARCH_PLACE_REQUEST, this.onSearchPlaceRequest.bind( this ) );
};

netgis.SearchPlace.prototype.request = function( query )
{	
	//NOTE: https://www.geoportal.rlp.de/mapbender/geoportal/gaz_geom_mobile.php?outputFormat=json&resultTarget=web&searchEPSG=25832&maxResults=5&maxRows=5&searchText=trier&featureClass=P&style=full&name_startsWith=trier
	
	//TODO: get url with query template from config
	////var url = "https://www.geoportal.rlp.de/mapbender/geoportal/gaz_geom_mobile.php?outputFormat=json&resultTarget=web&searchEPSG={epsg}&maxResults=5&maxRows=5&featureClass=P&style=full&searchText={q}&name_startsWith={q}";
	////url = "./proxy.php?" + url;
	
	if ( this.client.config.search && this.client.config.search.url )
	{
		var url = this.client.config.search.url;

		var q = query;
		q = q.trim();

		url = netgis.util.replace( url, "{q}", window.encodeURIComponent( q ) );
		url = netgis.util.replace( url, "{epsg}", 4326 ); // 25823
		url = window.encodeURI( url );

		this.lastRequest = netgis.util.request( url, this.onSearchPlaceResponse.bind( this ) );
	}
	else
	{
		console.warn( "No search API url configured for place search!" );
	}
};

netgis.SearchPlace.prototype.onSearchPlaceRequest = function( e )
{	
	var query = e.query;
	var self = this;
	
	// Debounce Request
	if ( this.lastRequest ) this.lastRequest.abort();
	if ( this.timeout ) window.clearTimeout( this.timeout );
	this.timeout = window.setTimeout( function() { self.request( query ); }, 300 );
};

netgis.SearchPlace.prototype.onSearchPlaceResponse = function( data )
{
	var json = JSON.parse( data );
	this.client.invoke( netgis.Events.SEARCH_PLACE_RESPONSE, json );
};