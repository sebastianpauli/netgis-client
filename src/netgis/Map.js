"use strict";

var netgis = netgis || {};

//TODO: this common Map class is probably deprecated, no need for inheritance ?

netgis.Map = function()
{
	this.client = null;
	this.root = null;
	this.attribution = null;
};

netgis.Map.prototype.load = function()
{
	this.root = document.createElement( "section" );
	this.root.className = "netgis-map";
	
	this.client.root.appendChild( this.root );
};