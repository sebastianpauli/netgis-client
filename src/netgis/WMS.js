"use strict";

var netgis = netgis || {};

/**
 * Web Map Service Helper Functions
 * 
 * @global
 * @memberof netgis
 */
netgis.WMS =
{
	parseCapabilities: function( data )
	{
		var results =
		{
			layers: [],
			requests: {}
		};
		
		var parser = new DOMParser();
		var xml = parser.parseFromString( data, "text/xml" );
		var cap = xml.getElementsByTagName( "Capability" )[ 0 ];
		
		// Requests
		var requests = cap.getElementsByTagName( "Request" );
		
		if ( requests.length > 0 )
		{
			requests = requests[ 0 ];
			
			var getmap = requests.getElementsByTagName( "GetMap" );
			
			if ( getmap.length > 0 )
			{
				getmap = getmap[ 0 ];
				
				var url = null;
				var get = getmap.getElementsByTagName( "Get" );
				if ( get.length > 0 ) url = get[ 0 ].getElementsByTagName( "OnlineResource" )[ 0 ].getAttribute( "xlink:href" );
				
				var format = [];
				var formats = getmap.getElementsByTagName( "Format" );
				for ( var f = 0; f < formats.length; f++ )
					format.push( formats[ f ].innerHTML );
				
				results.requests[ "map" ] = { url: url, format: format };
			}
			
			var getinfo = requests.getElementsByTagName( "GetFeatureInfo" );
			
			if ( getinfo.length > 0 )
			{
				getinfo = getinfo[ 0 ];
				
				var url = null;
				var get = getinfo.getElementsByTagName( "Get" );
				if ( get.length > 0 ) url = get[ 0 ].getElementsByTagName( "OnlineResource" )[ 0 ].getAttribute( "xlink:href" );
				
				var format = [];
				var formats = getinfo.getElementsByTagName( "Format" );
				for ( var f = 0; f < formats.length; f++ )
					format.push( formats[ f ].innerHTML );
				
				results.requests[ "info" ] = { url: url, format: format };
			}
		}
		
		// Layers
		var layers = cap.getElementsByTagName( "Layer" );
		
		for ( var i = 0; i < layers.length; i++ )
		{
			var layer = layers[ i ];
			
			if ( layer.parentNode !== cap ) continue;
			
			results.layers.push( this.parseLayer( layer, true ) );
		}
		
		//console.info( "WMS PARSE CAPS:", results );
		
		return results;
	},
	
	parseLayer: function( layer, recursive )
	{
		// Metadata
		var name = this.getChildString( layer, "Name" );
		var title = this.getChildString( layer, "Title" );
		var abstract = this.getChildString( layer, "Abstract" );
		var queryable = ( layer.getAttribute( "queryable" ) === "1" );
		
		// Bounds
		var bounds = this.getChild( layer, "LatLonBoundingBox" );

		if ( bounds )
		{
			bounds =
			[
				Number.parseFloat( bounds.getAttribute( "minx" ) ),
				Number.parseFloat( bounds.getAttribute( "miny" ) ),
				Number.parseFloat( bounds.getAttribute( "maxx" ) ),
				Number.parseFloat( bounds.getAttribute( "maxy" ) )
			];
		}
		
		// Legend
		var legend = layer.getElementsByTagName( "LegendURL" );

		if ( legend.length > 0 )
		{
			legend = legend[ 0 ].getElementsByTagName( "OnlineResource" );

			if ( legend.length > 0 )
				legend = legend[ 0 ].getAttribute( "xlink:href" );
			else
				legend = null;
		}
		else
		{
			legend = null;
		}
		
		var result =
		{
			//parent: parentName,
			name: name,
			title: title,
			abstract: abstract,
			queryable: queryable,
			bounds: bounds,
			legend: legend,
			children: []
		};
		
		// Children
		if ( recursive )
		{
			var layers = layer.getElementsByTagName( "Layer" );

			for ( var i = 0; i < layers.length; i++ )
			{
				var child = layers[ i ];

				if ( child.parentNode !== layer ) continue;

				result.children.push( this.parseLayer( child, true ) );
			}
		}
		
		return result;
	},
	
	getChild: function( parent, name )
	{
		var el = parent.getElementsByTagName( name );
		
		if ( el.length === 0 ) return null;
		
		el = el[ 0 ];
		if ( el.parentNode !== parent ) return null;
		
		return el;
	},
	
	getChildString: function( parent, name )
	{
		var el = this.getChild( parent, name );
		
		if ( ! el ) return null;
		
		return el.innerHTML;
	}
};