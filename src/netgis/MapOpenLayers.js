/* global ol, jsts, shp, proj4 */

"use strict";

var netgis = netgis || {};

/**
 * Map module implementation for OpenLayers 6+.
 */
netgis.MapOpenLayers = function()
{
	netgis.Map.call( this );
	
	this.mode = null;
	this.toolbars = {};
	this.view = null;
	this.map = null;
	this.layers = [];
	this.interactions = {};
	this.snap = null;
	this.snapFeatures = null;
	this.editLayer = null;
	this.parcelLayer = null;
	
	this.hover = null;
	this.selected = null;
	this.sketch = null;
	
	this.editEventsSilent = false;
	
	this.importLayerID = 20000;
	this.editLayerID = 30000;
	this.labelFont = "4mm Verdana, sans-serif";
	this.drawBufferRadius = 100.0;
	this.drawBufferSegments = 3;
};

netgis.MapOpenLayers.prototype = Object.create( netgis.Map.prototype );
netgis.MapOpenLayers.prototype.constructor = netgis.MapOpenLayers;

//TODO: not much benefits from Map class inheritance, may be dropped soon

netgis.MapOpenLayers.prototype.load = function()
{
	// Elements
	netgis.Map.prototype.load.call( this ); //TODO: ?
	
	this.dropTarget = document.createElement( "div" );
	this.dropTarget.className = "netgis-drop-target netgis-hide";
	this.dropTarget.innerHTML = "Datei hier ablegen!";
	this.root.appendChild( this.dropTarget );
	
	this.root.addEventListener( "dragenter", this.onDragEnter.bind( this ) );
	this.root.addEventListener( "dragover", this.onDragEnter.bind( this ) );
	this.root.addEventListener( "dragend", this.onDragLeave.bind( this ) );
	this.root.addEventListener( "dragleave", this.onDragLeave.bind( this ) );
	this.root.addEventListener( "drop", this.onDragDrop.bind( this ) );
	
	// Map Renderer
	this.initMap();
	this.initDefaultLayers();
	this.initInteractions();
	
	// Events
	this.client.on( netgis.Events.CONTEXT_UPDATE, this.onContextUpdate.bind( this ) );
	this.client.on( netgis.Events.MAP_UPDATE_STYLE, this.onUpdateStyle.bind( this ) );
	this.client.on( netgis.Events.EDIT_FEATURES_LOADED, this.onEditFeaturesLoaded.bind( this ) );
	this.client.on( netgis.Events.SET_MODE, this.onSetMode.bind( this ) );
	this.client.on( netgis.Events.SNAP_ON, this.onSnapOn.bind( this ) );
	this.client.on( netgis.Events.SNAP_OFF, this.onSnapOff.bind( this ) );
	this.client.on( netgis.Events.TRACING_ON, this.onTracingOn.bind( this ) );
	this.client.on( netgis.Events.TRACING_OFF, this.onTracingOff.bind( this ) );
	this.client.on( netgis.Events.LAYER_SHOW, this.onLayerShow.bind( this ) );
	this.client.on( netgis.Events.LAYER_HIDE, this.onLayerHide.bind( this ) );
	this.client.on( netgis.Events.MAP_ZOOM_WKT, this.onZoomWKT.bind( this ) );
	this.client.on( netgis.Events.MAP_SET_EXTENT, this.onSetExtent.bind( this ) );
	this.client.on( netgis.Events.MAP_CHANGE_ZOOM, this.onChangeZoom.bind( this ) );
	this.client.on( netgis.Events.BUFFER_CHANGE, this.onBufferChange.bind( this ) );
	this.client.on( netgis.Events.BUFFER_ACCEPT, this.onBufferAccept.bind( this ) );
	this.client.on( netgis.Events.BUFFER_CANCEL, this.onBufferCancel.bind( this ) );
	this.client.on( netgis.Events.IMPORT_GEOJSON, this.onImportGeoJSON.bind( this ) );
	this.client.on( netgis.Events.IMPORT_GML, this.onImportGML.bind( this ) );
	this.client.on( netgis.Events.IMPORT_SHAPEFILE, this.onImportShapefile.bind( this ) );
	this.client.on( netgis.Events.IMPORT_WKT, this.onImportWKT.bind( this ) );
	this.client.on( netgis.Events.IMPORT_SPATIALITE, this.onImportSpatialite.bind( this ) );
	this.client.on( netgis.Events.IMPORT_GEOPACKAGE, this.onImportGeopackage.bind( this ) );
	this.client.on( netgis.Events.EXPORT_PDF, this.onExportPDF.bind( this ) );
	this.client.on( netgis.Events.EXPORT_JPEG, this.onExportJPEG.bind( this ) );
	this.client.on( netgis.Events.EXPORT_PNG, this.onExportPNG.bind( this ) );
	this.client.on( netgis.Events.EXPORT_GIF, this.onExportGIF.bind( this ) );
	this.client.on( netgis.Events.PARCEL_SHOW_PREVIEW, this.onParcelShowPreview.bind( this ) );
	this.client.on( netgis.Events.PARCEL_HIDE_PREVIEW, this.onParcelHidePreview.bind( this ) );
	this.client.on( netgis.Events.ADD_SERVICE_WMS, this.onAddServiceWMS.bind( this ) );
	this.client.on( netgis.Events.ADD_SERVICE_WFS, this.onAddServiceWFS.bind( this ) );
	this.client.on( netgis.Events.DRAW_BUFFER_ON, this.onDrawBufferOn.bind( this ) );
	this.client.on( netgis.Events.DRAW_BUFFER_OFF, this.onDrawBufferOff.bind( this ) );
	this.client.on( netgis.Events.DRAW_BUFFER_RADIUS_CHANGE, this.onDrawBufferRadiusChange.bind( this ) );
	this.client.on( netgis.Events.DRAW_BUFFER_SEGMENTS_CHANGE, this.onDrawBufferSegmentsChange.bind( this ) );
};

netgis.MapOpenLayers.prototype.initMap = function()
{
	var config = this.client.config;
	
	// Projections ( WGS / Lon-Lat supported out of the box )
	if ( typeof proj4 !== "undefined" )
	{
		proj4.defs( config.projections );
		proj4.defs( "urn:ogc:def:crs:OGC:1.3:CRS84", proj4.defs( "EPSG:4326" ) );
		ol.proj.proj4.register( proj4 );
	}
	
	// View
	var viewParams =
	{
		projection: config.map.projection,
		center: config.map.center,
		minZoom: config.map.minZoom,
		maxZoom: config.map.maxZoom,
		zoom: config.map.zoom
	};
	
	this.view = new ol.View
	(
		viewParams
	);

	// Map
	this.map = new ol.Map
	(
		{
			target: this.root,
			view: this.view,
			pixelRatio: 1.0,
			moveTolerance: 5,
			controls: []
		}
	);
	
	this.map.on( "pointermove", this.onPointerMove.bind( this ) );
	this.map.on( "click", this.onSingleClick.bind( this ) );
	
	this.map.on( "movestart", this.onMoveStart.bind( this ) );
	this.map.on( "moveend", this.onMoveEnd.bind( this ) );
	
	this.view.on( "change:resolution", this.onChangeResolution.bind( this ) );
};

netgis.MapOpenLayers.prototype.initDefaultLayers = function()
{
	//TODO: why id as z index ?
	
	this.editLayer = new ol.layer.Vector( { source: new ol.source.Vector( { features: [] } ), style: this.styleEdit.bind( this ), zIndex: this.editLayerID } );
	this.map.addLayer( this.editLayer );
	
	this.previewLayer = new ol.layer.Vector( { source: new ol.source.Vector( { features: [] } ), style: this.styleSketch.bind( this ), zIndex: this.editLayerID + 10 } );
	this.map.addLayer( this.previewLayer );
	
	this.parcelLayer = new ol.layer.Vector( { source: new ol.source.Vector( { features: [] } ), style: this.styleParcel.bind( this ), zIndex: this.editLayerID + 20 } );
	this.map.addLayer( this.parcelLayer );
	
	this.editEventsOn();
};

netgis.MapOpenLayers.prototype.editEventsOn = function()
{
	this.editLayer.getSource().on( "addfeature", this.onEditLayerAdd.bind( this ) );
	//this.editLayer.getSource().on( "changefeature", this.onEditLayerChange.bind( this ) ); //TODO: fired on feature style change? use only one style function with selected/hover states?
	this.editLayer.getSource().on( "removefeature", this.onEditLayerRemove.bind( this ) );
};

netgis.MapOpenLayers.prototype.editEventsOff = function()
{
	//NOTE: this doesn't work because OL does not allow removing all listeners and listener function ref is changed by binding
	//NOTE: see this.editEventsCommit
	
	//this.editLayer.getSource().un( "addfeature"/*, this.onEditLayerAdd*/ );
	//this.editLayer.getSource().un( "changefeature", this.onEditLayerChange.bind( this ) ); //TODO: fired on feature style change? use only one style function with selected/hover states?
	//this.editLayer.getSource().un( "removefeature"/*, this.onEditLayerRemove*/ );
};

netgis.MapOpenLayers.prototype.initInteractions = function()
{
	// View
	this.interactions[ netgis.Modes.VIEW ] =
	[
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.PANNING ] = this.interactions[ netgis.Modes.VIEW ];
	this.interactions[ netgis.Modes.ZOOMING_IN ] = this.interactions[ netgis.Modes.VIEW ];
	this.interactions[ netgis.Modes.ZOOMING_OUT ] = this.interactions[ netgis.Modes.VIEW ];
	
	// Draw
	this.interactions[ netgis.Modes.DRAW_POINTS ] =
	[
		new ol.interaction.Draw( { type: "Point", source: this.editLayer.getSource(), style: this.styleSketch.bind( this ) } ),
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.DRAW_POINTS ][ 0 ].on( "drawend", this.onDrawPointsEnd.bind( this ) );
	
	this.interactions[ netgis.Modes.DRAW_LINES ] =
	[
		new ol.interaction.Draw( { type: "LineString", source: this.editLayer.getSource(), style: this.styleSketch.bind( this ) } ),
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.DRAW_LINES ][ 0 ].on( "drawend", this.onDrawLinesEnd.bind( this ) );
	
	this.interactions[ netgis.Modes.DRAW_POLYGONS ] =
	[
		new ol.interaction.Draw( { type: "Polygon", source: this.editLayer.getSource(), style: this.styleSketch.bind( this ) } ),
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	// Edit
	this.interactions[ netgis.Modes.CUT_FEATURE_BEGIN ] =
	[
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.CUT_FEATURE_DRAW ] =
	[
		new ol.interaction.Draw( { type: "Polygon" /*, source: this.editLayer.getSource()*/, style: this.styleSketch.bind( this ) } ),
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.CUT_FEATURE_DRAW ][ 0 ].on( "drawend", this.onCutFeatureDrawEnd.bind( this ) );
	
	this.interactions[ netgis.Modes.MODIFY_FEATURES ] =
	[
		new ol.interaction.Modify( { source: this.editLayer.getSource(), deleteCondition: ol.events.condition.doubleClick, style: this.styleModify.bind( this ) } ),
		new ol.interaction.DragPan( { condition: function( e ) { return ( e.originalEvent.which === 2 ); } } ),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.MODIFY_FEATURES ][ 0 ].on( "modifyend", this.onModifyFeaturesEnd.bind( this ) );
	
	this.interactions[ netgis.Modes.DELETE_FEATURES ] =
	[
		//new ol.interaction.Select( { layers: [ this.editLayer ], addCondition: ol.events.condition.pointerMove } ),
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.BUFFER_FEATURE_BEGIN ] =
	[
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.BUFFER_FEATURE_EDIT ] =
	[
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	// Snapping
	this.snapFeatures = new ol.Collection();
	
	// Search
	this.interactions[ netgis.Modes.SEARCH_PLACE ] =
	[
		new ol.interaction.DragPan(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.SEARCH_PARCEL ] = this.interactions[ netgis.Modes.VIEW ];
};

netgis.MapOpenLayers.prototype.createLayer = function( data )
{
	var layer = null;
	
	// Create Specific Layer By Type
	switch ( data.type )
	{
		case netgis.LayerTypes.XYZ:
		{			
			layer = this.createLayerXYZ( data.url );
			break;
		}
		
		case netgis.LayerTypes.OSM:
		{
			layer = this.createLayerOSM();
			break;
		}
		
		case netgis.LayerTypes.WMS:
		{
			layer = this.createLayerWMS( data.url, data.name, data.format, data.username, data.password );
			break;
		}
		
		case netgis.LayerTypes.WFS:
		{
			layer = this.createLayerWFS( data.url, data.name, this.client.config.map.projection, data.outputFormat, data.username, data.password );
			break;
		}
	}
	
	// Common Settings
	if ( layer )
	{
		if ( data.minZoom ) layer.setMinZoom( Number.parseFloat( data.minZoom ) - 1.0 );
		if ( data.maxZoom ) layer.setMaxZoom( Number.parseFloat( data.maxZoom ) );
	}
	
	return layer;
};

netgis.MapOpenLayers.prototype.createLayerXYZ = function( url )
{
	var layer = new ol.layer.Tile
	(
		{
			source: new ol.source.XYZ
			(
				{
					url: url,
					crossOrigin: "anonymous"
				}
			)
		}
	);
	
	return layer;
};

netgis.MapOpenLayers.prototype.createLayerOSM = function()
{
	var layer = new ol.layer.Tile
	(
		{
			source: new ol.source.XYZ
			(
				{
					url: "https://{a-c}.tile.openstreetmap.de/{z}/{x}/{y}.png",
					crossOrigin: "anonymous"
				}
			)
		}
	);
	
	return layer;
};

netgis.MapOpenLayers.prototype.createLayerWMS = function( url, layerName, format, user, password )
{	
	var params =
	{
		url: url,
		params:
		{
			"LAYERS":		layerName,
			"FORMAT":		format ? format : "image/png",
			"TRANSPARENT":	"true",
			"VERSION":		"1.1.1"
		},
		serverType: "mapserver",
		crossOrigin: "anonymous",
		hidpi: false
		//ratio: 3.0
	};

	// User Auth
	if ( user && password )
	{
		params.imageLoadFunction = function( image, src )
		{
			var request = new XMLHttpRequest();
			request.open( "GET", src );
			request.setRequestHeader( "Authorization", "Basic " + window.btoa( user + ":" + password ) );

			request.onload = function()
			{
				image.getImage().src = src;
			};

			request.send();
		};
	}

	var source = new ol.source.ImageWMS( params );

	var layer = new ol.layer.Image
	(
		{
			source:	source,
			//zIndex: index,
			opacity: 1.0
		}
	);
	
	return layer;
};

netgis.MapOpenLayers.prototype.createLayerWFS = function( url, typeName, projection, outputFormat, user, password )
{
	url = url
			+ "service=WFS"
			+ "&version=1.1.0"
			+ "&request=GetFeature";
			
	if ( ! outputFormat )
		outputFormat = "application/json";
	else
		outputFormat = netgis.util.replace( outputFormat, " ", "+" ); //TODO: encode uri component ?

	var source = new ol.source.Vector
	(
		{
			format: new ol.format.GeoJSON(),
			strategy: ol.loadingstrategy.bbox,
			
			loader: function( extent, resolution, proj, success, failure )
			{
				//proj = proj.getCode();
				
				var requestURL = url
									+ "&typename=" + typeName
									+ "&srsname=" + projection
									+ "&bbox=" + extent.join( "," ) + "," + projection
									+ "&outputFormat=" + outputFormat;
				
				var request = new XMLHttpRequest();
				request.open( "GET", requestURL );
				
				if ( user && password )
				{
					request.setRequestHeader( "Authorization", "Basic " + window.btoa( user + ":" + password ) );
				}
				
				request.onerror = function()
				{
					console.error( "WFS Request Error" );
					failure();
				};
				
				request.onload = function()
				{
					if ( request.status === 200 )
					{
						var features = source.getFormat().readFeatures( request.responseText );
						source.addFeatures( features );
						success( features );
					}
					else
					{
						console.error( "WFS Request Status", request.status );
						failure();
					}
				};
				
				request.send();
			}
		}
	);

	var layer = new ol.layer.Vector
	(
		{
			source: source
		}
	);

	var self = this;
	source.on( "featuresloadstart", function( e ) { self.removeSnapLayer( layer ); } );
	source.on( "featuresloadend", function( e ) { window.setTimeout( function() { self.addSnapLayer( layer ); }, 10 ); } );
	//source.on( "featuresloaderror", function( e ) { console.info( "Layer Error:", e ); } );
	
	return layer;
};

netgis.MapOpenLayers.prototype.clearAll = function()
{
	for ( var i = 0; i < this.layers.length; i++ )
	{
		this.map.removeLayer( this.layers[ i ] );
	}
	
	this.layers = [];
	
	this.snapFeatures.clear();
};

netgis.MapOpenLayers.prototype.onUpdateStyle = function( e )
{
	var style = new ol.style.Style
	(
		{
			//image: new ol.style.Circle( { radius: 7, fill: new ol.style.Fill( { color: "#ff0000" } ) } ),
			fill: new ol.style.Fill( { color: e.polygon.fill } ),
			stroke: new ol.style.Stroke( { color: e.polygon.stroke, width: e.polygon.strokeWidth } )
		}
	);
	
	this.editLayer.setStyle( style );
};

netgis.MapOpenLayers.prototype.styleEdit = function( feature )
{
	var radius = this.client.config.styles.editLayer.pointRadius;
	var geom = feature.getGeometry();
	
	var style = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: radius, fill: new ol.style.Fill( { color: this.client.config.styles.editLayer.stroke } ) } ),
			fill: new ol.style.Fill( { color: this.client.config.styles.editLayer.fill } ),
			stroke: new ol.style.Stroke( { color: this.client.config.styles.editLayer.stroke, width: this.client.config.styles.editLayer.strokeWidth } )
		}
	);
	
	if ( geom instanceof ol.geom.Polygon )
	{
		var area = geom.getArea();
		
		style.setText
		(
			new ol.style.Text
			(
				{
					text: [ netgis.util.formatArea( area, true ), "4mm sans-serif" ],
					font: this.labelFont,
					fill: new ol.style.Fill( { color: this.client.config.styles.editLayer.stroke } ),
					backgroundFill: new ol.style.Fill( { color: "rgba( 255, 255, 255, 0.5 )" } ),
					padding: [ 2, 4, 2, 4 ]
				}
			)
		);
	}
	
	return style;
};

netgis.MapOpenLayers.prototype.styleSelect = function( feature )
{
	var geom = feature.getGeometry();
	
	var style = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: this.client.config.styles.select.pointRadius, fill: new ol.style.Fill( { color: this.client.config.styles.select.stroke } ) } ),
			fill: new ol.style.Fill( { color: this.client.config.styles.select.fill } ),
			stroke: new ol.style.Stroke( { color: this.client.config.styles.select.stroke, width: this.client.config.styles.select.strokeWidth } )
		}
	);
	
	if ( geom instanceof ol.geom.Polygon )
	{
		var area = geom.getArea();
		
		style.setText
		(
			new ol.style.Text
			(
				{
					text: [ netgis.util.formatArea( area, true ), "4mm sans-serif" ],
					font: this.labelFont,
					fill: new ol.style.Fill( { color: this.client.config.styles.select.stroke } ),
					backgroundFill: new ol.style.Fill( { color: "rgba( 255, 255, 255, 0.5 )" } ),
					padding: [ 2, 4, 2, 4 ]
				}
			)
		);
	}
	
	return style;
};

netgis.MapOpenLayers.prototype.styleModify = function( feature )
{
	var style = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: this.client.config.styles.modify.pointRadius, fill: new ol.style.Fill( { color: this.client.config.styles.modify.stroke } ) } ),
			fill: new ol.style.Fill( { color: this.client.config.styles.modify.fill } ),
			stroke: new ol.style.Stroke( { color: this.client.config.styles.modify.stroke, width: this.client.config.styles.modify.strokeWidth } )
		}
	);
	
	var vertex = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: this.client.config.styles.modify.pointRadius, fill: new ol.style.Fill( { color: this.client.config.styles.modify.stroke } ) } ),
			geometry: this.getGeometryPoints( feature )
		}
	);
	
	var geom = feature.getGeometry();
	
	if ( geom instanceof ol.geom.Polygon )
	{
		var area = geom.getArea();
		
		style.setText
		(
			new ol.style.Text
			(
				{
					text: [ netgis.util.formatArea( area, true ), "4mm sans-serif" ],
					font: this.labelFont,
					fill: new ol.style.Fill( { color: this.client.config.styles.modify.stroke } ),
					backgroundFill: new ol.style.Fill( { color: "rgba( 255, 255, 255, 0.5 )" } ),
					padding: [ 2, 4, 2, 4 ]
				}
			)
		);
	}
	
	return [ style, vertex ];
};

netgis.MapOpenLayers.prototype.styleSketch = function( feature )
{	
	var geom = feature.getGeometry();
	
	var style = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: this.client.config.styles.sketch.pointRadius, fill: new ol.style.Fill( { color: this.client.config.styles.sketch.stroke } ) } ),
			fill: new ol.style.Fill( { color: this.client.config.styles.sketch.fill } ),
			stroke: new ol.style.Stroke( { color: this.client.config.styles.sketch.stroke, width: this.client.config.styles.sketch.strokeWidth } )
		}
	);
	
	if ( geom instanceof ol.geom.Polygon )
	{
		var area = geom.getArea();
		
		style.setText
		(
			new ol.style.Text
			(
				{
					text: [ netgis.util.formatArea( area, true ), "4mm sans-serif" ],
					font: this.labelFont,
					fill: new ol.style.Fill( { color: this.client.config.styles.sketch.stroke } ),
					backgroundFill: new ol.style.Fill( { color: "rgba( 255, 255, 255, 0.5 )" } ),
					padding: [ 2, 4, 2, 4 ]
				}
			)
		);
	}
	
	var vertex = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: this.client.config.styles.sketch.pointRadius, fill: new ol.style.Fill( { color: this.client.config.styles.sketch.stroke } ) } ),
			geometry: this.getGeometryPoints( feature )
		}
	);
	
	return [ style, vertex ];
};

netgis.MapOpenLayers.prototype.styleParcel = function()
{
	//var radius = this.client.config.styles.editLayer.pointRadius;
	
	var style = new ol.style.Style
	(
		{
			//image: new ol.style.Circle( { radius: radius, fill: new ol.style.Fill( { color: this.client.config.styles.editLayer.stroke } ) } ),
			fill: new ol.style.Fill( { color: this.client.config.styles.parcel.fill } ),
			stroke: new ol.style.Stroke( { color: this.client.config.styles.parcel.stroke, width: this.client.config.styles.parcel.strokeWidth } )
		}
	);
	
	return style;
};

netgis.MapOpenLayers.prototype.getGeometryPoints = function( feature )
{
	var geometry = feature.getGeometry();

	if ( geometry instanceof ol.geom.LineString )
	{
		return new ol.geom.MultiPoint( geometry.getCoordinates() );
	}
	else if ( geometry instanceof ol.geom.Polygon )
	{
		//return new ol.geom.MultiPoint( geometry.getCoordinates()[ 0 ] );

		var points = [];
		var geomCoords = geometry.getCoordinates();

		for ( var g = 0; g < geomCoords.length; g++ )
		{
			var coords = geomCoords[ g ];

			for ( var c = 0; c < coords.length; c++ )
				points.push( coords[ c ] );
		}

		return new ol.geom.MultiPoint( points );
	}
	else if ( geometry instanceof ol.geom.MultiPolygon )
	{
		var points = [];
		var polys = geometry.getPolygons();
		
		for ( var l = 0; l < polys.length; l++ )
		{
			var geomCoords = polys[ l ].getCoordinates();

			for ( var g = 0; g < geomCoords.length; g++ )
			{
				var coords = geomCoords[ g ];

				for ( var c = 0; c < coords.length; c++ )
					points.push( coords[ c ] );
			}
		}
		
		return new ol.geom.MultiPoint( points );
	}
	else if ( geometry instanceof ol.geom.MultiLineString )
	{
		var points = [];
		var lines = geometry.getPolygons();
		
		for ( var l = 0; l < lines.length; l++ )
		{
			var geomCoords = lines[ l ].getCoordinates();

			for ( var g = 0; g < geomCoords.length; g++ )
			{
				var coords = geomCoords[ g ];

				for ( var c = 0; c < coords.length; c++ )
					points.push( coords[ c ] );
			}
		}
		
		return new ol.geom.MultiPoint( points );
	}
	
	return geometry;
};

netgis.MapOpenLayers.prototype.getActiveVectorLayers = function()
{
	var vectorLayers = [];
	var mapLayers = this.map.getLayers().getArray();
	
	var layers = this.layers; // this.map.getLayers().getArray();
	
	for ( var i = 0; i < layers.length; i++ )
	{
		//console.info( "Layer:", layers[ i ] );
		
		var layer = layers[ i ];
		
		if ( layer instanceof ol.layer.Vector && mapLayers.indexOf( layer ) > -1 )
		{
			vectorLayers.push( layer );
		}
	}
	
	return vectorLayers;
};

netgis.MapOpenLayers.prototype.setMode = function( mode )
{
	// Leave
	switch ( this.mode )
	{
		case netgis.Modes.BUFFER_FEATURE_EDIT:
		{
			this.onBufferCancel( null );
			break;
		}
		
		case netgis.Modes.DRAW_POINTS:
		case netgis.Modes.DRAW_LINES:
		{
			this.onDrawBufferOff( null );
			break;
		}
	}
	
	// Enter
	switch ( mode )
	{
	}
	
	// Interactions
	this.map.getInteractions().clear();
	
	var interactions = this.interactions[ mode ];
	
	if ( interactions )
	{
		for ( var i = 0; i < interactions.length; i++ )
		{
			this.map.addInteraction( interactions[ i ] );
		}
	}
	
	//TODO: set to default pan interactions when none found for mode ?
	
	if ( this.snap )
	{
		if ( mode === netgis.Modes.DRAW_POINTS || mode === netgis.Modes.DRAW_LINES || mode === netgis.Modes.DRAW_POLYGONS )
		{
			this.map.addInteraction( this.snap );
		}
	}
	
	// Style	
	switch ( mode )
	{
		default:
		{
			this.editLayer.setStyle( this.styleEdit.bind( this ) );
			break;
		}
		
		case netgis.Modes.MODIFY_FEATURES:
		{
			this.editLayer.setStyle( this.styleModify.bind( this ) );
			break;
		}
	};
	
	// Cursors
	if ( this.mode ) this.root.classList.remove( this.getModeClassName( this.mode ) );
	if ( mode ) this.root.classList.add( this.getModeClassName( mode ) );
	
	this.mode = mode;
};

netgis.MapOpenLayers.prototype.getModeClassName = function( mode )
{
	var modeClass = mode.toLowerCase();
	//modeClass = modeClass.replace( "_", "-" );
	modeClass = netgis.util.replace( modeClass, "_", "-" );
	modeClass = "netgis-mode-" + modeClass;
	
	return modeClass;
};

netgis.MapOpenLayers.prototype.setSnapOn = function()
{
	//this.snapFeatures = new ol.Collection();
	this.snap = new ol.interaction.Snap( { features: this.snapFeatures } );
	this.map.addInteraction( this.snap );
	
	this.snapFeatures.changed();
	
	//this.updateSnapLayers();
	
	//TODO: https://openlayers.org/en/latest/examples/tracing.html
};

netgis.MapOpenLayers.prototype.setSnapOff = function()
{
	if ( this.snap )
	{
		this.map.removeInteraction( this.snap );
		this.snap = null;
		//this.snapFeatures = null;
	}
};

netgis.MapOpenLayers.prototype.setTracingOn = function()
{
	var source = new ol.source.Vector( { features: this.snapFeatures } );
	
	this.tracing = new ol.interaction.Draw( { type: "Polygon", source: this.editLayer.getSource(), style: this.styleSketch.bind( this ), trace: true, traceSource: source } );

	var actions = this.interactions[ netgis.Modes.DRAW_POLYGONS ];
	actions[ 0 ].setActive( false );
	actions.push( this.tracing );
	
	this.setMode( this.mode );
};

netgis.MapOpenLayers.prototype.setTracingOff = function()
{
	var actions = this.interactions[ netgis.Modes.DRAW_POLYGONS ];
	actions[ 0 ].setActive( true );
	actions.splice( actions.indexOf( this.tracing ), 1 );
	
	this.setMode( this.mode );
};

/*
netgis.MapOpenLayers.prototype.updateSnapLayers = function()
{
	var snapLayers = this.getActiveVectorLayers();
	
	this.snapFeatures.clear();
	
	if ( snapLayers.length > 0 )
	{
		for ( var i = 0; i < snapLayers.length; i++ )
		{
			var layerFeatures = snapLayers[ i ].getSource().getFeatures();
			
			for ( var j = 0; j < layerFeatures.length; j++ )
			{
				this.snapFeatures.push( layerFeatures[ j ] );
			}
		}
		
		console.info( "Snap Features:", this.snapFeatures.getLength() );
	}
};
*/

netgis.MapOpenLayers.prototype.addSnapLayer = function( vectorLayer )
{
	var layerFeatures = vectorLayer.getSource().getFeatures();
			
	for ( var j = 0; j < layerFeatures.length; j++ )
	{
		this.snapFeatures.push( layerFeatures[ j ] );
	}
};

netgis.MapOpenLayers.prototype.removeSnapLayer = function( vectorLayer )
{
	var layerFeatures = vectorLayer.getSource().getFeatures();
			
	for ( var j = 0; j < layerFeatures.length; j++ )
	{
		this.snapFeatures.remove( layerFeatures[ j ] );
	}
};

netgis.MapOpenLayers.prototype.onSnapOn = function( e )
{
	this.setSnapOn();
};

netgis.MapOpenLayers.prototype.onSnapOff = function( e )
{
	this.setSnapOff();
};

netgis.MapOpenLayers.prototype.onTracingOn = function( e )
{
	this.setTracingOn();
};

netgis.MapOpenLayers.prototype.onTracingOff = function( e )
{
	this.setTracingOff();
};

netgis.MapOpenLayers.prototype.onLayerShow = function( e )
{
	var layer = this.layers[ e.id ];
	
	if ( ! layer ) return;
	
	this.map.addLayer( layer );
	
	//if ( /*this.snap &&*/ layer instanceof ol.layer.Vector ) this.addSnapLayer( layer ); //this.updateSnapLayers();
	
	if ( layer instanceof ol.layer.Vector ) this.addSnapLayer( layer );
};

netgis.MapOpenLayers.prototype.onLayerHide = function( e )
{
	var layer = this.layers[ e.id ];
	
	if ( ! layer ) return;
	
	this.map.removeLayer( layer );
	
	if ( layer instanceof ol.layer.Vector ) this.removeSnapLayer( layer ); //this.updateSnapLayers();
};

netgis.MapOpenLayers.prototype.onContextUpdate = function( e )
{
	this.clearAll();
	
	var context = e;
	
	// Bounding Box
	var bbox = context.bbox;
	
	if ( bbox )
	{
		var bbox1;
		var bbox2;
		
		if ( netgis.util.isDefined( this.client.config.map ) && netgis.util.isDefined( this.client.config.map.projection ) )
		{
			bbox1 = ol.proj.fromLonLat( [ bbox[ 0 ], bbox[ 1 ] ], this.client.config.map.projection );
			bbox2 = ol.proj.fromLonLat( [ bbox[ 2 ], bbox[ 3 ] ], this.client.config.map.projection );
		}
		else
		{
			bbox1 = ol.proj.fromLonLat( [ bbox[ 0 ], bbox[ 1 ] ] );
			bbox2 = ol.proj.fromLonLat( [ bbox[ 2 ], bbox[ 3 ] ] );
		}

		bbox[ 0 ] = bbox1[ 0 ];
		bbox[ 1 ] = bbox1[ 1 ];
		bbox[ 2 ] = bbox2[ 0 ];
		bbox[ 3 ] = bbox2[ 1 ];

		this.view.fit( bbox );
	}
	
	// Layers
	//this.layers = [];
	
	for ( var l = 0; l < context.layers.length; l++ )
	//for ( var l = context.layers.length - 1; l >= 0; l-- )
	{
		var data = context.layers[ l ];
		var layer = this.createLayer( data );
		
		if ( layer )
		{
			layer.setZIndex( context.layers.length - l );
			//this.layers.push( layer );
			this.layers[ l ] = layer;
		}
	}
	
	//this.map.getLayers().clear();
	
	//TODO: active layers from context?
	
	// Active State
	/*for ( var l = 0; l < context.layers.length; l++ )
	{
		var data = context.layers[ l ];
		if ( data.active ) this.onLayerShow( { id: l } );
	}*/
};

netgis.MapOpenLayers.prototype.onAddServiceWMS = function( e )
{
	var layer = this.createLayerWMS( e.url, e.name, e.format );
	layer.setZIndex( e.id );
	this.layers[ e.id ] = layer;
};

netgis.MapOpenLayers.prototype.onAddServiceWFS = function( e )
{
	var layer = this.createLayerWFS( e.url, e.name, this.client.config.map.projection, e.format );
	layer.setZIndex( e.id );
	this.layers[ e.id ] = layer;
};

netgis.MapOpenLayers.prototype.onSetMode = function( e )
{
	this.setMode( e );
};

netgis.MapOpenLayers.prototype.onSetExtent = function( e )
{
	var minxy = ol.proj.fromLonLat( [ e.minx, e.miny ], this.client.config.map.projection );
	var maxxy = ol.proj.fromLonLat( [ e.maxx, e.maxy ], this.client.config.map.projection );
	
	this.view.fit( [ minxy[ 0 ], minxy[ 1 ], maxxy[ 0 ], maxxy[ 1 ] ] );
};

netgis.MapOpenLayers.prototype.onChangeZoom = function( e )
{
	var delta = e;
	this.view.animate( { zoom: this.view.getZoom() + delta, duration: 200 } );
};

netgis.MapOpenLayers.prototype.onZoomWKT = function( e )
{
	var parser = new ol.format.WKT();
	var geom = parser.readGeometry( e );
	var padding = 40;
	
	this.view.fit( geom, { duration: 300, padding: [ padding, padding, padding, padding ] } );
	
	//TODO: take visible panels into account when zooming
};

netgis.MapOpenLayers.prototype.onPointerMove = function( e )
{
	var pixel = e.pixel;
	var coords = e.coordinate;
	
	var hover = this.hover;
	var styleSelect = this.styleSelect.bind( this );
	
	if ( hover )
	{
		hover.setStyle( this.styleEdit.bind( this ) );
		hover = null;
	}
	
	var self = this;
	
	switch ( this.mode )
	{
		case netgis.Modes.DELETE_FEATURES:
		{
			this.map.forEachFeatureAtPixel
			(
				pixel,
				function( feature, layer ) //TODO: bind to this?
				{
					if ( layer === self.editLayer )
					{
						hover = feature;
						feature.setStyle( styleSelect );
					}
					
					return true;
				}
			);
			
			break;
		}
		
		case netgis.Modes.CUT_FEATURE_BEGIN:
		{
			this.map.forEachFeatureAtPixel
			(
				pixel,
				function( feature, layer ) //TODO: bind to this?
				{
					if ( layer === self.editLayer )
					{
						hover = feature;
						feature.setStyle( styleSelect );
					}
					
					return true;
				}
			);
			
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURE_BEGIN:
		{
			this.map.forEachFeatureAtPixel
			(
				pixel,
				function( feature, layer ) //TODO: bind to this?
				{
					if ( layer === self.editLayer )
					{
						hover = feature;
						feature.setStyle( styleSelect );
					}
					
					return true;
				}
			);
			
			break;
		}
		
		case netgis.Modes.DRAW_POINTS:
		case netgis.Modes.DRAW_LINES:
		{
			this.updateDrawBufferPreview();
			break;
		}
	}
	
	//TODO: refactor to default hover handler?
	
	this.hover = hover;
};

netgis.MapOpenLayers.prototype.onSingleClick = function( e )
{
	switch ( this.mode )
	{
		case netgis.Modes.DELETE_FEATURES:
		{
			if ( this.hover )
			{
				this.editLayer.getSource().removeFeature( this.hover );
				this.hover = null;
				
				this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.VIEW );
			}
			
			break;
		}
		
		case netgis.Modes.CUT_FEATURE_BEGIN:
		{
			if ( this.hover )
			{
				this.selected = this.hover;
				this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.CUT_FEATURE_DRAW );
			}
			
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURE_BEGIN:
		{
			if ( this.hover )
			{
				this.selected = this.hover;
				this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.BUFFER_FEATURE_EDIT );
			}
			
			break;
		}
	}
};

netgis.MapOpenLayers.prototype.onMoveStart = function( e )
{
	//TODO: problem with toolbars after head menu click
	//this.client.invoke( netgis.Events.MAP_SET_MODE, netgis.MapModes.PANNING );
};

netgis.MapOpenLayers.prototype.onMoveEnd = function( e )
{
	//TODO: problem with toolbars after head menu click
	//this.client.invoke( netgis.Events.MAP_SET_MODE, netgis.MapModes.VIEW );
};

netgis.MapOpenLayers.prototype.onChangeResolution = function( e )
{
	//var d = e.oldValue - this.view.getResolution();
	//this.client.invoke( netgis.Events.MAP_SET_MODE, ( d > 0.0 ) ? netgis.MapModes.ZOOMING_IN : netgis.MapModes.ZOOMING_OUT );
};

netgis.MapOpenLayers.prototype.onCutFeatureDrawEnd = function( e )
{
	var cutter = e.feature;
	var target = this.selected;
	
	if ( target )
	{
		// Cut Process
		var parser = new jsts.io.OL3Parser();
		
		var a = parser.read( target.getGeometry() );
		var b = parser.read( cutter.getGeometry() );
		
		var c = a.difference( b );
		
		// Output
		var geom = parser.write( c );
		var feature = new ol.Feature( { geometry: geom } );
		
		var source = this.editLayer.getSource();
		source.removeFeature( target );
		source.addFeature( feature );
		
		this.selected = feature;
	}
	
	this.editEventsSilent = true;
	this.splitMultiPolygons( this.editLayer );
	this.editEventsSilent = false;
	this.updateEditOutput();
	
	this.client.invoke( netgis.Events.SET_MODE, netgis.Modes.VIEW );
};

netgis.MapOpenLayers.prototype.onModifyFeaturesEnd = function( e )
{
	this.updateEditOutput();
	this.updateEditArea();
};

netgis.MapOpenLayers.prototype.createBufferFeature = function( srcgeom, radius, segments )
{
	var geom = this.createBufferGeometry( srcgeom, radius, segments );
	var feature = new ol.Feature( { geometry: geom } );
	
	return feature;
};

netgis.MapOpenLayers.prototype.createBufferGeometry = function( srcgeom, radius, segments )
{
	var parser = new jsts.io.OL3Parser();
		
	var a = parser.read( srcgeom );
	var b = a.buffer( radius, segments );
	
	var geom = parser.write( b );
	
	return geom;
};

netgis.MapOpenLayers.prototype.onBufferChange = function( e )
{
	var source = this.editLayer.getSource();
	var target = this.selected;
	
	if ( this.sketch )
	{
		source.removeFeature( this.sketch );
	}
	
	if ( target )
	{
		var feature = this.createBufferFeature( target.getGeometry(), e.radius, e.segments );
		
		//source.removeFeature( target );
		source.addFeature( feature );
		
		this.sketch = feature;
	}
};

netgis.MapOpenLayers.prototype.onBufferAccept = function( e )
{
	if ( this.selected && this.sketch )
	{
		var source = this.editLayer.getSource();
		
		// Delete Input Feature
		//if ( ! ( this.selected.getGeometry() instanceof ol.geom.Point ) )
			source.removeFeature( this.selected );
	}
	
	this.sketch = null;
	this.selected = null;
};

netgis.MapOpenLayers.prototype.onBufferCancel = function( e )
{
	if ( this.sketch )
	{
		this.editLayer.getSource().removeFeature( this.sketch );
		this.sketch = null;
	}
	
	this.selected = null;
};

netgis.MapOpenLayers.prototype.onDrawPointsEnd = function( e )
{
	var preview = this.previewLayer.getSource().getFeatures()[ 0 ];
	
	if ( preview )
	{
		var src = this.editLayer.getSource();
		
		// Add Buffer Feature
		src.addFeature( preview.clone() );
		
		// Remove Sketch Feature
		window.setTimeout
		(
			function()
			{
				src.removeFeature( e.feature );
			},
			10
		);
	}
};

netgis.MapOpenLayers.prototype.onDrawLinesEnd = function( e )
{
	var preview = this.previewLayer.getSource().getFeatures()[ 0 ];
	
	if ( preview )
	{
		var src = this.editLayer.getSource();
		
		// Add Buffer Feature
		src.addFeature( preview.clone() );
	
		// Remove Sketch Feature
		window.setTimeout
		(
			function()
			{
				src.removeFeature( e.feature );
			},
			10
		);
	}
};

netgis.MapOpenLayers.prototype.onDrawBufferOn = function( e )
{
	var feature = this.createBufferFeature( new ol.geom.Point( this.client.config.map.center ), this.drawBufferRadius, this.drawBufferSegments );
	this.previewLayer.getSource().addFeature( feature );
	
	//TODO: send all draw buffer params with events ?
};

netgis.MapOpenLayers.prototype.onDrawBufferOff = function( e )
{
	this.previewLayer.getSource().clear();
};

netgis.MapOpenLayers.prototype.onDrawBufferRadiusChange = function( e )
{
	var radius = e;
	this.drawBufferRadius = radius;
	
	this.updateDrawBufferPreview();
};

netgis.MapOpenLayers.prototype.onDrawBufferSegmentsChange = function( e )
{
	var segs = e;
	this.drawBufferSegments = segs;
	
	this.updateDrawBufferPreview();
};

netgis.MapOpenLayers.prototype.updateDrawBufferPreview = function()
{
	var draw = this.interactions[ this.mode ][ 0 ];
	var overlays = draw.getOverlay().getSource().getFeatures();
	if ( overlays.length < 1 ) return;
	
	var preview = this.previewLayer.getSource().getFeatures()[ 0 ];
	if ( ! preview ) return;
	
	var geom = overlays[ 0 ].getGeometry();
	var buffer = this.createBufferGeometry( geom, this.drawBufferRadius, this.drawBufferSegments );
	preview.setGeometry( buffer );
};

netgis.MapOpenLayers.prototype.onEditLayerAdd = function( e )
{
	////this.updateEditOutput();
	this.updateEditLayerItem();
	this.updateEditOutput();
	this.snapFeatures.push( e.feature );
};

netgis.MapOpenLayers.prototype.onEditLayerRemove = function( e )
{
	this.updateEditOutput();
	this.snapFeatures.remove( e.feature );
};

netgis.MapOpenLayers.prototype.onEditLayerChange = function( e )
{
	this.updateEditOutput();
};

netgis.MapOpenLayers.prototype.updateEditOutput = function()
{
	var features = this.editLayer.getSource().getFeatures();
	
	var proj = this.client.config.map.projection;
	var format = new ol.format.GeoJSON();
	var output = format.writeFeaturesObject( features, { dataProjection: proj, featureProjection: proj } );
	
	// Projection
	output[ "crs" ] =
	{
		"type": "name",
		"properties": { "name": "urn:ogc:def:crs:" + proj.replace( ":", "::" ) }
	};
	
	// Total Area
	var area = 0.0;
	
	for ( var i = 0; i < features.length; i++ )
	{
		var geom = features[ i ].getGeometry();
		if ( geom instanceof ol.geom.Polygon ) area += geom.getArea();
	}
	
	output[ "area" ] = area;
	
	if ( ! this.editEventsSilent )
	{
		this.client.invoke( netgis.Events.EDIT_FEATURES_CHANGE, output );
	}
};

netgis.MapOpenLayers.prototype.updateEditLayerItem = function()
{
	// Create layer item if not existing
	var id = this.editLayerID;
	
	if ( ! this.layers[ id ] )
	{
		this.layers[ id ] = this.editLayer;
		this.client.invoke( netgis.Events.LAYER_CREATED, { id: id, title: "Zeichnung", checked: true, folder: "draw" } );
	}
};

netgis.MapOpenLayers.prototype.updateEditArea = function()
{
	
};

netgis.MapOpenLayers.prototype.onEditFeaturesLoaded = function( e )
{
	var json = e;	
	var self = this;
	window.setTimeout( function() { self.createLayerGeoJSON( "Import", json ); }, 10 );
};

netgis.MapOpenLayers.prototype.onDragEnter = function( e )
{
	e.preventDefault();
	
	this.dropTarget.classList.remove( "netgis-hide" );
	
	//TODO: refactor into dragdrop module + events ?
	
	return false;
};

netgis.MapOpenLayers.prototype.onDragLeave = function( e )
{
	this.dropTarget.classList.add( "netgis-hide" );
	
	return false;
};

netgis.MapOpenLayers.prototype.onDragDrop = function( e )
{
	console.info( "Drag Drop" );
	
	this.dropTarget.classList.add( "netgis-hide" );
	
	e.preventDefault();
		
	var file = e.dataTransfer.files[ 0 ];
	var reader = new FileReader();

	reader.onload = this.onDragLoad.bind( this );

	console.log( "File:", file );

	//reader.readAsDataURL( file );
	reader.readAsArrayBuffer( file );

	return false;
};

netgis.MapOpenLayers.prototype.onDragLoad = function( e )
{
	console.log( "On Load:", e.target );
	
	this.loadShape( e.target.result );
};

netgis.MapOpenLayers.prototype.loadShape = function( data )
{
	var self = this;
	
	shp( data ).then
	(
		function( geojson )
		{
			self.onShapeLoad( geojson );
		}
	);
};

netgis.MapOpenLayers.prototype.onShapeLoad = function( geojson )
{
	console.info( "Shapefile To Geojson:", geojson );
			
	var features = new ol.format.GeoJSON( { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" } ).readFeatures( geojson );
	this.importLayer.getSource().addFeatures( features );

	this.view.fit( this.importLayer.getSource().getExtent(), {} );
};

netgis.MapOpenLayers.prototype.onImportGeoJSON = function( e )
{
	var file = e;
	var title = file.name;
	var self = this;
	
	var reader = new FileReader();
	reader.onload = function( e ) { self.createLayerGeoJSON( title, e.target.result ); };
	reader.readAsText( file );
};

netgis.MapOpenLayers.prototype.onImportGML = function( e )
{
	var file = e;
	var title = file.name;
	var self = this;
	
	var reader = new FileReader();
	reader.onload = function( e ) { self.createLayerGML( title, e.target.result ); };
	reader.readAsText( file );
};

netgis.MapOpenLayers.prototype.onImportShapefile = function( e )
{
	var file = e;
	var title = file.name;
	var self = this;
	
	var reader = new FileReader();
	reader.onload = function( e ) { self.createLayerShapefile( title, e.target.result ); };
	reader.readAsArrayBuffer( file );
};

netgis.MapOpenLayers.prototype.onImportSpatialite = function( e )
{
	var file = e;
	var title = file.name;
	var self = this;
	
	var reader = new FileReader();
	reader.onload = function( e ) { self.createLayerSpatialite( title, e.target.result ); };
	reader.readAsArrayBuffer( file );
};

netgis.MapOpenLayers.prototype.onImportGeopackage = function( e )
{
	var file = e;
	var title = file.name;
	var self = this;
	
	var reader = new FileReader();
	reader.onload = function( e ) { self.createLayerGeopackage( title, e.target.result ); };
	reader.readAsArrayBuffer( file );
};

netgis.MapOpenLayers.prototype.createLayerGeoJSON = function( title, data )
{	
	var format = new ol.format.GeoJSON();
	var projection = format.readProjection( data );
	var features = format.readFeatures( data, { featureProjection: this.client.config.map.projection } );

	//NOTE: proj4.defs[ "EPSG:4326" ]
	//NOTE: netgis.util.foreach( proj4.defs, function( k,v ) { console.info( "DEF:", k, v ); } )
	
	var projcode = projection.getCode();
	
	switch ( projcode )
	{
		case "EPSG:3857":
		case "EPSG:4326":
		case this.client.config.map.projection:
		{
			// Projection OK
			break;
		}
		
		default:
		{
			// Projection Not Supported
			console.warn( "Unsupported Import Projection:", projcode );
			break;
		}
	}	

	this.addImportedFeatures( features );
};

netgis.MapOpenLayers.prototype.createLayerGML = function( title, data )
{	
	//NOTE: https://stackoverflow.com/questions/35935184/opening-qgis-exported-gml-in-openlayers-3
	//NOTE: https://github.com/openlayers/openlayers/issues/5023
	
	console.warn( "GML support is experimental!" );
	
	//var format = new ol.format.GML3( { srsName: "EPSG::25832", featureType: "Test", featureNS: "http://www.opengis.net/gml" } );
	//var format = new ol.format.GML( { featureNS: "ogr" } );
	//var format = new ol.format.WFS( /*{ srsName: "EPSG:4326", featureType: "ogr:RLP_OG_utf8_epsg4326" }*/ );
	//var format = new ol.format.GML( { featureNS: "ogr", featureType: "ogr:RLP_OG_utf8_epsg4326" } );
	//var format = new ol.format.WFS();
	//var format = new ol.format.WFS( { featureNS: "ogr", featureType: "RLP_OG_utf8_epsg4326" } );
	//var projection = format.readProjection( data );
	//var features = format.readFeatures( data, { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" } );
	
	//var features = format.readFeatures( data, { dataProjection: this.client.config.map.projection, featureProjection: this.client.config.map.projection } );

	//console.info( "GML:", projection, features, features[ 0 ].getGeometry() );

	var features = [];
	
	var parser = new DOMParser();
	var xml = parser.parseFromString( data, "text/xml" );
	
	// Features
	var featureMembers = xml.getElementsByTagName( "gml:featureMember" );
	
	for ( var f = 0; f < featureMembers.length; f++ )
	{
		var props = {};
		
		var node = featureMembers[ f ];
		var child = node.children[ 0 ];
		
		// Attributes
		for ( var a = 0; a < child.attributes.length; a++ )
		{
			var attribute = child.attributes[ a ];
			props[ attribute.nodeName ] = attribute.nodeValue;
		}
		
		for ( var c = 0; c < child.children.length; c++ )
		{
			var childNode = child.children[ c ];
			
			if ( childNode.nodeName === "ogr:geometryProperty" ) continue;
			
			var parts = childNode.nodeName.split( ":" );
			var k = parts[ parts.length - 1 ];
			var v = childNode.innerHTML;
			
			props[ k ] = v;
		}
		
		// Geometry
		var geomprop = child.getElementsByTagName( "ogr:geometryProperty" )[ 0 ];
		
		//for ( var g = 0; g < geomprop.children.length; g++ )
		{
			var geom = geomprop.children[ 0 ];
			var proj = geom.getAttribute( "srsName" );
			
			if ( proj && proj !== "EPSG:4326" && proj !== this.client.config.map.projection )
				console.warn( "Unsupported Import Projection:", proj );
			
			switch ( geom.nodeName )
			{
				case "gml:Polygon":
				{
					props[ "geometry" ] = this.gmlParsePolygon( geom, proj );
					break;
				}
				
				case "gml:MultiPolygon":
				{
					props[ "geometry" ] = this.gmlParseMultiPolygon( geom, proj );
					break;
				}
			}
		}
		
		var feature = new ol.Feature( props );
		features.push( feature );
	}

	this.addImportedFeatures( features );
};

netgis.MapOpenLayers.prototype.gmlParsePolygon = function( node, proj )
{
	var rings = [];
	
	var linearRings = node.getElementsByTagName( "gml:LinearRing" );
	
	for ( var r = 0; r < linearRings.length; r++ )
	{
		var ring = linearRings[ r ];
		var coords = ring.getElementsByTagName( "gml:coordinates" )[ 0 ].innerHTML;
		rings.push( this.gmlParseCoordinates( coords, proj ) );
	}
	
	return new ol.geom.Polygon( rings );
};

netgis.MapOpenLayers.prototype.gmlParseMultiPolygon = function( node, proj )
{
	var polygons = [];
					
	var polygonMembers = node.getElementsByTagName( "gml:polygonMember" );

	for ( var p = 0; p < polygonMembers.length; p++ )
	{
		var polygonMember = polygonMembers[ p ];
		var polygonNode = polygonMember.getElementsByTagName( "gml:Polygon" )[ 0 ];
		polygons.push( this.gmlParsePolygon( polygonNode, proj ) );
	}
	
	return new ol.geom.MultiPolygon( polygons );
};

netgis.MapOpenLayers.prototype.gmlParseCoordinates = function( s, proj )
{
	var coords = s.split( " " );
						
	for ( var c = 0; c < coords.length; c++ )
	{
		// Split
		coords[ c ] = coords[ c ].split( "," );

		// Parse
		for ( var xy = 0; xy < coords[ c ].length; xy++ )
		{
			coords[ c ][ xy ] = Number.parseFloat( coords[ c ][ xy ] );
		}
		
		// Transform
		if ( proj ) coords[ c ] = ol.proj.transform( coords[ c ], proj, this.client.config.map.projection );
	}
	
	return coords;
};

netgis.MapOpenLayers.prototype.createLayerShapefile = function( title, shapeData )
{
	var self = this;
	
	shp( shapeData ).then
	(
		function( geojson )
		{			
			//var format = new ol.format.GeoJSON( { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" } );
			var format = new ol.format.GeoJSON();
			var projection = format.readProjection( geojson );
			var features = format.readFeatures( geojson, { featureProjection: self.client.config.map.projection } );
			
			self.addImportedFeatures( features );
		}
	);
};

netgis.MapOpenLayers.prototype.createLayerSpatialite = function( title, data )
{
	var self = this;
	
	window.initSqlJs().then
	(
		function( SQL )
		{
			var features = [];
			
			var arr = new Uint8Array( data );
			var db = new SQL.Database( arr );
			
			// Tables
			var results = db.exec
			(
				"SELECT name FROM sqlite_schema WHERE type = 'table' \n\
					AND name NOT LIKE 'sqlite_%' \n\
					AND name NOT LIKE 'sql_%' \n\
					AND name NOT LIKE 'idx_%' \n\
					AND name NOT LIKE 'spatial_ref_sys%' \n\
					AND name NOT LIKE 'spatialite_%' \n\
					AND name NOT LIKE 'geometry_columns%' \n\
					AND name NOT LIKE 'views_%' \n\
					AND name NOT LIKE 'virts_%' \n\
					AND name NOT LIKE 'SpatialIndex' \n\
					AND name NOT LIKE 'ElementaryGeometries' \n\
				;" );
			
			var tables = results[ 0 ].values;
			
			for ( var t = 0; t < tables.length; t++ )
			{
				var table = tables[ t ][ 0 ];

				results = db.exec( "SELECT * FROM " + table );
				var result = results[ 0 ];

				// Columns
				var geomcol = null;

				for ( var c = 0; c < result.columns.length; c++ )
				{
					if ( result.columns[ c ].toLowerCase() === "geometry" ) { geomcol = c; break; }
					if ( result.columns[ c ].toLowerCase() === "geom" ) { geomcol = c; break; }
				}

				// Rows
				var rows = result.values;

				for ( var r = 0; r < rows.length; r++ )
				{
					var row = rows[ r ];
					
					// Convert WKB
					var input = row[ geomcol ];
					var output = new Uint8Array( input.length - 43 - 1 + 5 );

					// Byte Order
					output[ 0 ] = input[ 1 ];

					// Type
					output[ 1 ] = input[ 39 ];
					output[ 2 ] = input[ 40 ];
					output[ 3 ] = input[ 41 ];
					output[ 4 ] = input[ 42 ];

					// Geometry
					var geomlen = input.length - 43 - 1;

					for ( var i = 0; i < geomlen; i++ )
					{
						output[ 5 + i ] = input[ 43 + i ];
					}

					var wkb = new ol.format.WKB();
					var geom = wkb.readGeometry( output, { featureProjection: self.client.config.map.projection } );

					features.push( new ol.Feature( { geometry: geom } ) );
				}
			}
			
			self.addImportedFeatures( features );
		}
	);
};

netgis.MapOpenLayers.prototype.createLayerGeopackage = function( title, data )
{
	var self = this;
	var arr = new Uint8Array( data );
	
	window.GeoPackage.setSqljsWasmLocateFile( function( file ) { return self.client.config.import.geopackageLibURL + file; } );
	
	window.GeoPackage.GeoPackageAPI.open( arr ).then( function( geoPackage )
	{
		var features = [];
		var format = new ol.format.GeoJSON();
		var tables = geoPackage.getFeatureTables();
		
		for ( var t = 0; t < tables.length; t++ )
		{
			var table = tables[ t ];
			var rows = geoPackage.queryForGeoJSONFeaturesInTable( table );
			
			for ( var r = 0; r < rows.length; r++ )
			{
				var row = rows[ r ];
				var geom = format.readGeometry( row.geometry, { featureProjection: self.client.config.map.projection } );
				var feature = new ol.Feature( { geometry: geom } );
				features.push( feature );
			}
		}
		
		self.addImportedFeatures( features );
	} );
};

netgis.MapOpenLayers.prototype.addImportedFeatures = function( features )
{
	// Add To Edit Layer
	this.editEventsSilent = true;
	this.editLayer.getSource().addFeatures( features );
	this.editEventsSilent = false;
	this.updateEditOutput();
	
	// Zoom Imported Features
	if ( features.length > 0 )
	{
		var extent = features[ 0 ].getGeometry().getExtent();
		
		for ( var f = 1; f < features.length; f++ )
		{
			ol.extent.extend( extent, features[ f ].getGeometry().getExtent() );
		}
		
		var padding = 40;
		this.view.fit( extent, { duration: 300, padding: [ padding, padding, padding, padding ] } );
	}
};

netgis.MapOpenLayers.prototype.onImportWKT = function( e )
{
	var parser = new ol.format.WKT();
	var geom = parser.readGeometry( e );
	var feature = new ol.Feature( { geometry: geom } );
	
	this.addImportedFeatures( [ feature ] );
};

netgis.MapOpenLayers.prototype.onExportPDF = function( e )
{
	this.exportImage( "pdf", e.resx, e.resy, e.mode, e.margin );
};

netgis.MapOpenLayers.prototype.onExportJPEG = function( e )
{
	this.exportImage( "jpeg", e.resx, e.resy );
};

netgis.MapOpenLayers.prototype.onExportPNG = function( e )
{
	this.exportImage( "png", e.resx, e.resy );
};

netgis.MapOpenLayers.prototype.onExportGIF = function( e )
{
	this.exportImage( "gif", e.resx, e.resy );
};

netgis.MapOpenLayers.prototype.onParcelShowPreview = function( e )
{
	var parser = new ol.format.WKT();
	var geom = parser.readGeometry( e.geom );
	var feature = new ol.Feature( { geometry: geom } );
	
	this.parcelLayer.getSource().clear();
	this.parcelLayer.getSource().addFeature( feature );
};

netgis.MapOpenLayers.prototype.onParcelHidePreview = function( e )
{
	this.parcelLayer.getSource().clear();
};

netgis.MapOpenLayers.prototype.getWidth = function()
{
	return this.map.getSize()[ 0 ];
};

netgis.MapOpenLayers.prototype.getHeight = function()
{
	return this.map.getSize()[ 1 ];
};

/**
* 
* @param {format} string Format identifier (jpeg, png, gif)
* @param {resx} integer Map image x resolution (pixels)
* @param {resy} integer Map image y resolution (pixels)
* @param {mode} boolean PDF mode (true = landscape, false = portrait)
* @param {margin} integer PDF page margin (millimeters)
*/
netgis.MapOpenLayers.prototype.exportImage = function( format, resx, resy, mode, margin )
{
	this.client.invoke( netgis.Events.EXPORT_BEGIN, null );
	
	var self = this;
	var root = this.root;
	var map = this.map;
	var config = this.client.config;
	
	// Request Logo Image
	var logo = new Image();
	
	logo.onload = function()
	{
		//TODO: refactor map render image and image export
		//NOTE: https://github.com/openlayers/openlayers/issues/9100
		//NOTE: scaling / quality bugs when map pixel ratio is not 1.0

		// Render Target
		var renderContainer = document.createElement( "div" );
		renderContainer.style.position = "fixed";
		renderContainer.style.top = "0px";
		renderContainer.style.left = "0px";
		renderContainer.style.width = resx + "px";
		renderContainer.style.height = resy + "px";
		renderContainer.style.background = "white";
		renderContainer.style.zIndex = -1;
		renderContainer.style.opacity = 0.0;
		renderContainer.style.pointerEvents = "none";
		root.appendChild( renderContainer );
		
		map.setTarget( renderContainer );
		
		// Request Render
		map.once
		(
			"rendercomplete",
			function()
			{
				var mapCanvas = document.createElement( "canvas" );
				mapCanvas.width = resx;
				mapCanvas.height = resy;

				var mapContext = mapCanvas.getContext( "2d" );
				mapContext.webkitImageSmoothingEnabled = false;
				mapContext.mozImageSmoothingEnabled = false;
				mapContext.imageSmoothingEnabled = false;

				// Loop Map Layers
				Array.prototype.forEach.call
				(
					document.querySelectorAll( ".ol-layer canvas" ),
					function( canvas )
					{
						if ( canvas.width > 0 )
						{
							var opacity = canvas.parentNode.style.opacity;
							mapContext.globalAlpha = ( opacity === '' ) ? 1.0 : Number( opacity );

							var transform = canvas.style.transform;
							var matrix = transform.match( /^matrix\(([^\(]*)\)$/ )[ 1 ].split( "," ).map( Number );

							CanvasRenderingContext2D.prototype.setTransform.apply( mapContext, matrix );

							mapContext.drawImage( canvas, 0, 0 );
						}
					}
				);

				// Watermark Logo
				mapContext.drawImage( logo, 0, 0 );
				
				// Timestamp
				mapContext.fillStyle = "#fff";
				mapContext.fillRect( 0, mapCanvas.height - 30, 140, 30 );
				mapContext.fillStyle = "#000";
				mapContext.font = "4mm sans-serif";
				mapContext.fillText( netgis.util.getTimeStamp(), 10, mapCanvas.height - 10 );

				// Export Map Image
				var link = document.createElement( "a" );

				switch ( format )
				{
					case "pdf":
					{
						// Dimensions
						var landscape = mode;
						margin = margin ? margin : 0;
						var widthA4 = 297 - margin - margin;
						var heightA4 = 210 - margin - margin;
						var ratio = mapCanvas.width / mapCanvas.height;
						
						if ( ! landscape )
						{
							var w = widthA4;
							widthA4 = heightA4;
							heightA4 = w;
						}

						var width;
						var height;

						if ( mapCanvas.height > mapCanvas.width )
						{
							// Tall Canvas
							height = heightA4;
							width = height * ratio;
							
							if ( width > widthA4 )
							{
								width = widthA4;
								height = width / ratio;
							}
						}
						else
						{
							// Wide Canvas
							width = widthA4;
							height = width / ratio;
							
							if ( height > heightA4 )
							{
								height = heightA4;
								width = height * ratio;
							}
						}

						var pdf = new jsPDF( landscape ? "l" : "p" );

						var x = margin;
						x += ( widthA4 - width ) / 2;

						var y = margin;
						y += ( heightA4 - height ) / 2;

						// Map Image
						pdf.addImage( mapCanvas.toDataURL( "image/png,1.0", 1.0 ), "PNG", x, y, width, height );

						// Text
						pdf.setFillColor( 255, 255, 255 );
						pdf.rect( x, y + height - 11, 80, 11, "F" );
						
						pdf.setFontSize( 8 );
						pdf.text( "Datum: " + netgis.util.getTimeStamp(), x + 2, y + height - 2 - 4 );
						pdf.text( "Quelle: " + window.location.href, x + 2, y + height - 2 );

						// Same Tab
						//pdf.output( "save", { filename: config.export.defaultFilename + ".pdf" } );

						// New Tab (without Name)
						var data = pdf.output( "bloburl", { filename: config.export.defaultFilename + ".pdf" } );
						window.open( data, "_blank" );

						/*
						// Download (with Name)
						var data = pdf.output( "blob", { filename: config.export.defaultFilename + ".pdf" } );
						var blob = new Blob( [ data ], { type: "octet/stream" } );
						link.setAttribute( "download", "Export.pdf" );
						link.setAttribute( "href", window.URL.createObjectURL( blob ) );
						link.click();
						//window.URL.revokeObjectURL( url );
						*/

						break;
					}

					case "jpeg":
					{					
						if ( window.navigator.msSaveBlob )
						{
							window.navigator.msSaveBlob( mapCanvas.msToBlob(), config.export.defaultFilename + ".jpg" );
						}
						else
						{
							link.setAttribute( "download", config.export.defaultFilename + ".jpg" );
							link.setAttribute( "href", mapCanvas.toDataURL( "image/jpeg", 1.0 ) );
							link.click();
						}

						break;
					}

					case "png":
					{					
						if ( window.navigator.msSaveBlob )
						{
							//if ( ! config.export.openNewTab )
								window.navigator.msSaveBlob( mapCanvas.msToBlob(), config.export.defaultFilename + ".png" );
							/*else
								window.open( mapCanvas.msToBlob(), "_blank" );*/
						}
						else
						{
							/*if ( ! config.export.openNewTab )
							{*/
								link.setAttribute( "download", config.export.defaultFilename + ".png" );
								link.setAttribute( "href", mapCanvas.toDataURL( "image/png", 1.0 ) );
								link.click();
							/*}
							else
								window.open( mapCanvas.toDataURL( "image/png", 1.0 ), "_blank" );*/
						}

						break;
					}

					case "gif":
					{
						link.setAttribute( "download", config.export.defaultFilename + ".gif" );
						
						var gif = new GIF( { workerScript: config.export.gifWebWorker, quality: 1 } );
						gif.addFrame( mapCanvas );
						
						gif.on
						(
							"finished",
							function( blob )
							{
								link.setAttribute( "href", window.URL.createObjectURL( blob ) );
								link.click();
							}
						);

						gif.render();

						break;
					}
				}   
				
				/// Done
				map.setTarget( root );
				root.removeChild( renderContainer );
				
				self.client.invoke( netgis.Events.EXPORT_END, null );
			}
		);

		// Begin Map Render
		map.renderSync();
	};
	
	// Begin Logo Load & Render
	logo.src = config.export.logo;
};

netgis.MapOpenLayers.prototype.splitMultiPolygons = function( layer )
{
	//TODO: split only selected feature ( parameter )
	
	var source = layer.getSource();
	var features = source.getFeatures();

	var removeFeatures = [];
	var newFeatures = [];

	// Find Multi Features
	for ( var i = 0; i < features.length; i++ )
	{
		var feature = features[ i ];
		var geom = feature.getGeometry();

		if ( geom instanceof ol.geom.MultiPolygon )
		{
			var polygons = geom.getPolygons();

			// Create Single Features
			for ( var j = 0; j < polygons.length; j++ )
			{
				var polygon = polygons[ j ];
				var newFeature = new ol.Feature( { geometry: polygon } );
				newFeatures.push( newFeature );
			}

			removeFeatures.push( feature );
		}
	}

	// Remove Multi Features
	for ( var i = 0; i < removeFeatures.length; i++ )
	{
		source.removeFeature( removeFeatures[ i ] );
	}

	// Add Single Features
	source.addFeatures( newFeatures );
};