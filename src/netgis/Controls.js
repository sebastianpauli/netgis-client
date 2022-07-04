"use strict";

var netgis = netgis || {};

netgis.Controls = function()
{
	this.client = null;
};

netgis.Controls.prototype.load = function()
{
	this.root = document.createElement( "section" ); // header?
	this.root.className = "netgis-controls";
	
	/*var controls = document.createElement( "div" );
	controls.className = "netgis-controls";
	this.root.appendChild( controls );*/
	
	var zoomIn = document.createElement( "button" );
	zoomIn.setAttribute( "type", "button" );
	zoomIn.innerHTML = "<i class='fas fa-search-plus'></i>";
	zoomIn.title = "Hineinzoomen";
	zoomIn.addEventListener( "click", this.onZoomIn.bind( this ) );
	this.root.appendChild( zoomIn );
	
	var zoomOut = document.createElement( "button" );
	zoomOut.setAttribute( "type", "button" );
	zoomOut.innerHTML = "<i class='fas fa-search-minus'></i>";
	zoomOut.title = "Herauszoomen";
	zoomOut.addEventListener( "click", this.onZoomOut.bind( this ) );
	this.root.appendChild( zoomOut );
	
	/*var settings = document.createElement( "button" );
	settings.innerHTML = "<i class='fas fa-cog'></i>";
	settings.title = "Einstellungen";
	settings.addEventListener( "click", this.onSettings.bind( this ) );
	this.root.appendChild( settings );*/
	
	this.client.root.appendChild( this.root );
};

netgis.Controls.prototype.onZoomIn = function( e )
{
	//this.view.adjustZoom( 1.0 );
	////this.view.animate( { zoom: this.view.getZoom() + 1.0, duration: 200 } );
	this.client.invoke( netgis.Events.MAP_CHANGE_ZOOM, 1.0 );
};

netgis.Controls.prototype.onZoomOut = function( e )
{
	//this.view.adjustZoom( -1.0 );
	////this.view.animate( { zoom: this.view.getZoom() - 1.0, duration: 200 } );
	this.client.invoke( netgis.Events.MAP_CHANGE_ZOOM, -1.0 );
};

netgis.Controls.prototype.onSettings = function( e )
{
	alert( "TODO: settings dialog" );
};