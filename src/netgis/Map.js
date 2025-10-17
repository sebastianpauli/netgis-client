"use strict";

var netgis = netgis || {};

/* global ol, proj4, jsts */

/**
 * Map Module Implementation for OpenLayers 3+.
 * @param {JSON} config [Map.Config]{@link netgis.Map.Config}<br/>
 * [Map.Projections]{@link netgis.Map.Projections}<br/>
 * [Map.Layers]{@link netgis.Map.Layers}<br/>
 * [Map.Measure]{@link netgis.Map.Measure}<br/>
 * [Map.Tools]{@link netgis.Map.Tools}<br/>
 * [Map.Styles]{@link netgis.Map.Styles}
 * 
 * @constructor
 * @memberof netgis
 */
netgis.Map = function( config )
{
	this.config = config;
	
	this.mode = null;
	this.interactions = {};
	this.layers = {};
	
	this.viewHistory = [];
	this.viewIndex = -1;
	this.viewFromHistory = false;
	this.viewHistoryMax = 20;
	this.paddingBuffer = 40;
	
	this.hoverFeature = null;
	this.hoverBounds = null;
	this.selectedFeatures = [];
	this.sketchFeatures = [];
	this.snap = null;
	this.snapFeatures = new ol.Collection();
	this.editEventsSilent = false;
	this.selectMultiple = false;
	this.selectReset = false;
	this.drawError = false;
	
	this.initElements();
	
	if ( config[ "map" ] )
	{
		this.initMap( config );
		this.initLayers();
		this.initOverlays();
		this.initInteractions();
		this.initConfig( config );

		this.setPadding( 0, 0, 0, 0 );
		this.setMode( netgis.Modes.VIEW );
	}
};

/**
 * Config Section "map"
 * @memberof netgis.Map
 * @enum
 */
netgis.Map.Config =
{
	/**
	 * Default map projection ID, see [Projections]{@link netgis.Map.Projections}
	 * @type String
	 */
	"projection": "EPSG:25832",
	
	/**
	 * Default center coordinates, <code>[ x, y ]</code>.
	 * Has no effect if default map "extent" given.
	 * @type Array
	 */
	"center": [ 329766.1782104631, 5513621.076679279 ],
	
	/**
	 * Default center coordinates in Longitude/Latitude, <code>[ lon, lat ]</code>.
	 * Has no effect if default map "extent" given.
	 * Has priority over "center".
	 * @type Array
	 */
	"center_lonlat": [ 7.0, 50.0 ],
	
	/**
	 * Default zoom level.
	 * Has no effect if initial map "extent" given.
	 * @type Number
	 */
	"zoom": 14,
	
	/**
	 * Minimum zoom level.
	 * @type Number
	 */
	"min_zoom": 5,
	
	/**
	 * Maximum zoom level.
	 * @type Number
	 */
	"max_zoom": 19,

	/**
	 * Default map extent to zoom, <code>[ minx, miny, maxx, maxy ]</code>.
	 * Has priority over "center" and "zoom/scale" parameters.
	 * Some map contexts such as WMC may also contain a "bbox" parameter that will override this.
	 * @type Array
	 */
	"extent": [ 293315.97, 5423948.96, 464350.97, 5644103.06 ],
	
	/**
	 * Default map bounding box to zoom, <code>[ minx, miny, maxx, maxy ]</code>.
	 * Has priority over "extent", but has the same effect.
	 * Some map contexts such as WMC may also contain a "bbox" parameter that will override this.
	 * @type Array
	 */
	"bbox": [ 293315.97, 5423948.96, 464350.97, 5644103.06 ],
	
	/**
	 * Available scale denominators, <code>[ 500, 1000, ... ]</code>
	 * @type Array
	 */
	"scales": [ 500, 1000, 3000, 5000, 8000, 10000, 15000, 25000, 50000, 100000, 150000, 250000, 500000, 1000000, 1500000, 2000000 ],
	
	/**
	 * Default scale denominator to zoom at startup.
	 * Has priority over "zoom".
	 * Has no effect if default map "extent" given.
	 * @type Number
	 */
	"scale": 100000,
	
	/**
	 * Display a dynamic scalebar on the map
	 * @type Boolean
	 */
	"scalebar": true,
	
	/**
	 * Maximum number of view history entries for undo/redo
	 * @type Number
	 */
	"max_view_history": 20
};

/**
 * Config Section "projections"
 * <ul>
 *	<li>Projection Definitions:<br/><code>[ "ID", "Proj4 Definition" ]</code></li>
 * </ul>
 * @memberof netgis.Map
 * @type Array
 */
netgis.Map.Projections =
[
	[ "EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs" ]
];

/**
 * Config Section "layers"
 * <ul>
 *	<li>Basic Layer Item Parameters:
 *		<ul>
 *			<li><code>"id": {String} Unique layer ID, see [Layer IDs]{@link LayerID} to avoid conflicts</code></li>
 *			<li><code>"folder": {String} Parent folder ID or null for top level, see [LayerTree.Folders]{@link netgis.LayerTree.Folders}</code></li>
 *			<li><code>"title": {String} Layer title in the layer tree</code></li>
 *			<li><code>"attribution": {String} Copyright string for the [Attribution Module]{@link netgis.Attribution}</code></li>
 *			<li><code>"active": {Boolean} Layer is visible at startup</code></li>
 *			<li><code>"removable": {Boolean} Layer is removable from the layer tree</code></li>
 *			<li><code>"order": {Number} Order value for map layer stack sorting</code></li>
 *			<li><code>"type": {String} Layer type, see {@link LayerTypes} for more type specific parameters</code></li>
 *		</ul>
 *	</li>
 *	<li>Layer Display Parameters:
 *		<ul>
 *			<li><code>"min_zoom": {Number} Minimum zoom level for this layer</code></li>
 *			<li><code>"max_zoom": {Number} Maximum zoom level for this layer</code></li>
 *			<!--<li><code>"projection": {String} Projection ID, defaults to map projection if undefined, see [Map.Projections]{@link netgis.Map.Projection}</code></li>-->
 *			<li><code>"transparency": {Number} Transparency value from 0.0 (fully opaque) to 1.0 (fully transparent)</code></li>
 *			<li><code>"fill": {String} Fill color for simple vector style in CSS format</code></li>
 *			<li><code>"stroke": {String} Stroke color for simple vector style in CSS format</code></li>
 *			<li><code>"width": {Number} Stroke width for simple vector style in pixels</code></li>
 *			<li><code>"style": {JSON} Advanced vector style parameters, see [Map.Styles]{@link netgis.Map.Styles}</code></li>
 *		</ul>
 *	</li>
 *	<li>Info Query Parameters (see [Info Module]{@link netgis.Info}):
 *		<ul>
 *			<li><code>"query": {Boolean} Enable info queries on this layer</code></li>
 *			<li><code>"query_url": {String} Info service URL, may contain {x}, {y}, {bbox}, {proj}, {width}, {height}, {px}, {py} placeholders</code></li>
 *		</ul>
 *	</li>
 * </ul>
 * 
 * @memberof netgis.Map
 * @type Array
 */
netgis.Map.Layers =
[
];

/**
 * Config Section "measure"
 * @memberof netgis.Map
 * @enum
 */
netgis.Map.Measure =
{
	/**
	 * Line color in CSS format
	 * @type String
	 */
	"line_color": "rgba( 255, 0, 0, 1.0 )",
	
	/**
	 * Line width in pixels
	 * @type Number
	 */
	"line_width": 3.0,
	
	/**
	 * Line dash pattern <code>[ SpaceWidth, LineWidth ]</code>
	 * @type Array
	 */
	"line_dash": [ 5, 10 ],
	
	/**
	 * Area fill color in CSS format
	 * @type String
	 */
	"area_fill": "rgba( 255, 0, 0, 0.3 )",
	
	/**
	 * Point radius in pixels
	 * @type Number
	 */
	"point_radius": 4.0,
	
	/**
	 * Point fill color in CSS format
	 * @type String
	 */
	"point_fill": "rgba( 255, 255, 255, 1.0 )",
	
	/**
	 * Point stroke color in CSS format
	 * @type String
	 */
	"point_stroke": "rgba( 0, 0, 0, 1.0 )",
	
	/**
	 * Text label color in CSS format
	 * @type String
	 */
	"text_color": "#871d33",
	
	/**
	 * Text label buffer color in CSS format
	 * @type String
	 */
	"text_back": "rgba( 255, 255, 255, 0.7 )"
};

/**
 * Config Section "tools"
 * @memberof netgis.Map
 * @enum
 */
netgis.Map.Tools =
{
	/**
	 * Enable edit tools
	 * @type Boolean
	 */
	"editable": true,
	
	/**
	 * Element ID for edit outputs (hidden storage input)
	 * @type String
	 */
	"output_id": "",
	
	/**
	 * Enable interactive rendering while editing
	 * @type Boolean
	 */
	"interactive_render": true,
	
	/**
	 * Reset multi selection after each select action
	 * @type Boolean
	 */
	"select_multi_reset": true,

	/**
	 * Default buffer settings
	 * <ul>
	 *	<li><code>"default_radius": {Number}</code></li>
	 *	<li><code>"default_segments": {Number}</code></li>
	 * </ul>
	 * @type JSON
	 */
	"buffer":
	{
		"default_radius": 300,
		"default_segments": 3
	},

	/**
	 * Default snapping settings
	 * <ul>
	 *	<li><code>"show": {Boolean}</code></li>
	 *	<li><code>"active": {Boolean}</code></li>
	 *	<li><code>"tolerance": {Number}</code></li>
	 * </ul>
	 * @type JSON
	 */
	"snapping":
	{
		"show": true,
		"active": true,
		"tolerance": 10
	},
	
	/**
	 * Boundary polygons for drawing tools in GeoJSON format (or leave undefined for no bounds checking)
	 * @type String
	 */
	"bounds": undefined,
	
	/**
	 * Message to display if editing out of bounds
	 * @type String
	 */
	"bounds_message": "Out of bounds!",
	
	/**
	 * Show boundary polygons on map
	 * @type Boolean
	 */
	"show_bounds": true
};

/**
 * Config Section "styles"<br/>
 * Common Parameters:
 * <ul>
 *	<li><code>"fill": {String} Fill color in CSS format</code></li>
 *	<li><code>"stroke": {String} Stroke color in CSS format</code></li>
 *	<li><code>"width": {Number} Stroke width in pixels</code></li>
 *	<li><code>"radius": {Number} Point radius in pixels</code></li>
 *	<li><code>"viewport_labels": {Boolean} Try to keep text labels inside map view (experimental)</code></li>
 * </ul>
 * 
 * @memberof netgis.Map
 * @enum
 */
netgis.Map.Styles =
{
	/**
	 * Default draw feature style
	 * @type JSON
	 */
	"draw":
	{
		"fill": "rgba( 255, 0, 0, 0.5 )",
		"stroke": "#ff0000",
		"width": 3,
		"radius": 6,
		"viewport_labels": true // Try To Keep Polygon Labels In View
	},

	/**
	 * Default non-editable feature style
	 * @type JSON
	 */
	"non_edit":
	{
		"fill": "rgba( 80, 80, 80, 0.5 )",
		"stroke": "#666666",
		"width": 3,
		"radius": 6,
		"viewport_labels": true
	},

	/**
	 * Default select feature style
	 * @type JSON
	 */
	"select":
	{
		"fill": "rgba( 0, 127, 255, 0.5 )",
		"stroke": "#007fff",
		"width": 3,
		"radius": 6
	},

	/**
	 * Default draw sketch feature style
	 * @type JSON
	 */
	"sketch":
	{
		"fill": "rgba( 0, 127, 0, 0.5 )",
		"stroke": "#007f00",
		"width": 3,
		"radius": 6
	},

	/**
	 * Default draw error style
	 * @type JSON
	 */
	"error":
	{
		"fill": "rgba( 255, 0, 0, 0.5 )",
		"stroke": "#ff0000",
		"width": 3,
		"radius": 6
	},

	/**
	 * Default edit boundary style
	 * @type JSON
	 */
	"bounds":
	{
		"fill": "rgba( 0, 0, 0, 0.0 )",
		"stroke": "#000000",
		"width": 3,
		"radius": 6
	},

	/**
	 * Default feature modify style
	 * @type JSON
	 */
	"modify":
	{
		"fill": "rgba( 255, 127, 0, 0.5 )",
		"stroke": "#ff7f00",
		"width": 3,
		"radius": 6
	},

	/**
	 * Default parcels style
	 * @type JSON
	 */
	"parcel":
	{
		"fill": "rgba( 127, 0, 0, 0.0 )",
		"stroke": "rgba( 127, 0, 0, 1.0 )",
		"width": 1.5
	},

	/**
	 * Default imported features style
	 * @type JSON
	 */
	"import":
	{
		"fill": "rgba( 0, 127, 255, 0.2 )",
		"stroke": "rgba( 0, 127, 255, 1.0 )",
		"width": 1.5
	}
};

netgis.Map.prototype.initElements = function()
{
	this.container = document.createElement( "div" );
	this.container.setAttribute( "tabindex", -1 );
	this.container.className = "netgis-map";
	
	this.container.addEventListener( "pointerleave", this.onPointerLeave.bind( this ) );
	
	this.container.addEventListener( "click", this.onContainerClick.bind( this ) );
	this.container.addEventListener( "contextmenu", this.onRightClick.bind( this ) );
	this.container.addEventListener( "keydown", this.onKeyDown.bind( this ) );
	this.container.addEventListener( "keyup", this.onKeyUp.bind( this ) );
};

netgis.Map.prototype.initMap = function( config )
{
	var cfg = config[ "map" ];
	
	// Projections (WGS/Lon-Lat Supported By Default)
	if ( typeof proj4 !== "undefined" )
	{
		if ( config[ "projections" ] && config[ "projections" ].length > 0 ) proj4.defs( config[ "projections" ] );
		proj4.defs( "urn:ogc:def:crs:OGC:1.3:CRS84", proj4.defs( "EPSG:4326" ) );
		ol.proj.proj4.register( proj4 );
	}
	else
	{
		if ( ( config[ "projections" ] && config[ "projections" ].length > 0 ) || cfg[ "projection" ] )
		{
			console.error( "map projections configured but no proj4 js library found", config[ "projections" ], cfg[ "projection" ] );
		}
	}
	
	// View
	var center = undefined;
	
	if ( cfg[ "center_lonlat" ] ) center = ol.proj.fromLonLat( cfg[ "center_lonlat" ], cfg[ "projection" ] );
	if ( ! center && cfg[ "center" ] ) center = cfg[ "center" ];
	
	var zoom = undefined;
	
	if ( cfg[ "zoom" ] || cfg[ "zoom" ] === 0 ) zoom = cfg[ "zoom" ];
	if ( zoom === undefined && ( cfg[ "min_zoom" ] !== undefined ) ) zoom = cfg[ "min_zoom" ];
	if ( zoom === undefined ) zoom = 0;
	
	var viewParams =
	{
		projection: cfg[ "projection" ],
		center: center,
		minZoom: cfg[ "min_zoom" ],
		maxZoom: cfg[ "max_zoom" ],
		zoom: zoom
	};
	
	this.view = new ol.View
	(
		viewParams
	);
	
	if ( cfg[ "default_scale" ] ) console.error( "config[ 'map' ][ 'default_scale' ] is deprecated, use config[ 'map' ][ 'scale' ] instead" );
	if ( cfg[ "scale" ] ) this.view.setResolution( this.getResolutionFromScale( cfg[ "scale" ] ) );

	// Map
	this.map = new ol.Map
	(
		{
			target: this.container,
			view: this.view,
			pixelRatio: 1.0,
			moveTolerance: ( cfg[ "move_tolerance" ] || cfg[ "move_tolerance" ] === 0 ) ? cfg[ "move_tolerance" ] : 7,
			controls: []
		}
	);
	
	// Scale Bar
	if ( cfg[ "scalebar" ] )
	{
		this.scalebar = new ol.control.ScaleLine( { bar: true } );
		this.map.addControl( this.scalebar );
		
		var scales = cfg[ "scales" ];
		
		if ( scales && scales.length > 0 )
		{
			this.scalebarSelect = document.createElement( "select" );
			this.scalebarSelect.addEventListener( "change", this.onScalebarSelectChange.bind( this ) );
			this.scalebar.element.appendChild( this.scalebarSelect );
			
			for ( var i = 0; i < scales.length; i++ )
			{
				var scale = scales[ i ];
				var option = document.createElement( "option" );
				option.innerHTML = "1:" + scale;
				option.setAttribute( "value", scale );
				this.scalebarSelect.appendChild( option );
			}
		}
	}
	
	// Map Events
	this.map.on( "moveend", this.onMapMoveEnd.bind( this ) );
	this.map.on( "pointermove", this.onPointerMove.bind( this ) );
	this.map.on( "click", this.onPointerClick.bind( this ) );
	
	// TODO: unify event init
	
	// Default Zoom Extent
	if ( cfg )
	{	
		var extent = cfg[ "extent" ];
		if ( cfg[ "bbox" ] ) extent = cfg[ "bbox" ];

		if ( extent )
		{
			// Wait Until Map In DOM
			var self = this;

			window.setTimeout
			(
				function()
				{
					self.map.updateSize();
					self.view.fit( extent );
				},
				10
			);
		}
	}
};

netgis.Map.prototype.initLayers = function()
{
	// Measure Layer
	this.measureLayer = new ol.layer.Vector( { source: new ol.source.Vector( { features: [] } ), zIndex: 60000, style: this.styleMeasure.bind( this ) } );
	this.map.addLayer( this.measureLayer );
	
	var toolsConfig = this.config[ "tools" ];
	
	if ( toolsConfig )
	{
		// Non Edit Layer
		this.nonEditLayer = new ol.layer.Vector
		(
			{
				source: new ol.source.Vector( { features: [] } ),
				zIndex: 50000,
				style: this.styleNonEdit.bind( this ),
				updateWhileAnimating: toolsConfig && toolsConfig[ "interactive_render" ] ? toolsConfig[ "interactive_render" ] : false,
				updateWhileInteracting: toolsConfig && toolsConfig[ "interactive_render" ] ? toolsConfig[ "interactive_render" ] : false
			}
		);

		this.map.addLayer( this.nonEditLayer );

		// Edit Layer
		this.editLayer = new ol.layer.Vector
		(
			{
				source: new ol.source.Vector( { features: [] } ),
				zIndex: 50000,
				style: this.styleEdit.bind( this ),
				updateWhileAnimating: toolsConfig && toolsConfig[ "interactive_render" ] ? toolsConfig[ "interactive_render" ] : false,
				updateWhileInteracting: toolsConfig && toolsConfig[ "interactive_render" ] ? toolsConfig[ "interactive_render" ] : false
			}
		);

		this.map.addLayer( this.editLayer );

		this.editLayer.getSource().on( "addfeature", this.onEditLayerAdd.bind( this ) );
		this.editLayer.getSource().on( "changefeature", this.onEditLayerChange.bind( this ) ); //TODO: fired on feature style change? use only one style function with selected/hover states?
		this.editLayer.getSource().on( "removefeature", this.onEditLayerRemove.bind( this ) );

		// Preview Layer
		this.previewLayer = new ol.layer.Vector( { source: new ol.source.Vector( { features: [] } ), zIndex: 55000, style: this.styleSketch.bind( this ) } );
		this.map.addLayer( this.previewLayer );

		// Bounds Layer
		this.boundsLayer = null;
		var bounds = toolsConfig[ "bounds" ];

		if ( bounds )
		{
			bounds = netgis.util.replace( bounds, "'", '"' );
			
			var features = new ol.format.GeoJSON().readFeatures( bounds );

			var style = null;

			if ( this.config[ "tools" ][ "show_bounds" ] && this.config[ "styles" ][ "bounds" ] )
				style = this.createStyle( this.config[ "styles" ][ "bounds" ] );

			this.boundsLayer = new ol.layer.Vector( { source: new ol.source.Vector( { features: features } ), style: style, zIndex: 60000 } );
			this.map.addLayer( this.boundsLayer );
		}
	}
	
	// Geolocation Layer
	this.geolocLayer = null;
	
	if ( this.config[ "modules" ] && this.config[ "modules" ][ "geolocation" ] === true )
	{
		var cfg = this.config[ "geolocation" ];
		
		if ( ! cfg ) cfg = netgis.Geolocation.Config;
		
		var style = 
		[
			new ol.style.Style
			(
				{
					image: new ol.style.Circle
					(
						{
							fill: new ol.style.Fill( { color: "#ffffff" } ),
							radius: 8.0
						}
					)
				}
			),
			new ol.style.Style
			(
				{
					image: new ol.style.Circle
					(
						{
							fill: new ol.style.Fill( { color: cfg[ "marker_color" ] ? cfg[ "marker_color" ] : "#ff0000" } ),
							radius: 5.0
						}
					)
				}
			)
		];
		
		var marker = new ol.Feature( { geometry: new ol.geom.Point( ol.proj.fromLonLat( [ 7.0, 50.0 ], this.view.getProjection() ) ) } );
		marker.setId( "geolocation" );
		
		this.geolocLayer = new ol.layer.Vector( { source: new ol.source.Vector( { features: [ marker ] } ), style: style, zIndex: 66000 } );
		this.map.addLayer( this.geolocLayer );
		
		this.geolocLayer.setVisible( false );
	}
};

netgis.Map.prototype.initOverlays = function()
{
	var popupElement = document.createElement( "div" );
	popupElement.className = "netgis-map-overlay";
	
	this.popupOverlay = new ol.Overlay
	(
		{
			id: "popup",
			element: popupElement,
			positioning: "center-center"
		}
	);
	
	this.map.addOverlay( this.popupOverlay );
};

netgis.Map.prototype.initInteractions = function()
{
	// View
	
	this.interactions[ netgis.Modes.VIEW ] =
	[
		new ol.interaction.DragPan(),
		new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.ZOOM_BOX ] =
	[
		new ol.interaction.DragZoom( { condition: function( e ) { return e.originalEvent.button === 0; }, out: false, className: "netgis-zoom-box" } ),
		new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
		new ol.interaction.MouseWheelZoom()
	];
	
	// Measure
	
	this.interactions[ netgis.Modes.MEASURE_LINE ] =
	[
		new ol.interaction.DragPan(),
		new ol.interaction.Modify( { source: this.measureLayer.getSource(), deleteCondition: ol.events.condition.doubleClick, style: this.styleMeasure.bind( this ) } ),
		new ol.interaction.Draw( { type: "LineString", source: this.measureLayer.getSource(), style: this.styleMeasure.bind( this ) } ),
		new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
		new ol.interaction.PinchZoom(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.MEASURE_AREA ] =
	[
		new ol.interaction.DragPan(),
		new ol.interaction.Modify( { source: this.measureLayer.getSource(), deleteCondition: ol.events.condition.doubleClick, style: this.styleMeasure.bind( this ) } ),
		new ol.interaction.Draw( { type: "Polygon", source: this.measureLayer.getSource(), style: this.styleMeasure.bind( this ) /* condition: function( e ) { return ol.events.condition.noModifierKeys( e ) && ol.events.condition.primaryAction( e ); }, /*finishCondition: function( e ) { return ol.events.condition.doubleClick( e ) || ( ol.events.condition.primaryAction( e ) === false ); }*/ } ),
		new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
		new ol.interaction.PinchZoom(),
		new ol.interaction.MouseWheelZoom()
	];
	
	this.interactions[ netgis.Modes.MEASURE_LINE ][ 2 ].on( "drawstart", this.onMeasureLineBegin.bind( this ) );
	this.interactions[ netgis.Modes.MEASURE_AREA ][ 2 ].on( "drawstart", this.onMeasureAreaBegin.bind( this ) );
	
	if ( this.config[ "tools" ] && this.config[ "tools" ][ "editable" ] === true )
	{
		// Draw

		var bounds = this.config[ "tools" ][ "bounds" ] ? true : false;

		this.interactions[ netgis.Modes.DRAW_POINTS ] =
		[
			new ol.interaction.Draw( { type: "Point", source: this.editLayer.getSource(), style: this.styleSketch.bind( this ), geometryFunction: bounds ? this.onDrawPointsUpdateGeom.bind( this ) : undefined } ),
			new ol.interaction.DragPan(),
			new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
			new ol.interaction.MouseWheelZoom()
		];

		this.interactions[ netgis.Modes.DRAW_POINTS ][ 0 ].on( "drawend", this.onDrawBufferEnd.bind( this ) );
		if ( bounds ) this.interactions[ netgis.Modes.DRAW_POINTS ][ 0 ].on( "drawend", this.onDrawPointsEnd.bind( this ) );

		this.interactions[ netgis.Modes.DRAW_LINES ] =
		[
			new ol.interaction.Draw( { type: "LineString", source: this.editLayer.getSource(), style: this.styleSketch.bind( this ), geometryFunction: bounds ? this.onDrawLinesUpdateGeom.bind( this ) : undefined } ),
			new ol.interaction.DragPan(),
			new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
			new ol.interaction.MouseWheelZoom()
		];

		this.interactions[ netgis.Modes.DRAW_LINES ][ 0 ].on( "drawend", this.onDrawBufferEnd.bind( this ) );
		if ( bounds ) this.interactions[ netgis.Modes.DRAW_LINES ][ 0 ].on( "drawend", this.onDrawLinesEnd.bind( this ) );

		this.interactions[ netgis.Modes.DRAW_POLYGONS ] =
		[
			new ol.interaction.Draw( { type: "Polygon", source: this.editLayer.getSource(), style: this.styleSketch.bind( this ), geometryFunction: bounds ? this.onDrawPolygonsUpdateGeom.bind( this ) : undefined } ),
			new ol.interaction.DragPan(),
			new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
			new ol.interaction.MouseWheelZoom()
		];

		if ( bounds ) this.interactions[ netgis.Modes.DRAW_POLYGONS ][ 0 ].on( "drawend", this.onDrawPolygonsEnd.bind( this ) );

		// Edit

		this.interactions[ netgis.Modes.MODIFY_FEATURES ] =
		[
			new ol.interaction.DragPan(),
			new ol.interaction.Modify( { source: this.editLayer.getSource(), deleteCondition: ol.events.condition.doubleClick, style: this.styleModify.bind( this ) } ),
			new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
			new ol.interaction.MouseWheelZoom()
		];
		
		this.interactions[ netgis.Modes.DELETE_FEATURES ] =
		[
			new ol.interaction.DragPan(),
			new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
			new ol.interaction.MouseWheelZoom()
		];

		this.interactions[ netgis.Modes.CUT_FEATURES_DRAW ] =
		[
			new ol.interaction.Draw( { type: "Polygon", style: this.styleSketch.bind( this ) } ),
			new ol.interaction.DragPan(),
			new ol.interaction.DragPan( { condition: function( e ) { return e.originalEvent.button === 1; } } ),
			new ol.interaction.MouseWheelZoom()
		];

		this.interactions[ netgis.Modes.CUT_FEATURES_DRAW ][ 0 ].on( "drawend", this.onCutFeaturesDrawEnd.bind( this ) );
	}
};

netgis.Map.prototype.initConfig = function( config )
{	
	var cfg = config[ "map" ];
	
	if ( cfg )
	{
		// Map View Late Init For Lazy Loaded Contexts
		if ( cfg[ "bbox" ] )
		{
			this.zoomBBox( config[ "map" ][ "bbox" ] );
		}

		if ( cfg[ "zoom" ] && ( ! cfg[ "extent" ] ) && ( ! cfg[ "scale" ] ) )
		{
			this.view.setZoom( config[ "map" ][ "zoom" ] );
		}
		
		if ( cfg[ "max_view_history" ] )
		{
			this.viewHistoryMax = cfg[ "max_view_history" ];
		}

		// TODO: move map view config here ?
		// TODO: apply view config params function ?
		// TODO: does not setting view params here break context loading ?
	}
	
	// Add Active Layers ( Top To Bottom Order )
	var configLayers = config[ "layers" ];
	
	if ( configLayers )
	{
		for ( var i = configLayers.length - 1; i >= 0; i-- )
		{
			var layer = configLayers[ i ];
			if ( layer[ "active" ] === true ) this.addLayer( layer[ "id" ], layer );
		}
	}
};

netgis.Map.prototype.attachTo = function( parent )
{
	parent.appendChild( this.container );
	
	parent.addEventListener( netgis.Events.CLIENT_CONTEXT_RESPONSE, this.onClientContextResponse.bind( this ) );
	parent.addEventListener( netgis.Events.CLIENT_SET_MODE, this.onClientSetMode.bind( this ) );
	parent.addEventListener( netgis.Events.PANEL_TOGGLE, this.onPanelToggle.bind( this ) );
	parent.addEventListener( netgis.Events.PANEL_RESIZE, this.onPanelResize.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_EDIT_LAYER_LOADED, this.onEditLayerLoaded.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_ZOOM, this.onMapZoom.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_ZOOM_HOME, this.onMapZoomHome.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_ZOOM_LONLAT, this.onMapZoomLonLat.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_ZOOM_SCALE, this.onMapZoomScale.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_ZOOM_LAYER, this.onMapZoomLayer.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_ZOOM_LEVEL, this.onMapZoomLevel.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_LAYER_CREATE, this.onMapLayerCreate.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_TOGGLE, this.onMapLayerToggle.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_TRANSPARENCY, this.onMapLayerTransparency.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_ORDER, this.onMapLayerOrder.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_LAYER_DELETE, this.onMapLayerDelete.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_SNAP_TOGGLE, this.onMapSnapToggle.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_VIEW_PREV, this.onMapViewPrev.bind( this ) );
	parent.addEventListener( netgis.Events.MAP_VIEW_NEXT, this.onMapViewNext.bind( this ) );
	
	parent.addEventListener( netgis.Events.GEOLOCATION_TOGGLE_ACTIVE, this.onGeolocToggleActive.bind( this ) );
	parent.addEventListener( netgis.Events.GEOLOCATION_CHANGE, this.onGeolocChange.bind( this ) );
	
	parent.addEventListener( netgis.Events.MEASURE_CLEAR, this.onMeasureClear.bind( this ) );
	
	parent.addEventListener( netgis.Events.SELECT_MULTI_TOGGLE, this.onSelectMultiToggle.bind( this ) );
	
	parent.addEventListener( netgis.Events.DRAW_BUFFER_TOGGLE, this.onDrawBufferToggle.bind( this ) );
	parent.addEventListener( netgis.Events.DRAW_BUFFER_CHANGE, this.onDrawBufferChange.bind( this ) );
	
	parent.addEventListener( netgis.Events.BUFFER_CHANGE, this.onBufferChange.bind( this ) );
	parent.addEventListener( netgis.Events.BUFFER_ACCEPT, this.onBufferAccept.bind( this ) );
	
	parent.addEventListener( netgis.Events.IMPORT_LAYER_ACCEPT, this.onImportLayerAccept.bind( this ) );
	parent.addEventListener( netgis.Events.IMPORT_LAYER_PREVIEW, this.onImportLayerPreview.bind( this ) );
	parent.addEventListener( netgis.Events.IMPORT_GEOPORTAL_SUBMIT, this.onImportGeoportalSubmit.bind( this ) );
	
	parent.addEventListener( netgis.Events.MAP_COPY_FEATURE_TO_EDIT, this.onCopyFeatureToEdit.bind( this ) );
	
	parent.addEventListener( netgis.Events.SEARCHPARCEL_ITEM_ENTER, this.onSearchParcelItemEnter.bind( this ) );
	parent.addEventListener( netgis.Events.SEARCHPARCEL_ITEM_LEAVE, this.onSearchParcelItemLeave.bind( this ) );
	parent.addEventListener( netgis.Events.SEARCHPARCEL_ITEM_CLICK, this.onSearchParcelItemClick.bind( this ) );
	parent.addEventListener( netgis.Events.SEARCHPARCEL_ITEM_IMPORT, this.onSearchParcelItemImport.bind( this ) );
	
	parent.addEventListener( netgis.Events.EXPORT_BEGIN, this.onExportBegin.bind( this ) );
	
	parent.addEventListener( netgis.Events.TIMESLIDER_SHOW, this.onTimeSliderShow.bind( this ) );
	parent.addEventListener( netgis.Events.TIMESLIDER_HIDE, this.onTimeSliderHide.bind( this ) );
	parent.addEventListener( netgis.Events.TIMESLIDER_SELECT, this.onTimeSliderSelect.bind( this ) );
};

netgis.Map.prototype.setMode = function( mode )
{
	//console.info( "Map Set Mode:", this.mode, "->", mode );
	
	// Leave
	switch( this.mode )
	{
		case netgis.Modes.VIEW:
		{
			this.container.classList.remove( "netgis-clickable" );
			break;
		}
		
		case netgis.Modes.MODIFY_FEATURES:
		{
			this.editLayer.setStyle( this.styleEdit.bind( this ) );
			break;
		}
		
		case netgis.Modes.DRAW_POINTS:
		case netgis.Modes.DRAW_LINES:
		{
			this.previewLayer.getSource().clear();
			this.container.classList.remove( "netgis-not-allowed" );
			this.container.removeAttribute( "title" );
			break;
		}
		
		case netgis.Modes.DRAW_POLYGONS:
		{
			this.container.classList.remove( "netgis-not-allowed" );
			this.container.removeAttribute( "title" );
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURES:
		{
			this.clearSketchFeatures();
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURES_EDIT:
		{
			this.clearSketchFeatures();
			this.selectedFeatures = [];
			this.redrawVectorLayers();
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURES_DYNAMIC:
		{
			this.clearSketchFeatures();
			this.selectedFeatures = [];
			this.redrawVectorLayers();
			break;
		}
		
		case netgis.Modes.CUT_FEATURES:
		{
			if ( mode !== netgis.Modes.CUT_FEATURES_DRAW )
			{
				this.selectedFeatures = [];
				this.redrawVectorLayers();
			}
			
			break;
		}
		
		case netgis.Modes.CUT_FEATURES_DRAW:
		{
			this.selectedFeatures = [];
			this.redrawVectorLayers();
			break;
		}
	}
	
	this.map.getInteractions().clear();
	
	if ( this.mode ) this.container.classList.remove( "netgis-mode-" + this.mode );
	
	// Enter
	var interactions = this.interactions[ mode ];
	
	if ( ! interactions )
	{
		console.warn( "no interactions found for mode", mode );
		interactions = this.interactions[ netgis.Modes.VIEW ];
	}
	
	for ( var i = 0; i < interactions.length; i++ )
	{
		this.map.addInteraction( interactions[ i ] );
	}
	
	var editable = this.config[ "tools" ] && this.config[ "tools" ][ "editable" ];
	
	switch ( mode )
	{
		case netgis.Modes.DRAW_POINTS:
		case netgis.Modes.DRAW_LINES:
		{
			if ( editable )
			{
				this.setSnapping( this.drawSnapOn );
				this.onDrawBufferToggle( { detail: { on: this.drawBufferOn, radius: this.drawBufferRadius, segments: this.drawBufferSegments } } );
			}
			
			break;
		}
		
		case netgis.Modes.DRAW_POLYGONS:
		{
			if ( editable )
			{
				this.setSnapping( this.drawSnapOn );
			}
			
			break;
		}
		
		case netgis.Modes.MODIFY_FEATURES:
		{
			if ( editable )
			{
				this.setSnapping( this.drawSnapOn );
				this.editLayer.setStyle( this.styleModify.bind( this ) );
			}
			
			break;
		}
	}
	
	this.container.classList.add( "netgis-mode-" + mode );
	
	this.mode = mode;
};

netgis.Map.prototype.addLayer = function( id, params )
{
	//console.info( "Add Layer:", id, params );
	
	var layer = this.createLayer( params );
	
	if ( layer )
	{
		layer.set( "id", id );
		
		this.map.addLayer( layer );
		this.layers[ id ] = layer;
		
		if ( params[ "order" ] ) layer.setZIndex( params[ "order" ] );
		if ( params[ "transparency" ] ) layer.setOpacity( 1.0 - params[ "transparency" ] );
		if ( params[ "style" ] ) layer.setStyle( this.createStyle( params[ "style" ] ) );
		if ( params[ "min_zoom" ] ) layer.setMinZoom( params[ "min_zoom" ] - 0.0001 ); // NOTE: subtract small bias because it's exclusive in OL
		if ( params[ "max_zoom" ] ) layer.setMaxZoom( params[ "max_zoom" ] );
		
		if ( layer instanceof ol.layer.Vector ) this.addSnapLayer( layer );
		
		if ( params[ "type" ] === netgis.LayerTypes.WMST )
		{
			netgis.util.invoke( this.container, netgis.Events.TIMESLIDER_SHOW, { layer: id, title: params[ "title" ], url: params[ "url" ], name: params[ "name" ] } );
		}
	}
	
	return layer;
};

netgis.Map.prototype.isLayerQueryable = function( layer )
{
	// TODO: refactor with Info.isLayerQueryable ! static method ?
	
	var queryable = false;
	
	if ( layer[ "query" ] === true )
	{
		// Queryable Config Layers
		queryable = true;
	}
	else if ( layer[ "query" ] !== false )
	{
		// Default Query Behavior For WMS
		switch ( layer[ "type" ] )
		{
			case netgis.LayerTypes.WMS:
			case netgis.LayerTypes.WMST:
			{
				queryable = true;
				break;
			}
		}
	}
	
	return queryable;
};

netgis.Map.prototype.getQueryableLayers = function( novectors )
{
	var layers = [];
	
	var cfg = this.config[ "layers" ];
	
	if ( cfg )
	{
		for ( var i = 0; i < cfg.length; i++ )
		{
			var params = cfg[ i ];
			var layer = this.layers[ params[ "id" ] ];

			if ( ! layer ) continue;

			// Exclude Vector Layers
			if ( novectors && ( layer instanceof ol.layer.Vector ) ) continue;

			if ( this.isLayerQueryable( params ) ) layers.push( params );
		}
	}
	
	return layers;
};

netgis.Map.prototype.createLayer = function( params )
{
	var layer;
	
	switch ( params[ "type" ] )
	{
		case netgis.LayerTypes.HIDDEN:
		{
			break;
		}
		
		// Raster Layers
		
		case netgis.LayerTypes.TMS:
		case netgis.LayerTypes.XYZ:
		{
			layer = this.createLayerTMS( params[ "url" ], params[ "projection" ], params[ "extent" ], params[ "scales" ], params[ "resolutions" ] );
			break;
		}
		
		case netgis.LayerTypes.OSM:
		{
			layer = this.createLayerTMS( "https://{a-c}.tile.openstreetmap.de/{z}/{x}/{y}.png" );
			break;
		}
		
		case netgis.LayerTypes.WMTS:
		{
			layer = this.createLayerWMTS( params[ "url" ], params[ "name" ] );
			break;
		}
		
		case netgis.LayerTypes.WMS:
		{
			layer = this.createLayerWMS( params[ "url" ], params[ "name" ], params[ "format" ], params[ "tiled" ], params[ "username" ], params[ "password" ] );
			break;
		}
		
		case netgis.LayerTypes.WMST:
		{
			layer = this.createLayerWMST( params[ "url" ], params[ "name" ], params[ "format" ], params[ "tiled" ], params[ "username" ], params[ "password" ] );
			break;
		}
		
		// Vector Layers
		
		case netgis.LayerTypes.GEOJSON:
		{
			var data = params[ "data" ];
			if ( data && netgis.util.isString( data ) ) data = JSON.parse( data );
			
			layer = this.createLayerGeoJSON( data ? data : params[ "url" ] );
			break;
		}
		
		case netgis.LayerTypes.WFS:
		{
			layer = this.createLayerWFS( params[ "url" ], params[ "name" ], this.view.getProjection().getCode(), params[ "format" ], params[ "username" ], params[ "password" ] );
			break;
		}
		
		case netgis.LayerTypes.VTILES:
		{
			layer = this.createLayerVectorTiles( params[ "url" ], params[ "extent" ], params[ "min_zoom" ], params[ "max_zoom" ] );
			break;
		}
		
		case netgis.LayerTypes.GML:
		{
			layer = this.createLayerGML( params[ "data" ] );
			break;
		}
		
		case netgis.LayerTypes.KML:
		{
			layer = this.createLayerKML( params[ "url" ] );
			break;
		}
		
		case netgis.LayerTypes.GEOPACKAGE:
		{
			layer = this.createLayerGeoPackage( params[ "data" ] );
			break;
		}
		
		case netgis.LayerTypes.SPATIALITE:
		{
			layer = this.createLayerSpatialite( params[ "data" ] );
			break;
		}
		
		case netgis.LayerTypes.SHAPEFILE:
		{
			layer = this.createLayerShapefile( params[ "data" ] );
			break;
		}
		
		case netgis.LayerTypes.WKT:
		{
			layer = this.createLayerWKT( params[ "data" ] );
			break;
		}
		
		default:
		{
			console.error( "unknown layer type", params[ "type" ] );
			break;
		}	
	}
	
	return layer;
};

netgis.Map.prototype.removeLayer = function( id )
{
	//console.info( "Remove Layer:", id );
	
	var layer = this.layers[ id ];
	
	if ( layer instanceof ol.layer.Vector ) this.removeSnapLayer( layer );
	
	for ( var i = 0; i < this.config[ "layers" ].length; i++ )
	{
		var params = this.config[ "layers" ][ i ];
		
		if ( params[ "id" ] === id )
		{			
			// TODO: optimize this (special case for WMST)
			if ( params[ "type" ] === netgis.LayerTypes.WMST )
			{
				netgis.util.invoke( this.container, netgis.Events.TIMESLIDER_HIDE, null );
			}
		}
	}
	
	this.map.removeLayer( layer );
	delete this.layers[ id ];
};

netgis.Map.prototype.setLayerOrder = function( id, order )
{
	var layer = this.layers[ id ];
	layer.setZIndex( order );
};

netgis.Map.prototype.createStyle = function( config )
{
	var radius = config[ "radius" ] ? config[ "radius" ] : 3.0;
	var width = config[ "width" ] ? config[ "width" ] : 1.0;
	var fill = config[ "fill" ] ? config[ "fill" ] : "gray";
	var stroke = config[ "stroke" ] ? config[ "stroke" ] : "black";
	
	var styler = function( feature )
	{
		var style =
		//[
			// Background
			/*new ol.style.Style
			(
				{
					image: new ol.style.Circle( { radius: config[ "radius" ], fill: new ol.style.Fill( { color: config[ "stroke" ] } ) } )
				}
			),*/

			// Foreground
			new ol.style.Style
			(
				{
					image: new ol.style.Circle( { radius: radius - width, fill: new ol.style.Fill( { color: fill } ) } ),
					fill: new ol.style.Fill( { color: fill } ),
					stroke: new ol.style.Stroke( { color: stroke, width: width } )
				}
			);
		//];

		//if ( label ) style.push( label );

		/*if ( labelConfig && labelConfig.length > 0 )
		{
			var str = feature.get( labelConfig );
			if ( ! str ) str = labelConfig;

			//var str = "Label";

			//var label = new ol.style.Text
			var label = new ol.style.Style
			(
				{
					text: new ol.style.Text
					(
						{
							text: [ str, "4mm sans-serif" ],
							font: "4mm Verdana, sans-serif",
							fill: new ol.style.Fill( { color: "rgba( 0, 0, 0, 1.0 )" } ),
							backgroundFill: new ol.style.Fill( { color: "rgba( 255, 255, 255, 0.5 )" } ),
							padding: [ 2, 4, 2, 4 ],
							overflow: true
						}
					)
				}
			);

			//classified.setText( label );
			style.push( label );
		}*/

		return style;
	};
	
	return styler;
};

netgis.Map.prototype.styleMeasure = function( feature )
{
	var geom = feature.getGeometry();
	var cfg = this.config[ "measure" ];
	
	if ( ! cfg ) cfg = netgis.Map.Measure;
	
	// Line
	var style = new ol.style.Style
	(
		{
			fill: new ol.style.Fill( { color: cfg[ "area_fill" ] } ),
			stroke: new ol.style.Stroke( { color: cfg[ "line_color" ], width: cfg[ "line_width" ], lineDash: cfg[ "line_dash" ] } )
		}
	);
	
	// Label
	if ( geom instanceof ol.geom.Polygon )
	{
		var area = geom.getArea();
		
		style.setText
		(
			new ol.style.Text
			(
				{
					text: [ netgis.util.formatArea( area, true ), "4mm sans-serif" ],
					font: "Arial",
					fill: new ol.style.Fill( { color: cfg[ "text_color" ] } ),
					backgroundFill: new ol.style.Fill( { color: cfg[ "text_back" ] } ),
					padding: [ 2, 4, 2, 4 ],
					overflow: true
				}
			)
		);
	}
	else if ( geom instanceof ol.geom.LineString && ( this.mode === netgis.Modes.MEASURE_LINE || this.mode === netgis.Modes.VIEW ) )
	{
		var len = geom.getLength();
		
		style.setText
		(
			new ol.style.Text
			(
				{
					text: [ netgis.util.formatDistance( len ), "4mm sans-serif" ],
					font: "Arial",
					fill: new ol.style.Fill( { color: cfg[ "text_color" ] } ),
					backgroundFill: new ol.style.Fill( { color: cfg[ "text_back" ] } ),
					padding: [ 2, 4, 2, 4 ],
					overflow: true
				}
			)
		);
	}
	
	// Points
	if ( cfg[ "point_radius" ] && cfg[ "point_radius" ] > 0.0 )
	{
		var points = this.getGeometryPoints( feature );

		/*
		var shadow = new ol.style.Style
		(
			{
				image: new ol.style.Circle( { radius: 5.0, fill: new ol.style.Fill( { color: "rgba( 0, 0, 0, 0.5 )" } ), displacement: [ 0, -1 ] } ),
				geometry: points
			}
		);
		*/

		var outline = new ol.style.Style
		(
			{
				image: new ol.style.Circle( { radius: cfg[ "point_radius" ] * 1.25, fill: new ol.style.Fill( { color: cfg[ "point_stroke" ] } ) } ),
				geometry: points
			}
		);

		var vertex = new ol.style.Style
		(
			{
				image: new ol.style.Circle( { radius: cfg[ "point_radius" ], fill: new ol.style.Fill( { color: cfg[ "point_fill" ] } ) } ),
				geometry: points
			}
		);

		return [ style, outline, vertex ];
	}
	
	return style;
};

netgis.Map.prototype.styleEdit = function( feature )
{
	var cfg;
	var cfgselect;
	
	if ( this.config && this.config[ "styles" ] )
	{
		if ( this.config[ "styles" ][ "draw" ] ) cfg = this.config[ "styles" ][ "draw" ];
		if ( this.config[ "styles" ][ "select" ] ) cfgselect = this.config[ "styles" ][ "select" ];
	}
	
	if ( ! cfg ) cfg = netgis.Map.Styles[ "draw" ];
	if ( ! cfgselect ) cfgselect = netgis.Map.Styles[ "select" ];
	
	var geom = feature.getGeometry();
	
	var selected = ( this.hoverFeature === feature );
	
	if ( this.selectedFeatures.indexOf( feature ) > -1 ) selected = true;
	
	var radius = selected ? cfgselect[ "radius" ] : cfg[ "radius" ];
	var fill = selected ? cfgselect[ "fill" ] : cfg[ "fill" ];
	var stroke = selected ? cfgselect[ "stroke" ] : cfg[ "stroke" ];
	
	var style = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: radius, fill: new ol.style.Fill( { color: stroke } ) } ),
			fill: new ol.style.Fill( { color: fill } ),
			stroke: new ol.style.Stroke( { color: stroke, width: cfg[ "width" ] } )
		}
	);
	
	if ( selected ) style.setZIndex( 1 );
	
	// Text Labels
	if ( geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon )
	{
		var area = geom.getArea();
		
		if ( ! area || area <= 0 ) return style;
		
		// Labels In Viewport
		if ( cfg[ "viewport_labels" ] === true )
		{
			// NOTE: https://gis.stackexchange.com/questions/320743/openlayers-keep-text-style-label-in-visible-polygon-area
			
			var viewExtent = this.view.calculateExtent( this.map.getSize() );
			var viewGeom = ol.geom.Polygon.fromExtent( viewExtent );
			
			var parser = new jsts.io.OL3Parser();
			
			var a = parser.read( geom );
			var b = parser.read( viewGeom );
			
			var clip = a.intersection( b );
			var clipGeom = parser.write( clip );
			
			style.setGeometry( clipGeom );
		}
		
		// Label String
		var str = "";
		
		// Simple Feature Titles
		str = netgis.util.formatArea( area, true );
		
		var props = feature.getProperties();
		var title = props[ "title" ];
		
		if ( title ) str = title + "\n" + str;
		
		style.setText
		(
			new ol.style.Text
			(
				{
					text: str,
					font: "4mm Arial, sans-serif",
					fill: new ol.style.Fill( { color: stroke } ),
					backgroundFill: new ol.style.Fill( { color: "rgba( 255, 255, 255, 0.5 )" } ),
					padding: [ 2, 4, 2, 4 ]
				}
			)
		);
		
	}
	
	return style;
};

netgis.Map.prototype.styleNonEdit = function( feature )
{
	// TODO: refactor with edit style
	
	var cfg;
	var cfgselect;
	
	if ( this.config && this.config[ "styles" ] )
	{
		if ( this.config[ "styles" ][ "non_edit" ] ) cfg = this.config[ "styles" ][ "non_edit" ];
		if ( this.config[ "styles" ][ "select" ] ) cfgselect = this.config[ "styles" ][ "select" ];
	}
	
	if ( ! cfg ) cfg = netgis.Map.Styles[ "non_edit" ];
	if ( ! cfgselect ) cfgselect = netgis.Map.Styles[ "select" ];
	
	var geom = feature.getGeometry();
	
	var selected = ( this.hoverFeature === feature );
	
	if ( this.selectedFeatures.indexOf( feature ) > -1 ) selected = true;
	
	var radius = selected ? cfgselect[ "radius" ] : cfg[ "radius" ];
	var fill = selected ? cfgselect[ "fill" ] : cfg[ "fill" ];
	var stroke = selected ? cfgselect[ "stroke" ] : cfg[ "stroke" ];
	
	var style = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: radius, fill: new ol.style.Fill( { color: stroke } ) } ),
			fill: new ol.style.Fill( { color: fill } ),
			stroke: new ol.style.Stroke( { color: stroke, width: cfg[ "width" ] } )
		}
	);
	
	if ( selected ) style.setZIndex( 1 );
	
	// Text Labels
	if ( geom instanceof ol.geom.Polygon )
	{
		var area = geom.getArea();
		
		if ( ! area || area <= 0 ) return style;
		
		// Labels In Viewport
		if ( cfg[ "viewport_labels" ] === true )
		{
			// NOTE: https://gis.stackexchange.com/questions/320743/openlayers-keep-text-style-label-in-visible-polygon-area
			
			var viewExtent = this.map.getView().calculateExtent( this.map.getSize() );
			var viewGeom = ol.geom.Polygon.fromExtent( viewExtent );
			
			var parser = new jsts.io.OL3Parser();
			
			var a = parser.read( geom );
			var b = parser.read( viewGeom );
			
			var clip = a.intersection( b );
			var clipGeom = parser.write( clip );
			
			style.setGeometry( clipGeom );
		}
		
		// Label String
		var str = "";
		
		// Simple Feature Titles
		str = netgis.util.formatArea( area, true );
		
		var props = feature.getProperties();
		var title = props[ "title" ];
		
		if ( title ) str = title + "\n" + str;
		
		/*
		// TODO: fully implement label templates
		
		var template = configDraw[ "labels" ];
		
		if ( template )
		{
			str = template;
			str = netgis.util.replace( str, "{area}", netgis.util.formatArea( area, true ) );
			
			var props = feature.getProperties();
			
			for ( var k in props )
			{
				var v = props[ k ];
				
				// TODO: not executed if feature doesn't have key
				if ( ( ! v ) || ( v === null ) ) v = "";
				
				str = netgis.util.replace( str, "{" + k + "}", v );
			}
		}
		else
		{
			str = netgis.util.formatArea( area, true );
		}
		*/
		
		style.setText
		(
			new ol.style.Text
			(
				{
					text: str,
					font: "4mm Arial, sans-serif",
					fill: new ol.style.Fill( { color: stroke } ),
					backgroundFill: new ol.style.Fill( { color: "rgba( 255, 255, 255, 0.5 )" } ),
					padding: [ 2, 4, 2, 4 ]
				}
			)
		);
		
	}
	
	return style;
};

netgis.Map.prototype.styleSketch = function( feature )
{
	var cfg;
	var cfgerror;
	
	if ( this.config && this.config[ "styles" ] )
	{
		if ( this.config[ "styles" ][ "sketch" ] ) cfg = this.config[ "styles" ][ "sketch" ];
		if ( this.config[ "styles" ][ "error" ] ) cfgerror = this.config[ "styles" ][ "error" ];
	}
	
	if ( ! cfg ) cfg = netgis.Map.Styles[ "sketch" ];
	if ( ! cfgerror ) cfgerror = netgis.Map.Styles[ "error" ];
	
	if ( this.drawError && cfgerror ) cfg = cfgerror;
	
	var geom = feature.getGeometry();
	
	var style = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: cfg[ "radius" ], fill: new ol.style.Fill( { color: cfg[ "fill" ] } ) } ),
			fill: new ol.style.Fill( { color: cfg[ "fill" ] } ),
			stroke: new ol.style.Stroke( { color: cfg[ "stroke" ], width: cfg[ "width" ] } )
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
					font: "Arial",
					fill: new ol.style.Fill( { color: cfg[ "stroke" ] } ),
					backgroundFill: new ol.style.Fill( { color: "rgba( 255, 255, 255, 0.5 )" } ),
					padding: [ 2, 4, 2, 4 ]
				}
			)
		);
	}
	
	var vertex = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: cfg[ "radius" ], fill: new ol.style.Fill( { color: cfg[ "stroke" ] } ) } ),
			geometry: this.getGeometryPoints( feature )
		}
	);
	
	return [ style, vertex ];
};

netgis.Map.prototype.styleModify = function( feature )
{
	var cfg;
	
	if ( this.config && this.config[ "styles" ] )
	{
		if ( this.config[ "styles" ][ "modify" ] ) cfg = this.config[ "styles" ][ "modify" ];
	}
	
	if ( ! cfg ) cfg = netgis.Map.Styles[ "modify" ];
	
	var style = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: cfg[ "radius" ], fill: new ol.style.Fill( { color: cfg[ "stroke" ] } ) } ),
			fill: new ol.style.Fill( { color: cfg[ "fill" ] } ),
			stroke: new ol.style.Stroke( { color: cfg[ "stroke" ], width: cfg[ "width" ] } )
		}
	);
	
	var vertex = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: cfg[ "radius" ], fill: new ol.style.Fill( { color: cfg[ "stroke" ] } ) } ),
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
					font: "Arial",
					fill: new ol.style.Fill( { color: cfg[ "stroke" ] } ),
					backgroundFill: new ol.style.Fill( { color: "rgba( 255, 255, 255, 0.5 )" } ),
					padding: [ 2, 4, 2, 4 ]
				}
			)
		);
	}
	
	return [ style, vertex ];
};

netgis.Map.prototype.styleHover = function( feature )
{	
	var cfg;
	
	if ( this.config && this.config[ "styles" ] )
	{
		if ( this.config[ "styles" ][ "select" ] ) cfg = this.config[ "styles" ][ "select" ];
	}
	
	if ( ! cfg ) cfg = netgis.Map.Styles[ "select" ];
	
	var style = new ol.style.Style
	(
		{
			image: new ol.style.Circle( { radius: cfg[ "radius" ], fill: new ol.style.Fill( { color: cfg[ "stroke" ] } ) } ),
			fill: new ol.style.Fill( { color: cfg[ "fill" ] } ),
			stroke: new ol.style.Stroke( { color: cfg[ "stroke" ], width: cfg[ "width" ] } ),
			zIndex: 1
		}
	);
	
	return style;
};

netgis.Map.prototype.getGeometryPoints = function( feature )
{
	var geometry = feature.getGeometry();

	if ( geometry instanceof ol.geom.LineString )
	{
		return new ol.geom.MultiPoint( geometry.getCoordinates() );
	}
	else if ( geometry instanceof ol.geom.Polygon )
	{
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

netgis.Map.prototype.redrawVectorLayers = function()
{
	// Force Layer Redraw
	this.map.getLayers().forEach
	(		
		function( layer, i, arr )
		{
			if ( layer instanceof ol.layer.Vector || layer instanceof ol.layer.VectorTile )
			{
				layer.setStyle( layer.getStyle() );
			}
		}
	);
};

netgis.Map.prototype.setSnapping = function( on )
{
	var config = this.config[ "tools" ][ "snapping" ];
	
	if ( on )
	{
		this.snap = new ol.interaction.Snap( { features: this.snapFeatures, pixelTolerance: config[ "tolerance" ] ? config[ "tolerance" ] : 10 } );
		this.map.addInteraction( this.snap );

		this.snapFeatures.changed();
	}
	else
	{
		if ( this.snap )
		{
			this.map.removeInteraction( this.snap );
			this.snap = null;
		}
	}
	
	this.drawSnapOn = on;
};

netgis.Map.prototype.setDrawTrace = function( on )
{
	
};

netgis.Map.prototype.addSnapLayer = function( vectorLayer )
{	
	var layerFeatures = vectorLayer.getSource().getFeatures();
			
	for ( var j = 0; j < layerFeatures.length; j++ )
	{
		this.snapFeatures.push( layerFeatures[ j ] );
	}
};

netgis.Map.prototype.removeSnapLayer = function( vectorLayer )
{
	var layerFeatures = vectorLayer.getSource().getFeatures();
			
	for ( var j = 0; j < layerFeatures.length; j++ )
	{
		this.snapFeatures.remove( layerFeatures[ j ] );
	}
};

netgis.Map.prototype.setDrawBuffer = function( on, radius, segments )
{
	if ( on )
	{
		var feature = this.createBufferFeature( new ol.geom.Point( this.view.getCenter() ), radius, segments );
		this.previewLayer.getSource().addFeature( feature );
		
		this.drawBufferRadius = radius;
		this.drawBufferSegments = segments;
	}
	else
	{
		this.previewLayer.getSource().clear();
	}
	
	this.drawBufferOn = on;
};

netgis.Map.prototype.createLayerTMS = function( url, projection, extent, scales, resolutions )
{
	var layer;
	
	// Scales and Extent From Map Config
	if ( scales === "map" )
	{
		if ( this.config[ "map" ] && this.config[ "map" ][ "scales" ] )
		{
			scales = this.config[ "map" ][ "scales" ];
		}
		else
		{
			console.error( "TMS layer references map scales, but none given in config,", url );
			scales = undefined;
		}
	}
	
	if ( extent === "map" )
	{
		if ( this.config[ "map" ] && this.config[ "map" ][ "extent" ] )
		{
			extent = this.config[ "map" ][ "extent" ];
		}
		else
		{
			console.error( "TMS layer references map 'extent', but none given in config 'map',", url );
			extent = undefined;
		}
	}
	
	// TODO: get extent from view projection limit if none given, but OL sets it to null ?
	//if ( ! extent ) extent = this.view.calculateExtent();
	
	if ( projection && extent && ( scales || resolutions ) )
	{
		// Custom Tile Grid
		if ( scales )
		{
			resolutions = [];
			
			for ( var s = 0; s < scales.length; s++ )
			{
				resolutions.unshift( this.getResolutionFromScale( scales[ s ] ) );
			}
		}
		
		var source = new ol.source.TileImage
		(
			{
				crossOrigin:	null,
				projection:		this.view.getProjection(),
				tileGrid:		new ol.tilegrid.TileGrid
				(
					{
						extent: extent,
						origin: extent ? [ extent[ 0 ], extent[ 1 ] ] : [ 0, 0 ],
						resolutions: resolutions
					}
				),
				tileUrlFunction: function( zxy )
				{
					if ( zxy === null ) return undefined;
					
					var tileURL = url;
					tileURL = netgis.util.replace( tileURL, "{z}", zxy[ 0 ] );
					tileURL = netgis.util.replace( tileURL, "{x}", zxy[ 1 ] );
					tileURL = netgis.util.replace( tileURL, "{y}", zxy[ 2 ] );
					tileURL = netgis.util.replace( tileURL, "{-y}", -zxy[ 2 ] - 1 );

					return tileURL;
				}
			}
		);

		layer = new ol.layer.Tile
		(
			{
				source:	source
			}
		);
	}
	else
	{
		// Default Tile Grid
		layer = new ol.layer.Tile
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
	}
	
	return layer;
};

netgis.Map.prototype.createLayerWMS = function( url, layerName, format, tiled, user, password )
{
	// TODO: WMS tiff format not wokring in OL
	if ( format === "image/tiff" )
	{
		console.error( "WMS layer format 'image/tiff' detected but not supported in OL, reverting to 'image/png' for '" + url + "'" );
		format = "image/png";
	}
	
	var params =
	{
		url: url,
		params:
		{
			"LAYERS":		layerName,
			"FORMAT":		format ? format : "image/png",
			"TRANSPARENT":	"true"
			//"VERSION":		"1.1.1"
		},
		
		// TODO: how to pass more custom WMS params from config ? json object ?
		
		/*
		serverType: "mapserver",
		crossOrigin: "anonymous", // TODO: causes CORS errors after requests, why ?
		*/ 
		
		hidpi: false
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
	
	var source;
	var layer;

	if ( tiled )
	{
		source = new ol.source.TileWMS( params );
		layer = new ol.layer.Tile( { source: source } );
	}
	else
	{
		source = new ol.source.ImageWMS( params );
		layer = new ol.layer.Image( { source: source } );
	}
	
	return layer;
};

netgis.Map.prototype.createLayerWMST = function( url, layerName, format, tiled, user, password )
{
	// TODO: refactor with regular WMS creation
	
	// TODO: WMS tiff format not wokring in OL
	if ( format === "image/tiff" )
	{
		console.error( "WMST layer format 'image/tiff' detected but not supported in OL, reverting to 'image/png' for '" + url + "'" );
		format = "image/png";
	}
	
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
		
		hidpi: false
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
	
	var source;
	var layer;

	if ( tiled )
	{
		source = new ol.source.TileWMS( params );
		layer = new ol.layer.Tile( { source: source } );
	}
	else
	{
		source = new ol.source.ImageWMS( params );
		layer = new ol.layer.Image( { source: source } );
	}
	
	return layer;
};

netgis.Map.prototype.createLayerWMTS = function( url )
{
	var resolutions = [];
	var scales = this.client.config[ "map" ][ "scales" ];
	var extent = this.client.config[ "map" ][ "extent" ];

	for ( var s = 0; s < scales.length; s++ )
		resolutions.unshift( this.getResolutionFromScale( scales[ s ] ) );

	var source = new ol.source.TileImage
	(
		{
			crossOrigin:	null,
			projection:		this.view.getProjection(),
			tileGrid:		new ol.tilegrid.TileGrid
			(
				{
					extent: extent,
					origin: [ extent[ 0 ], extent[ 1 ] ],
					resolutions: resolutions
				}
			),
			tileUrlFunction: function( zxy )
			{
				if ( zxy === null ) return undefined;
				
				var tileURL = url;
				tileURL = netgis.util.replace( tileURL, "{z}", zxy[ 0 ] );
				tileURL = netgis.util.replace( tileURL, "{x}", zxy[ 1 ] );
				tileURL = netgis.util.replace( tileURL, "{y}", zxy[ 2 ] );
				tileURL = netgis.util.replace( tileURL, "{-y}", -zxy[ 2 ] );
				
				return tileURL;
			}
		}
	);

	var layer = new ol.layer.Tile
	(
		{
			source:	source
		}
	);
	
	return layer;
};

netgis.Map.prototype.createLayerWMTS_01 = function( url, layerName )
{
	var projection = this.view.getProjection();
	var projectionExtent = projection.getExtent();
	var size = ol.extent.getWidth( projectionExtent ) / 256;
	
	var resolutions = new Array( 14 );
	var matrixIDs = new Array( 14 );
	
	for ( var z = 0; z < 14; ++z )
	{
		resolutions[ z ] = size / Math.pow( 2, z );
		matrixIDs[ z ] = z;
	}

	source = new ol.source.WMTS
	(
		{
			url: url,
			params:
			{
				"LAYER":		layerName,
				"FORMAT":		"image/png",
				"TRANSPARENT":	"true",
				"VERSION":		"1.1.1"
			},
			layer: layerName,
			//format: 'image/png',
			format: "image/jpeg",
			matrixSet: "UTM32",
			tileGrid: new ol.tilegrid.WMTS
			(
				{
					origin: ol.extent.getTopLeft( projectionExtent ),
					resolutions: resolutions,
					matrixIds: matrixIDs
				}
			)
		}
	);
};

netgis.Map.prototype.createLayerGeoJSON = function( dataOrURL )
{
	if ( netgis.util.isObject( dataOrURL ) )
	{
		// Direct Object Import
		var format = new ol.format.GeoJSON();
		var projection = format.readProjection( dataOrURL );
		var features = format.readFeatures( dataOrURL, { featureProjection: this.view.getProjection() } );

		// NOTE: proj4.defs[ "EPSG:4326" ]
		// NOTE: netgis.util.foreach( proj4.defs, function( k,v ) { console.info( "DEF:", k, v ); } )

		var projcode = projection.getCode();

		switch ( projcode )
		{
			case "EPSG:3857":
			case "EPSG:4326":
			case this.view.getProjection().getCode():
			{
				// Projection OK
				break;
			}

			default:
			{
				// Projection Not Supported
				console.warn( "unsupported import projection '" + projcode + "'" );
				break;
			}
		}
		
		var layer = new ol.layer.Vector
		(
			{
				source: new ol.source.Vector( { features: features } )
			}
		);

		return layer;
	}
	else if ( netgis.util.isString( dataOrURL ) )
	{
		// Request From URL
		var layer = new ol.layer.Vector
		(
			{
				source: new ol.source.Vector( { features: [] } )
			}
		);

		var self = this;
		
		netgis.util.request
		(
			dataOrURL,
			function( response )
			{
				var json = JSON.parse( response );
				var responseLayer = self.createLayerGeoJSON( json );
				layer.getSource().addFeatures( responseLayer.getSource().getFeatures() );
			}
		);

		return layer;
	}
};

netgis.Map.prototype.createLayerGML = function( data )
{	
	// NOTE: https://stackoverflow.com/questions/35935184/opening-qgis-exported-gml-in-openlayers-3
	// NOTE: https://github.com/openlayers/openlayers/issues/5023
	
	console.warn( "GML support is experimental!" );

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
			
			if ( proj && proj !== "EPSG:4326" && proj !== this.projection )
				console.warn( "unsupported import projection:", proj );
			
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
	
	var layer = new ol.layer.Vector
	(
		{
			source: new ol.source.Vector( { features: features } )
		}
	);
	
	return layer;
};

netgis.Map.prototype.gmlParsePolygon = function( node, proj )
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

netgis.Map.prototype.gmlParseMultiPolygon = function( node, proj )
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

netgis.Map.prototype.gmlParseCoordinates = function( s, proj )
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
		if ( proj ) coords[ c ] = ol.proj.transform( coords[ c ], proj, this.view.getProjection() );
	}
	
	return coords;
};

netgis.Map.prototype.createLayerGeoPackage = function( data )
{
	var layer = new ol.layer.Vector
	(
		{
			source: new ol.source.Vector( { features: [] } )
		}
	);
	
	var self = this;
	var arr = new Uint8Array( data );
	
	window.GeoPackage.setSqljsWasmLocateFile( function( file ) { return self.config[ "import" ][ "geopackage_lib" ] + file; } );
	
	window.GeoPackage.GeoPackageAPI.open( arr ).then
	(
		function( geoPackage )
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
					var geom = format.readGeometry( row.geometry, { featureProjection: self.view.getProjection() } );
					var feature = new ol.Feature( { geometry: geom } );
					features.push( feature );
				}
			}
			
			layer.getSource().addFeatures( features );
		}
	);
	
	return layer;
};

netgis.Map.prototype.createLayerSpatialite = function( data )
{
	var layer = new ol.layer.Vector
	(
		{
			source: new ol.source.Vector( { features: [] } )
		}
	);
	
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
					AND name NOT LIKE 'KNN%' \n\
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
				
				if ( geomcol === null ) continue;

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
					var geom = wkb.readGeometry( output, { featureProjection: self.view.getProjection() } );

					features.push( new ol.Feature( { geometry: geom } ) );
				}
			}
			
			layer.getSource().addFeatures( features );
		}
	);
	
	return layer;
};

netgis.Map.prototype.createLayerShapefile = function( data )
{
	var layer = new ol.layer.Vector
	(
		{
			source: new ol.source.Vector( { features: [] } )
		}
	);
	
	var self = this;
	
	shp( data ).then
	(
		function( geojson )
		{
			var format = new ol.format.GeoJSON();
			var projection = format.readProjection( geojson );
			var features = format.readFeatures( geojson, { featureProjection: self.view.getProjection() } );
			
			layer.getSource().addFeatures( features );
		}
	);
	
	return layer;
};

netgis.Map.prototype.createLayerWKT = function( data )
{
	var format = new ol.format.WKT();
	var features = [];
	
	// TODO: check if data is array or single WKT string
	
	for ( var i = 0; i < data.length; i++ )
	{
		var item = data[ i ];
		var geom = format.readGeometry( item[ "geometry" ] );
		
		var props = item[ "properties" ];
		props[ "geometry" ] = geom;
		props[ "wkt" ] = item[ "geometry" ];
		
		var feature = new ol.Feature( props );
		feature.setId( item[ "id" ] );
		features.push( feature );
	}
	
	var layer = new ol.layer.Vector( { source: new ol.source.Vector( { features: features } ) } );
	
	return layer;
};

netgis.Map.prototype.createLayerWFS = function( url, typeName, projection, format, user, password )
{
	if ( url[ url.length - 1 ] !== "?" ) url = url + "?";
	
	url = url
			+ "service=WFS"
			+ "&version=1.1.0"
			+ "&request=GetFeature";

	// TODO: always get projection from map view ?
	
	if ( ! projection )
		projection = this.view.getProjection().getCode();
	
	if ( ! format )
		format = "application/json";
	else
		format = netgis.util.replace( format, " ", "+" ); // TODO: encode URI component ?

	var source = new ol.source.Vector
	(
		{
			format: new ol.format.GeoJSON(),
			strategy: ol.loadingstrategy.bbox,
			
			loader: function( extent, resolution, proj, success, failure )
			{
				var requestURL = url
					+ "&typename=" + typeName
					+ "&srsname=" + projection
					+ "&bbox=" + extent.join( "," ) + "," + projection
					+ "&outputFormat=" + format;
				
				var request = new XMLHttpRequest();
				request.open( "GET", requestURL );
				
				if ( user && password )
				{
					request.setRequestHeader( "Authorization", "Basic " + window.btoa( user + ":" + password ) );
				}
				
				request.onerror = function()
				{
					console.error( "WFS request error" );
					failure();
				};
				
				request.onload = function()
				{
					if ( request.status === 200 )
					{
						source.clear();
						
						var features = source.getFormat().readFeatures( request.responseText );
						source.addFeatures( features );
						success( features );
					}
					else
					{
						console.error( "WFS request status", request.status );
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

	// TODO: properly handle snap vector sources
	
	var self = this;
	source.on( "featuresloadstart", function( e ) { self.removeSnapLayer( layer ); } );
	source.on( "featuresloadend", function( e ) { window.setTimeout( function() { self.addSnapLayer( layer ); }, 10 ); } );
	//source.on( "featuresloaderror", function( e ) { console.info( "Layer Error:", e ); } );
	
	return layer;
};

netgis.Map.prototype.createLayerVectorTiles = function( url, extent, minZoom, maxZoom )
{
	// NOTE: https://github.com/openlayers/openlayers/issues/13592 (vector tiles layer extent)
	// NOTE: https://stackoverflow.com/questions/44907234/how-to-set-an-extent-to-a-vectortile-layer-in-openlayers-4-2-0
	
	var layer = new ol.layer.VectorTile
	(
		{
			extent: extent,
			source: new ol.source.VectorTile
			(
				{
					format: new ol.format.MVT(),
					overlaps: true,
					url: url,
					//extent: extent, // TODO: crashes !?
					minZoom: minZoom,
					maxZoom: maxZoom
				}
			)
		}
	);
	
	return layer;
};

netgis.Map.prototype.createLayerKML = function( url )
{
	var layer = new ol.layer.Vector( { source: new ol.source.Vector( { features: [] } ) } );
	var self = this;
	
	// TODO: optional parse KML data string instead of URL
	
	netgis.util.request
	(
		url,
		function( data )
		{			
			var format = new ol.format.KML();
			var features = format.readFeatures( data, { featureProjection: self.view.getProjection() } );
			
			for ( var i = 0; i < features.length; i++ )
			{
				var feature = features[ i ];
				var props = feature.getProperties();
				
				var styleprops = { fill: "rgba( 127, 127, 127, 0.5 )", stroke: "rgba( 127, 127, 127, 1.0 )", radius: 5.0, width: 3.0 };
				
				for ( var key in props )
				{
					var val = props[ key ];
					
					switch ( key )
					{
						case "fill": { styleprops[ "fill" ] = val; break; }
						case "fill-opacity": { styleprops[ "fill-opacity" ] = val; break; }
						case "stroke": { styleprops[ "stroke" ] = val; break; }
						case "stroke-opacity": { styleprops[ "stroke-opacity" ] = val; break; }
						case "stroke-width": { styleprops[ "width" ] = val; break; }
					}
				}
				
				if ( styleprops[ "fill-opacity" ] )
				{
					var color = netgis.util.hexToRGB( styleprops[ "fill" ] );
					color = "rgba(" + color.join( "," ) + "," + styleprops[ "fill-opacity" ] + ")";
					styleprops[ "fill" ] = color;
				}
				
				if ( styleprops[ "stroke-opacity" ] )
				{
					var color = netgis.util.hexToRGB( styleprops[ "stroke" ] );
					color = "rgba(" + color.join( "," ) + "," + styleprops[ "stroke-opacity" ] + ")";
					styleprops[ "stroke" ] = color;
				}
				
				var style = new ol.style.Style
				(
					{
						image: new ol.style.Circle( { radius: styleprops[ "radius" ], fill: new ol.style.Fill( { color: styleprops[ "stroke" ] } ) } ),
						fill: new ol.style.Fill( { color: styleprops[ "fill" ] } ),
						stroke: new ol.style.Stroke( { color: styleprops[ "stroke" ], width: styleprops[ "width" ] } )
					}
				);
		
				feature.setStyle( style );
			}
			
			layer.getSource().addFeatures( features );
		}
	);
	
	return layer;
};

netgis.Map.prototype.createBufferFeature = function( srcgeom, radius, segments )
{
	var geom = this.createBufferGeometry( srcgeom, radius, segments );
	var feature = new ol.Feature( { geometry: geom } );
	
	return feature;
};

netgis.Map.prototype.createBufferGeometry = function( srcgeom, radius, segments )
{
	var parser = new jsts.io.OL3Parser();
		
	var a = parser.read( srcgeom );
	var b = a.buffer( radius, segments );
	
	if ( this.boundsLayer )
	{
		// Clip Buffer Preview Against Bounds
		var bounds = this.boundsLayer.getSource().getFeatures();
		
		for ( var i = 0; i < bounds.length; i++ )
		{
			var bound = parser.read( bounds[ i ].getGeometry() );
			
			if ( ! b.intersects( bound ) ) continue;
			
			b = b.intersection( bound );
		}
	}
	
	var geom = parser.write( b );
	
	return geom;
};

netgis.Map.prototype.splitMultiPolygons = function( layer )
{
	// TODO: split only selected feature ( parameter )
	
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

netgis.Map.prototype.clearSketchFeatures = function()
{
	var source = this.editLayer.getSource();
	
	// Clear Sketch Features
	for ( var f = 0; f < this.sketchFeatures.length; f++ )
	{
		source.removeFeature( this.sketchFeatures[ f ] );
	}
	
	this.sketchFeatures = [];
};

netgis.Map.prototype.updateDrawBufferPreview = function()
{
	if ( this.config[ "tools" ][ "editable" ] === false ) return;
	
	var draw = this.interactions[ this.mode ][ 0 ];
	var overlays = draw.getOverlay().getSource().getFeatures();
	if ( overlays.length < 1 ) return;
	
	var preview = this.previewLayer.getSource().getFeatures()[ 0 ];
	if ( ! preview ) return;
	
	var geom = overlays[ 0 ].getGeometry();
	var buffer = this.createBufferGeometry( geom, this.drawBufferRadius, this.drawBufferSegments );
	preview.setGeometry( buffer );
};

netgis.Map.prototype.isPointInsideLayer = function( layer, coords )
{
	var features = layer.getSource().getFeatures();
	
	for ( var i = 0; i < features.length; i++ )
	{
		var geom = features[ i ].getGeometry();
		
		if ( geom.intersectsCoordinate( coords ) ) return true;
	}
	
	return false;
};

netgis.Map.prototype.isGeomInsideLayer = function( layer, geom )
{
	var coords = geom.getCoordinates();
	
	if ( geom instanceof ol.geom.LineString )
	{
		if ( coords.length < 2 ) return false;
	}
	else if ( geom instanceof ol.geom.Polygon )
	{
		coords = coords[ 0 ];
		if ( coords.length < 4 ) return false;
		if ( geom.getArea() <= 0 ) return false;
	}
	
	var parser = new jsts.io.OL3Parser();
	var a = parser.read( geom );
	
	var features = layer.getSource().getFeatures();
	
	for ( var i = 0; i < features.length; i++ )
	{
		var other = features[ i ].getGeometry();
		var b = parser.read( other );
		
		if ( b.contains( a ) ) return true;
	}
	
	return false;
};

netgis.Map.prototype.getScaleFromResolution = function( res )
{
	var scale = 39.3701 * 72 * res;
	scale = Math.round( scale );

	return scale;
};

netgis.Map.prototype.getResolutionFromScale = function( scale )
{
	var mpu = ol.proj.Units.METERS_PER_UNIT[ this.view.getProjection().getUnits() ];
	
	var ipu = mpu * 39.3701; // inches per unit = 39.3701
	var dpi = 72;

	var res = 1 / ( this.normalizeScale( scale ) * ipu * dpi );

	return res;
};

netgis.Map.prototype.normalizeScale = function( scale )
{
	return 1 < scale ? 1 / scale : scale;
};

netgis.Map.prototype.updateEditOutput = function()
{
	var features = this.editLayer.getSource().getFeatures();
	
	var proj = this.view.getProjection().getCode();
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
	
	//if ( ! this.editEventsSilent )
	{
		netgis.util.invoke( this.container, netgis.Events.MAP_EDIT_LAYER_CHANGE, { geojson: output } );
	}
};

netgis.Map.prototype.updateSnapFeatures = function()
{
	this.snapFeatures.clear();
	
	var self = this;
	
	this.map.getLayers().forEach
	(
		function( layer, i, arr )
		{
			var id = layer.get( "id" );
			
			if ( id === netgis.Client.Layers.PARCEL_DISTRICTS ) return;
			if ( id === netgis.Client.Layers.PARCEL_FIELDS ) return;
			if ( id === netgis.Client.Layers.PARCEL_FEATURES ) return;
			
			if ( layer instanceof ol.layer.Vector )
				self.addSnapLayer( layer );
		}
	);
};

netgis.Map.prototype.zoom = function( delta )
{
	this.view.animate( { zoom: this.view.getZoom() + delta, duration: 200 } );
};

netgis.Map.prototype.zoomLevel = function( z )
{
	this.view.animate( { zoom: z, center: this.view.getCenter(), duration: 300 } );
};

netgis.Map.prototype.zoomCoords = function( x, y, zoom )
{
	this.view.animate( { zoom: zoom, center: [ x, y ], duration: 500 } );
};

netgis.Map.prototype.zoomLonLat = function( lon, lat, zoom )
{
	this.view.animate( { zoom: zoom, center: ol.proj.fromLonLat( [ lon, lat ], this.view.getProjection() ), duration: 500 } );
};

netgis.Map.prototype.zoomExtentLonLat = function( minlon, minlat, maxlon, maxlat )
{
	var minxy = ol.proj.fromLonLat( [ minlon, minlat ], this.view.getProjection() );
	var maxxy = ol.proj.fromLonLat( [ maxlon, maxlat ], this.view.getProjection() );
	
	this.view.fit( [ minxy[ 0 ], minxy[ 1 ], maxxy[ 0 ], maxxy[ 1 ] ] );
};

netgis.Map.prototype.zoomExtent = function( minx, miny, maxx, maxy )
{
	this.view.fit( [ minx, miny, maxx, maxy ] );
};

netgis.Map.prototype.zoomBBox = function( bbox, anim )
{
	this.view.fit( bbox, { duration: anim } );
};

netgis.Map.prototype.zoomScale = function( scale, anim )
{
	if ( ! anim )
		this.view.setResolution( this.getResolutionFromScale( scale ) );
	else
		this.view.animate( { resolution: this.getResolutionFromScale( scale ), duration: 500 } );
};

netgis.Map.prototype.zoomFeature = function( layerID, featureID )
{
	var layer = this.layers[ layerID ];
	var feature = layer.getSource().getFeatureById( featureID );
	
	this.view.fit( feature.getGeometry().getExtent(), { duration: 500 } );
};

netgis.Map.prototype.zoomFeatures = function( features )
{
	if ( ! features || features.length < 1 ) return;
	
	var extent = features[ 0 ].getGeometry().getExtent();
	
	for ( var i = 1; i < features.length; i++ )
	{
		extent = ol.extent.extend( extent, features[ i ].getGeometry().getExtent() );
	}
	
	this.view.fit( extent, { duration: 0, padding: this.view.padding } );
};

netgis.Map.prototype.addViewHistory = function( center, zoom )
{
	// Check If Last View Is Similar
	if ( this.viewHistory.length > 0 )
	{
		var last = this.viewHistory[ this.viewHistory.length - 1 ];
		var similar = true;
		
		if ( Math.abs( center[ 0 ] - last.center[ 0 ] ) > 10.0 ) similar = false;
		if ( Math.abs( center[ 1 ] - last.center[ 1 ] ) > 10.0 ) similar = false;
		if ( Math.abs( zoom - last.zoom ) > 0.1 ) similar = false;
		
		if ( similar === true ) return;
	}
	
	this.viewHistory.push( { center: center, zoom: zoom } );
	if ( this.viewHistory.length > this.viewHistoryMax ) this.viewHistory.shift();
	
	this.viewIndex = this.viewHistory.length - 1;
};

netgis.Map.prototype.gotoViewHistory = function( i )
{
	if ( this.viewHistory.length < 1 ) return;
	
	var max = this.viewHistory.length - 1;
	if ( i < 0 ) i = max;
	if ( i > max ) i = 0;
	
	if ( i === this.viewIndex ) return;
	
	var view = this.viewHistory[ i ];
	
	this.viewIndex = i;
	this.viewFromHistory = true;
	
	this.view.setCenter( view.center );
	this.view.setZoom( view.zoom );
};

netgis.Map.prototype.setPadding = function( top, right, bottom, left )
{
	var buffer = this.paddingBuffer;
	this.view.padding = [ top + buffer, right + buffer, bottom + buffer, left + buffer ];
};

/**
* @ignore
* 
* @param {format} string Format identifier (jpeg, png, gif)
* @param {resx} integer Map image x resolution (pixels)
* @param {resy} integer Map image y resolution (pixels)
* @param {mode} boolean PDF mode (true = landscape, false = portrait)
* @param {margin} integer PDF page margin (millimeters)
*/
netgis.Map.prototype.exportImage = function( format, resx, resy, mode, margin )
{
	var self = this;
	var root = this.container;
	var map = this.map;
	
	var config = this.config[ "export" ];
	
	// Request Logo Image
	var logo = new Image();
	
	logo.onload = function()
	{
		// TODO: refactor map render image and image export
		// NOTE: https://github.com/openlayers/openlayers/issues/9100
		// NOTE: scaling/quality bugs when map pixel ratio is not 1.0

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
						var data = pdf.output( "bloburl", { filename: config[ "default_filename" ] + ".pdf" } );
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
							window.navigator.msSaveBlob( mapCanvas.msToBlob(), config[ "default_filename" ] + ".jpg" );
						}
						else
						{
							link.setAttribute( "download", config[ "default_filename" ] + ".jpg" );
							link.setAttribute( "href", mapCanvas.toDataURL( "image/jpeg", 1.0 ) );
							link.click();
						}

						break;
					}

					case "png":
					{					
						if ( window.navigator.msSaveBlob )
						{
							window.navigator.msSaveBlob( mapCanvas.msToBlob(), config[ "default_filename" ] + ".png" );
						}
						else
						{
							link.setAttribute( "download", config[ "default_filename" ] + ".png" );
							link.setAttribute( "href", mapCanvas.toDataURL( "image/png", 1.0 ) );
							link.click();
						}

						break;
					}

					case "gif":
					{
						link.setAttribute( "download", config[ "default_filename" ] + ".gif" );
						
						var gif = new GIF( { workerScript: config[ "gif_worker" ], quality: 1 } );
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
				
				// Done
				map.setTarget( root );
				root.removeChild( renderContainer );
				
				netgis.util.invoke( self.container, netgis.Events.EXPORT_END, null );
			}
		);

		// Begin Map Render
		map.renderSync();
	};
	
	// Begin Logo Load & Render
	logo.src = config[ "logo" ];
};

netgis.Map.prototype.exportFeatures = function( nonEdits )
{
	var features = this.editLayer.getSource().getFeatures();
	
	if ( nonEdits === true )
	{
		var nonEditFeatures = this.nonEditLayer.getSource().getFeatures();
		features = features.concat( nonEditFeatures );
	}
	
	var format = new ol.format.GeoJSON();
	var geojson = format.writeFeaturesObject( features, { featureProjection: this.view.getProjection(), dataProjection: "EPSG:4326" } );
	
	var name = this.config[ "export" ][ "default_filename" ] + ".geojson";
	geojson[ "name" ] = name;
	
	netgis.util.downloadJSON( geojson, name );
	
	netgis.util.invoke( this.container, netgis.Events.EXPORT_END, null );
};

netgis.Map.prototype.onClientContextResponse = function( e )
{
	var params = e.detail;
	this.initConfig( params.context.config );
};

netgis.Map.prototype.onEditLayerLoaded = function( e )
{
	var params = e.detail;
	var geojson = params.geojson;
	
	// Parse Features
	var format = new ol.format.GeoJSON();
	var projection = format.readProjection( geojson );
	
	var features = format.readFeatures( geojson, { featureProjection: this.view.getProjection().getCode() } );
	
	// Zoom Features
	var self = this;
	var all = features.slice();
	window.setTimeout( function() { self.zoomFeatures( all ); }, 10 );
	
	// Split Non Editables
	var editables = [];
	
	for ( var i = 0; i < features.length; i++ )
	{
		var feature = features[ i ];
		var props = feature.getProperties();
		
		var editable = props[ "editable" ];
		
		if ( editable === true ) editables.push( feature );
	}
	
	for ( var i = 0; i < editables.length; i++ )
	{
		features.splice( features.indexOf( editables[ i ] ), 1 );
	}
	
	// Add To Layers
	this.editEventsSilent = true;
	
	this.editLayer.getSource().addFeatures( editables );
	this.nonEditLayer.getSource().addFeatures( features );
	
	this.editEventsSilent = false;
};

netgis.Map.prototype.onClientSetMode = function( e )
{
	var params = e.detail;
	this.setMode( params.mode );
};

netgis.Map.prototype.onPanelResize = function( e )
{
	var params = e.detail;
	
	this.setPadding( 0, 0, 0, params.width );
	
	this.redrawVectorLayers();
};

netgis.Map.prototype.onPanelToggle = function( e )
{
	var params = e.detail;
	
	// Check If Any Panel Visible
	var visible = false;
	var width = 0;
	var panels = this.container.parentNode.getElementsByClassName( "netgis-panel" );
	
	// TODO: is this the correct way ?
	
	for ( var i = 0; i < panels.length; i++ )
	{
		if ( panels[ i ].classList.contains( "netgis-show" ) )
		{
			visible = true;
			width = panels[ i ].getBoundingClientRect().width;
			break;
		}
	}
	
	if ( visible )
	{
		this.setPadding( 0, 0, 0, width );
	}
	else
	{
		this.setPadding( 0, 0, 0, 0 );
	}
	
	this.redrawVectorLayers();
};

netgis.Map.prototype.onMapZoom = function( e )
{
	var params = e.detail;
	this.zoom( params.delta );
};

netgis.Map.prototype.onMapZoomHome = function( e )
{
	var config = this.config;
	
	if ( config[ "map" ][ "bbox" ] )
	{
		this.zoomBBox( config[ "map" ][ "bbox" ], 500 );
	}
	else if ( config[ "map" ][ "center" ] )
	{
		var coords = config[ "map" ][ "center" ];
		this.zoomCoords( coords[ 0 ], coords[ 1 ], config[ "map" ][ "zoom" ] );
	}
	else if ( config[ "map" ][ "center_lonlat" ] )
	{
		var coords = config[ "map" ][ "center_lonlat" ];
		this.zoomLonLat( coords[ 0 ], coords[ 1 ], config[ "map" ][ "zoom" ] );
	}
};

netgis.Map.prototype.onMapZoomLonLat = function( e )
{
	var params = e.detail;
	this.zoomLonLat( params.lon, params.lat, params.zoom );
};

netgis.Map.prototype.onMapZoomScale = function( e )
{
	var params = e.detail;
	this.zoomScale( params.scale, params.anim );
};

netgis.Map.prototype.onMapZoomLayer = function( e )
{
	var params = e.detail;
	
	var layer = this.layers[ params.id ];
	
	if ( ! layer ) { console.warning( "trying to zoom non existing layer", params.id ); return; }
	
	this.view.fit( layer.getSource().getExtent(), { duration: 600 } );
};

netgis.Map.prototype.onMapZoomLevel = function( e )
{
	var params = e.detail;
	this.view.setZoom( params.z );
};

netgis.Map.prototype.onMapViewPrev = function( e )
{
	this.gotoViewHistory( this.viewIndex - 1 );
};

netgis.Map.prototype.onMapViewNext = function( e )
{
	this.gotoViewHistory( this.viewIndex + 1 );
};

netgis.Map.prototype.onMapLayerToggle = function( e )
{
	var params = e.detail;
	
	//console.info( "Map Layer Toggle:", params );
	
	switch ( params.id )
	{
		// Internal Layers
		
		case netgis.LayerID.EDITABLE:
		{
			if ( params.on )
				this.map.addLayer( this.editLayer );
			else
				this.map.removeLayer( this.editLayer );
			
			break;
		}
		
		case netgis.LayerID.NON_EDITABLE:
		{
			if ( params.on )
				this.map.addLayer( this.nonEditLayer );
			else
				this.map.removeLayer( this.nonEditLayer );
			
			break;
		}
		
		// Config Layers
		
		default:
		{
			if ( params.on )
			{
				var layers = this.config[ "layers" ];

				for ( var i = 0; i < layers.length; i++ )
				{
					var layer = layers[ i ];

					if ( layer[ "id" ] !== params.id ) continue;
					
					this.addLayer( params.id, layer );
				}
			}
			else
			{
				this.removeLayer( params.id );
			}
			
			break;
		}
	}
};

netgis.Map.prototype.onMapLayerTransparency = function( e )
{
	var params = e.detail;
	var layer = this.layers[ params.id ];
	
	if ( ! layer )
	{
		netgis.util.invoke( this.container, netgis.Events.MAP_LAYER_TOGGLE, { id: params.id, on: true } );
		layer = this.layers[ params.id ];
	}
	
	layer.setOpacity( 1.0 - params.transparency );
};

netgis.Map.prototype.onMapLayerOrder = function( e )
{
	var params = e.detail;
	var layer = this.layers[ params.id ];
	
	if ( ! layer ) return;
	
	layer.setZIndex( params.order );
};

netgis.Map.prototype.onMapLayerCreate = function( e )
{
	var params = e.detail;
	this.addLayer( params[ "id" ], params );
};

netgis.Map.prototype.onMapLayerDelete = function( e )
{
	var params = e.detail;
	this.removeLayer( params.id );
};

netgis.Map.prototype.onMapSnapToggle = function( e )
{
	var params = e.detail;
	this.setSnapping( params.on );
};

netgis.Map.prototype.onMapMoveEnd = function( e )
{
	var center = this.view.getCenter();
	var zoom = this.view.getZoom();
	var scale = this.getScaleFromResolution( this.view.getResolution() );
	
	if ( this.viewFromHistory === false )
	{
		this.addViewHistory( center, zoom );
	}
	
	netgis.util.invoke( this.container, netgis.Events.MAP_VIEW_CHANGE, { center: center, zoom: zoom, scale: scale } );
	
	this.viewFromHistory = false;
};

netgis.Map.prototype.onPointerMove = function( e )
{
	var pixel = e.pixel;
	var coords = e.coordinate;
	
	var hoverFeature = null;
	var hoverLayer = null;
	var hoverBounds = undefined;
	
	var self = this;
	
	this.map.forEachFeatureAtPixel
	(
		pixel,
		function( feature, layer )
		{
			if ( ! layer ) return;
			if ( layer === self.measureLayer ) return;
			if ( layer === self.nonEditLayer ) return;
			if ( layer === self.boundsLayer ) { hoverBounds = feature; return; }
			if ( layer === self.previewLayer ) return;
			
			// TODO: no hover/interaction on imported layers for now
			//if ( layer.get( "id" ) && netgis.util.isString( layer.get( "id" ) ) && layer.get( "id" ).search( "import-" ) !== -1 ) return false;
			
			hoverFeature = feature;
			hoverLayer = layer;

			return true;
		}
	);
	
	// Handle Interactions
	switch ( this.mode )
	{
		case netgis.Modes.VIEW:
		{
			// Clickable Query Cursor
			var queryables = this.getQueryableLayers( true );
			
			if ( queryables.length === 0 )
			{
				// No Queryable Layers But Hover Feature
				if ( hoverFeature )
					this.container.classList.add( "netgis-clickable" );
				else
					this.container.classList.remove( "netgis-clickable" );
			}
			else
			{
				// Has Queryable Layers
				this.container.classList.add( "netgis-clickable" );
			}
			
			break;
		}
		
		case netgis.Modes.DRAW_POINTS:
		case netgis.Modes.DRAW_LINES:
		{
			this.updateDrawBufferPreview();
			break;
		}
	}
	
	// Inside Allowed Bounds
	if ( this.boundsLayer && ( this.mode === netgis.Modes.DRAW_POINTS || this.mode === netgis.Modes.DRAW_LINES || this.mode === netgis.Modes.DRAW_POLYGONS ) )
	{
		//if ( hoverBounds !== this.hoverBounds )
		{
			if ( hoverBounds )
			{
				this.container.classList.remove( "netgis-not-allowed" );
				this.container.removeAttribute( "title" );
			}
			else
			{
				this.container.classList.add( "netgis-not-allowed" );
				
				var message = this.config[ "tools" ][ "bounds_message" ];
				if ( message && message.length > 0 ) this.container.setAttribute( "title", message );
			}

			this.hoverBounds = hoverBounds;
		}
	}
	
	// Update Feature States
	var hoverable = true;
	
	//if ( this.mode === netgis.Modes.VIEW ) hoverable = false;
	if ( this.mode === netgis.Modes.MEASURE_LINE ) hoverable = false;
	if ( this.mode === netgis.Modes.MEASURE_AREA ) hoverable = false;
	if ( this.mode === netgis.Modes.DRAW_POINTS ) hoverable = false;
	if ( this.mode === netgis.Modes.DRAW_LINES ) hoverable = false;
	if ( this.mode === netgis.Modes.DRAW_POLYGONS ) hoverable = false;
	if ( this.mode === netgis.Modes.CUT_FEATURES_DRAW ) hoverable = false;
	
	if ( hoverFeature !== this.hoverFeature && hoverable )
	{
		if ( this.hoverFeature )
		{
			// Leave
			this.onFeatureLeave( this.hoverFeature, this.hoverLayer, pixel, coords );
		}
		
		if ( hoverFeature )
		{
			// Enter
			this.onFeatureEnter( hoverFeature, hoverLayer, pixel, coords );
		}
		
		this.redrawVectorLayers();
		
		this.hoverFeature = hoverFeature;
		this.hoverLayer = hoverLayer;
	}
	
	if ( hoverFeature )
	{
		// Hover
		this.onFeatureHover( hoverFeature, hoverLayer, pixel, coords );
	}
};

netgis.Map.prototype.onPointerLeave = function( e )
{
	if ( ! this.hoverFeature ) return;
	
	var pixel = [ e.offsetX, e.offsetY ];
	this.onFeatureLeave( this.hoverFeature, this.hoverLayer, pixel, null );
	
	this.hoverFeature = null;
	this.hoverLayer = null;
};

netgis.Map.prototype.onPointerClick = function( e )
{
	var pixel = e.pixel;
	var coords = e.coordinate;
	
	this.popupOverlay.setPosition( coords );
	
	// Map Click Event
	var view =
	{
		resolution: this.view.getResolution(),
		projection: this.view.getProjection().getCode(),
		bbox: this.view.calculateExtent( this.map.getSize() ),
		width: this.map.getSize()[ 0 ],
		height: this.map.getSize()[ 1 ]
	};
	
	var lonlat = ol.proj.toLonLat( coords, this.view.getProjection() );
	
	var infoURLs = {};
	
	for ( var id in this.layers )
	{
		var layer = this.layers[ id ];
		var source = layer.getSource();
		
		if ( source[ "getFeatureInfoUrl" ] )
		{
			// TODO: get default info format from config
			infoURLs[ id ] = source.getFeatureInfoUrl( coords, view.resolution, view.projection, { "INFO_FORMAT": "text/html" } );
		}
	}
	
	var params =
	{
		mode: this.mode,
		pixel: pixel,
		coords: coords,
		lon: lonlat[ 0 ],
		lat: lonlat[ 1 ],
		overlay: this.popupOverlay.getElement(),
		view: view,
		info: infoURLs
	};
	
	if ( this.mode === netgis.Modes.VIEW ) netgis.util.invoke( this.container, netgis.Events.MAP_CLICK, params );
	
	// Check Clicked Features
	var features = [];
	
	var self = this;
	this.map.forEachFeatureAtPixel
	(
		pixel,
		function( feature, layer )
		{
			if ( ! layer ) return;
			if ( layer === self.nonEditLayer ) return;
			if ( layer === self.boundsLayer ) return;
			if ( layer === self.measureLayer ) return;
			if ( layer === self.previewLayer ) return;
			
			// TODO: init seperate sketch layer ?
			//if ( layer === self.sketchLayer ) return;
			
			if ( self.sketchFeatures.indexOf( feature ) > -1 ) return;
			
			features.push( { feature: feature, layer: layer } );
		}
	);
	
	// Selectable Mode
	var selectable = true;
	
	if ( this.mode === netgis.Modes.VIEW ) selectable = false;
	if ( this.mode === netgis.Modes.MEASURE_LINE ) selectable = false;
	if ( this.mode === netgis.Modes.MEASURE_AREA ) selectable = false;
	if ( this.mode === netgis.Modes.DRAW_POINTS ) selectable = false;
	if ( this.mode === netgis.Modes.DRAW_LINES ) selectable = false;
	if ( this.mode === netgis.Modes.DRAW_POLYGONS ) selectable = false;
	if ( this.mode === netgis.Modes.CUT_FEATURES_DRAW ) selectable = false;
	
	if ( selectable )
	{
		// Clear Previous Selection If Not Multiple
		if ( features.length > 0 && this.selectMultiple === false )
			this.selectedFeatures = [];

		// Deselect If Nothing Clicked
		if ( features.length === 0 && this.selectMultiple === false )
			this.selectedFeatures = [];
		
		// Deselect If Multi Reset Requested
		if ( this.selectReset === true )
		{
			this.selectedFeatures = [];
			this.selectReset = false;
		}
		
		if ( this.mode === netgis.Modes.BUFFER_FEATURES_DYNAMIC )
		{
			this.updateBufferFeaturesSketch( this.bufferFeaturesRadius, this.bufferFeaturesSegments );
		}
	}
	
	// Feature Clicked
	for ( var i = 0; i < features.length; i++ )
	{
		var feature = features[ i ];
		
		if ( selectable )
		{
			// Check Already Selected
			var found = this.selectedFeatures.indexOf( feature.feature );
			
			if ( found > -1 )
			{
				// Remove From Selection
				this.selectedFeatures.splice( found, 1 );
			}
			else
			{
				// Add To Selection
				this.selectedFeatures.push( feature.feature );
			}
		}
		
		var clickable = false;
		if ( this.mode === netgis.Modes.VIEW ) clickable = true;
		if ( this.mode === netgis.Modes.SEARCH_PARCEL ) clickable = true;
		
		if ( clickable ) this.onFeatureClick( feature.feature, feature.layer, pixel, coords );
	}
	
	// Render
	this.redrawVectorLayers();
};

netgis.Map.prototype.onContainerClick = function( e )
{
	var clicks = e.detail;
	
	if ( clicks === 2 )
	{
		this.onDoubleClick( e );
	}
};

netgis.Map.prototype.onDoubleClick = function( e )
{
	switch ( this.mode )
	{
		case netgis.Modes.MEASURE_LINE:
		{
			if ( this.interactions[ netgis.Modes.MEASURE_LINE ] ) this.interactions[ netgis.Modes.MEASURE_LINE ][ 2 ].finishDrawing();
			break;
		}
		
		case netgis.Modes.MEASURE_AREA:
		{
			if ( this.interactions[ netgis.Modes.MEASURE_AREA ] ) this.interactions[ netgis.Modes.MEASURE_AREA ][ 2 ].finishDrawing();
			break;
		}
		
		case netgis.Modes.DRAW_LINES:
		{
			if ( this.interactions[ netgis.Modes.DRAW_LINES ] ) this.interactions[ netgis.Modes.DRAW_LINES ][ 0 ].finishDrawing();
			break;
		}
		
		case netgis.Modes.DRAW_POLYGONS:
		{
			if ( this.interactions[ netgis.Modes.DRAW_POLYGONS ] ) this.interactions[ netgis.Modes.DRAW_POLYGONS ][ 0 ].finishDrawing();
			break;
		}
		
		case netgis.Modes.CUT_FEATURES_DRAW:
		{
			if ( this.interactions[ netgis.Modes.CUT_FEATURES_DRAW ] ) this.interactions[ netgis.Modes.CUT_FEATURES_DRAW ][ 0 ].finishDrawing();
			break;
		}
	}
};

netgis.Map.prototype.onRightClick = function( e )
{
	switch ( this.mode )
	{
		case netgis.Modes.MEASURE_LINE:
		{
			if ( this.interactions[ netgis.Modes.MEASURE_LINE ] ) this.interactions[ netgis.Modes.MEASURE_LINE ][ 2 ].finishDrawing();
			break;
		}
		
		case netgis.Modes.MEASURE_AREA:
		{
			if ( this.interactions[ netgis.Modes.MEASURE_AREA ] ) this.interactions[ netgis.Modes.MEASURE_AREA ][ 2 ].finishDrawing();
			break;
		}
		
		case netgis.Modes.DRAW_LINES:
		{
			if ( this.interactions[ netgis.Modes.DRAW_LINES ] ) this.interactions[ netgis.Modes.DRAW_LINES ][ 0 ].finishDrawing();
			break;
		}
		
		case netgis.Modes.DRAW_POLYGONS:
		{
			if ( this.interactions[ netgis.Modes.DRAW_POLYGONS ] ) this.interactions[ netgis.Modes.DRAW_POLYGONS ][ 0 ].finishDrawing();
			break;
		}
		
		case netgis.Modes.CUT_FEATURES_DRAW:
		{
			if ( this.interactions[ netgis.Modes.CUT_FEATURES_DRAW ] ) this.interactions[ netgis.Modes.CUT_FEATURES_DRAW ][ 0 ].finishDrawing();
			break;
		}
	}
	
	e.preventDefault();
	return false;
};

netgis.Map.prototype.onKeyDown = function( e )
{	
	var keycode = e.keyCode || e.which;
	
	var KEY_ENTER = 13;
	var KEY_ESCAPE = 27;
	var KEY_BACK = 8;
	var KEY_DEL = 46;
	var KEY_SHIFT = 16;
	
	switch ( this.mode )
	{
		case netgis.Modes.MEASURE_LINE:
		{
			if ( keycode === KEY_ENTER ) this.interactions[ netgis.Modes.MEASURE_LINE ][ 2 ].finishDrawing();
			if ( keycode === KEY_ESCAPE ) this.interactions[ netgis.Modes.MEASURE_LINE ][ 2 ].abortDrawing();
			break;
		}
		
		case netgis.Modes.MEASURE_AREA:
		{
			if ( keycode === KEY_ENTER ) this.interactions[ netgis.Modes.MEASURE_AREA ][ 2 ].finishDrawing();
			if ( keycode === KEY_ESCAPE ) this.interactions[ netgis.Modes.MEASURE_AREA ][ 2 ].abortDrawing();
			break;
		}
		
		case netgis.Modes.DRAW_LINES:
		{
			var draw = this.interactions[ netgis.Modes.DRAW_LINES ][ 0 ];
			if ( keycode === KEY_ENTER ) draw.finishDrawing();
			if ( keycode === KEY_ESCAPE ) draw.abortDrawing();
			if ( keycode === KEY_BACK ) draw.removeLastPoint();
			if ( keycode === KEY_DEL ) draw.abortDrawing();
			break;
		}
		
		case netgis.Modes.DRAW_POLYGONS:
		{
			var draw = this.interactions[ netgis.Modes.DRAW_POLYGONS ][ 0 ];
			if ( keycode === KEY_ENTER ) draw.finishDrawing();
			if ( keycode === KEY_ESCAPE ) draw.abortDrawing();
			if ( keycode === KEY_BACK ) draw.removeLastPoint();
			if ( keycode === KEY_DEL ) draw.abortDrawing();
			break;
		}
		
		case netgis.Modes.CUT_FEATURES_DRAW:
		{
			var draw = this.interactions[ netgis.Modes.CUT_FEATURES_DRAW ][ 0 ];
			if ( keycode === KEY_ENTER ) draw.finishDrawing();
			if ( keycode === KEY_ESCAPE ) draw.abortDrawing();
			if ( keycode === KEY_BACK ) draw.removeLastPoint();
			if ( keycode === KEY_DEL ) draw.abortDrawing();
			
			// Back To Select Mode While Shift Down
			if ( keycode === KEY_SHIFT ) netgis.util.invoke( this.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.CUT_FEATURES } );
			
			break;
		}
	}
	
	if ( keycode === KEY_SHIFT )
	{
		if ( this.selectMultiple === false )
			netgis.util.invoke( this.container, netgis.Events.SELECT_MULTI_TOGGLE, { on: true } );
	}
};

netgis.Map.prototype.onKeyUp = function( e )
{
	var keycode = e.keyCode || e.which;
	
	var KEY_SHIFT = 16;
	
	switch ( this.mode )
	{
		case netgis.Modes.BUFFER_FEATURES:
		{
			if ( this.selectMultiple )
			{
				netgis.util.invoke( this.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.BUFFER_FEATURES_EDIT } );
			}
			
			break;
		}
		
		case netgis.Modes.CUT_FEATURES:
		{
			if ( this.selectMultiple )
			{
				netgis.util.invoke( this.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.CUT_FEATURES_DRAW } );
			}
			
			break;
		}
	}
	
	if ( keycode === KEY_SHIFT )
	{
		netgis.util.invoke( this.container, netgis.Events.SELECT_MULTI_TOGGLE, { on: false } );
		
		// TODO: deprecated ?
		this.selectReset = false;
		
		if ( this.config[ "tools" ][ "select_multi_reset" ] === true )
		{
			this.selectReset = true;
		}
	}
};

netgis.Map.prototype.onFeatureEnter = function( feature, layer, pixel, coords )
{
	if ( ! layer ) return;
	
	var hoverable = false;
	/*if ( layer.get( "id" ) === netgis.Client.Layers.EDIT_LAYER ) hoverable = true;
	if ( layer.get( "id" ) === netgis.Client.Layers.PARCEL_DISTRICTS ) hoverable = true;
	if ( layer.get( "id" ) === netgis.Client.Layers.PARCEL_FIELDS ) hoverable = true;
	if ( layer.get( "id" ) === netgis.Client.Layers.PARCEL_FEATURES ) hoverable = true;*/
	
	if ( layer === this.editLayer ) hoverable = true;
	
	if ( hoverable )
	{
	}
	
	switch ( this.mode )
	{
		case netgis.Modes.VIEW:
		{
			this.container.classList.add( "netgis-clickable" );
			
			break;
		}
		
		case netgis.Modes.DELETE_FEATURES:
		case netgis.Modes.BUFFER_FEATURES:
		case netgis.Modes.BUFFER_FEATURES_DYNAMIC:
		case netgis.Modes.CUT_FEATURES:
		{
			this.container.classList.add( "netgis-clickable" );
			feature.setStyle( this.styleHover.bind( this ) );
			break;
		}
		
		case netgis.Modes.SEARCH_PARCEL:
		{
			this.container.classList.add( "netgis-clickable" );
			feature.setStyle( this.styleHover.bind( this ) );
			break;
		}
	}
	
	netgis.util.invoke( this.container, netgis.Events.MAP_FEATURE_ENTER, { pixel: pixel, coords: coords, layer: layer.get( "id" ), properties: feature.getProperties() } );
};

netgis.Map.prototype.onFeatureHover = function( feature, layer, pixel, coords )
{
	
};

netgis.Map.prototype.onFeatureClick = function( feature, layer, pixel, coords )
{
	//console.info( "FEATURE CLICK:", feature, layer.get( "id" ), this.selectedFeatures );
	
	if ( this.mode === netgis.Modes.SEARCH_PARCEL )
	{
		if ( layer.get( "id" ) !== "searchparcel_districts" && layer.get( "id" ) !== "searchparcel_fields" && layer.get( "id" ) !== "searchparcel_parcels" ) return;
	}
	
	var lonlat = ol.proj.toLonLat( coords, this.view.getProjection() );
	
	var params =
	{
		pixel: pixel,
		coords: coords,
		lon: lonlat[ 0 ],
		lat: lonlat[ 1 ],
		overlay: this.popupOverlay.getElement(),
		layer: layer.get( "id" ),
		id: feature.getId(),
		properties: feature.getProperties(),
		mode: this.mode
	};
	
	netgis.util.invoke( this.container, netgis.Events.MAP_FEATURE_CLICK, params );
	
	// Handle Interactions
	switch ( this.mode )
	{
		case netgis.Modes.VIEW:
		{
			break;
		}
		
		case netgis.Modes.DELETE_FEATURES:
		{
			layer.getSource().removeFeature( feature );
			this.onFeatureLeave( feature, layer );
			netgis.util.invoke( this.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.VIEW } );
			
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURES:
		case netgis.Modes.BUFFER_FEATURES_EDIT:
		{
			this.onFeatureLeave( feature, layer );
			
			if ( ! this.selectMultiple )
				netgis.util.invoke( this.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.BUFFER_FEATURES_EDIT } );
			else
				netgis.util.invoke( this.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.BUFFER_FEATURES } );
			
			break;
		}
		
		case netgis.Modes.BUFFER_FEATURES_DYNAMIC:
		{
			this.updateBufferFeaturesSketch( this.bufferFeaturesRadius, this.bufferFeaturesSegments );
			break;
		}
		
		case netgis.Modes.CUT_FEATURES:
		{
			if ( feature.getGeometry() instanceof ol.geom.Point )
			{
				this.onFeatureLeave( feature, layer );
				break;
			}
			
			if ( ! this.selectMultiple )
				netgis.util.invoke( this.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.CUT_FEATURES_DRAW } );
			
			break;
		}
		
		case netgis.Modes.SEARCH_PARCEL:
		{
			break;
		}
	}
};

netgis.Map.prototype.onFeatureLeave = function( feature, layer, pixel, coords )
{
	var hoverable = false;
	if ( layer === this.editLayer ) hoverable = true;
	
	if ( hoverable )
	{
	}
			
	netgis.util.invoke( this.container, netgis.Events.MAP_FEATURE_LEAVE, { pixel: pixel, coords: coords, layer: layer ? layer.get( "id" ) : null, properties: feature.getProperties() } );
	
	switch ( this.mode )
	{
		case netgis.Modes.VIEW:
		{
			break;
		}
		
		case netgis.Modes.DELETE_FEATURES:
		case netgis.Modes.BUFFER_FEATURES:
		case netgis.Modes.BUFFER_FEATURES_DYNAMIC:
		case netgis.Modes.CUT_FEATURES:
		case netgis.Modes.CUT_FEATURES_DRAW:
		{
			this.container.classList.remove( "netgis-clickable" );
			feature.setStyle( null );
			break;
		}
		
		case netgis.Modes.SEARCH_PARCEL:
		{
			this.container.classList.remove( "netgis-clickable" );
			feature.setStyle( null );
			break;
		}
	}
};

netgis.Map.prototype.onEditLayerAdd = function( e )
{
	if ( ! this.editEventsSilent ) this.updateEditOutput();
	
	this.snapFeatures.push( e.feature );
};

netgis.Map.prototype.onEditLayerRemove = function( e )
{
	if ( ! this.editEventsSilent ) this.updateEditOutput();
	
	this.snapFeatures.remove( e.feature );
};

netgis.Map.prototype.onEditLayerChange = function( e )
{
	if ( ! this.editEventsSilent ) this.updateEditOutput();
};

netgis.Map.prototype.onCopyFeatureToEdit = function( e )
{
	var params = e.detail;
	
	var layer = this.layers[ params.source ];
	var feature = layer.getSource().getFeatureById( params.id );
	
	if ( ! feature ) { console.error( "feature to copy not found", params ); return; }
	
	if ( ! this.editLayer.getSource().getFeatureById( params.id ) )
	{
		feature.setStyle( undefined );
		this.selectedFeatures = [];
		
		this.editLayer.getSource().addFeature( feature );
	}
};

netgis.Map.prototype.onGeolocToggleActive = function( e )
{
	var params = e.detail;
	
	if ( params.on )
		this.geolocLayer.setVisible( true );
	else
		this.geolocLayer.setVisible( false );
};

netgis.Map.prototype.onGeolocChange = function( e )
{
	var params = e.detail;
	
	var marker = this.geolocLayer.getSource().getFeatures()[ 0 ];
	marker.getGeometry().setCoordinates( ol.proj.fromLonLat( [ params.lon, params.lat ], this.view.getProjection() ) );
	
	if ( params.center === true )
	{
		this.zoomLonLat( params.lon, params.lat, this.view.getZoom() );
	}
};

netgis.Map.prototype.onMeasureLineBegin = function( e )
{
	this.measureLayer.getSource().clear();
};

netgis.Map.prototype.onMeasureAreaBegin = function( e )
{
	this.measureLayer.getSource().clear();
};

netgis.Map.prototype.onMeasureClear = function( e )
{
	this.measureLayer.getSource().clear();
};

netgis.Map.prototype.onDrawBufferEnd = function( e )
{
	var feature = e.feature;
	var previews = this.previewLayer.getSource().getFeatures();
	
	if ( previews.length === 0 ) return;
	
	var preview = previews[ 0 ];
	
	// Check Point Inside Bounds Layer
	if ( this.boundsLayer )
	{
		var inside = true;
		
		if ( feature.getGeometry() instanceof ol.geom.Point )
			inside = this.isPointInsideLayer( this.boundsLayer, feature.getGeometry().getCoordinates() );
		else
			inside = this.isGeomInsideLayer( this.boundsLayer, feature.getGeometry() );

		if ( ! inside ) return;
		
		// Clip Buffer Preview Against Bounds
		var parser = new jsts.io.OL3Parser();

		var a = parser.read( preview.getGeometry() );
		var bounds = this.boundsLayer.getSource().getFeatures();
		
		for ( var i = 0; i < bounds.length; i++ )
		{
			var b = parser.read( bounds[ i ].getGeometry() );
			
			if ( ! a.intersects( b ) ) continue;
			
			a = a.intersection( b );
		}
		
		// TODO: handle preview intersection with multiple bounds features, create multi polygon ?

		// Output
		var geom = parser.write( a );
		preview.setGeometry( geom );
	}
		
	// Add Buffer Feature
	var src = this.editLayer.getSource();
	src.addFeature( preview.clone() );

	// Remove Sketch Feature
	window.setTimeout
	(
		function()
		{
			src.removeFeature( feature );
		},
		10
	);
};

netgis.Map.prototype.onSelectMultiToggle = function( e )
{
	var params = e.detail;
	this.selectMultiple = params.on;
};

netgis.Map.prototype.onDrawBufferToggle = function( e )
{
	var params = e.detail;
	this.setDrawBuffer( params.on, params.radius, params.segments );
};

netgis.Map.prototype.onDrawBufferChange = function( e )
{
	var params = e.detail;
	
	this.drawBufferRadius = params.radius;
	this.drawBufferSegments = params.segments;
	
	this.updateDrawBufferPreview();
};

netgis.Map.prototype.onBufferChange = function( e )
{
	var params = e.detail;
   
	this.updateBufferFeaturesSketch( params.radius, params.segments );
	
	this.bufferFeaturesRadius = params.radius;
	this.bufferFeaturesSegments = params.segments;
};

netgis.Map.prototype.updateBufferFeaturesSketch = function( radius, segments )
{
	var features = this.selectedFeatures;
	var source = this.editLayer.getSource();
	
	this.clearSketchFeatures();
	
	for ( var f = 0; f < features.length; f++ )
	{
		var target = this.selectedFeatures[ f ];
		var feature = this.createBufferFeature( target.getGeometry(), radius, segments );
		
		source.addFeature( feature );
		
		this.sketchFeatures.push( feature );
	}
};

netgis.Map.prototype.onBufferAccept = function( e )
{
	// Remove Selected Source Features
	var features = this.selectedFeatures;
	var source = this.editLayer.getSource();
	
	for ( var f = 0; f < features.length; f++ )
	{
		var feature = features[ f ];
		source.removeFeature( feature );
	}
	
	// Keep Sketch Features in Edit Layer
	this.sketchFeatures = [];
	this.selectedFeatures = [];
};

netgis.Map.prototype.onCutFeaturesDrawEnd = function( e )
{
	var cutter = e.feature;
	
	for ( var i = 0; i < this.selectedFeatures.length; i++ )
	{
		var target = this.selectedFeatures[ i ];
	
		if ( target )
		{
			this.onFeatureLeave( target, null );

			// Check Geom Type
			if ( target.getGeometry() instanceof ol.geom.Point )
			{
				console.error( "trying to cut a point feature", target );
			}
			else
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
			}
		}
	
	}
	
	this.selectedFeatures = [];
	
	this.editEventsSilent = true;
	this.splitMultiPolygons( this.editLayer );
	this.editEventsSilent = false;
	this.updateEditOutput();
	
	netgis.util.invoke( this.container, netgis.Events.CLIENT_SET_MODE, { mode: netgis.Modes.VIEW } );
};

netgis.Map.prototype.onImportLayerAccept = function( e )
{
	var params = e.detail;
	
	var layer = this.addLayer( params[ "id" ], params );
	var source = layer.getSource();
	
	if ( source instanceof ol.source.Vector && source.getFeatures().length > 0 )
	{
		this.view.fit( layer.getSource().getExtent(), { duration: 600 } );
	}
};

netgis.Map.prototype.onImportGeoportalSubmit = function( e )
{
	var params = e.detail;
};

netgis.Map.prototype.onImportLayerPreview = function( e )
{
	var params = e.detail;
	
	var layer = this.createLayer( params );
	var proj = this.view.getProjection().getCode(); // TODO: layer.getSource().getProjection().getCode() ?
	
	netgis.util.invoke( this.container, netgis.Events.IMPORT_LAYER_PREVIEW_FEATURES, { id: params.id, title: params.title, layer: layer, proj: proj } );
};

netgis.Map.prototype.onSearchParcelReset = function( e )
{
	// Zoom To Parcel Districts
	var zoom = this.config[ "searchparcel" ][ "districts_service" ][ "min_zoom" ];
	if ( zoom ) this.view.setZoom( zoom );
};

netgis.Map.prototype.onSearchParcelItemEnter = function( e )
{
	var params = e.detail;
	var id = params.id;
	
	var feature = this.layers[ "searchparcel_parcels" ].getSource().getFeatureById( id );
	
	feature.setStyle( this.styleHover.bind( this ) );
};

netgis.Map.prototype.onSearchParcelItemLeave = function( e )
{
	var params = e.detail;
	var id = params.id;
	
	var feature = this.layers[ "searchparcel_parcels" ].getSource().getFeatureById( id );
	
	feature.setStyle( null );
};

netgis.Map.prototype.onSearchParcelItemClick = function( e )
{
	var params = e.detail;
	
	var id = params.id;
	
	this.zoomFeature( "searchparcel_parcels", id );
};

netgis.Map.prototype.onSearchParcelItemImport = function( e )
{
	var params = e.detail;
};

netgis.Map.prototype.onDrawPointsUpdateGeom = function( coords, geom, proj )
{
	if ( ! geom )
		geom = new ol.geom.Point( coords );
	else
		geom.setCoordinates( coords );
	
	// TODO: can not use this for interactive bounds check because not fired on move ?
	
	return geom;
};

netgis.Map.prototype.onDrawLinesUpdateGeom = function( coords, geom, proj )
{	
	// NOTE: https://openlayers.org/en/latest/apidoc/module-ol_geom_LineString-LineString.html
	// NOTE: https://openlayers.org/en/latest/apidoc/module-ol_interaction_Draw-Draw.html
	// NOTE: https://openlayers.org/en/latest/apidoc/module-ol_interaction_Draw.html#~GeometryFunction
	// NOTE: https://gis.stackexchange.com/questions/165971/openlayers-drawing-interaction-geometryfunction
	
	if ( ! geom )
		geom = new ol.geom.LineString( coords );
	else
		geom.setCoordinates( coords );
	
	// Check Layer Contains Geom
	var inside = this.isGeomInsideLayer( this.boundsLayer, geom );
	
	this.drawError = ! inside;
	
	// TODO: remove last coord if not inside ?
	
	return geom;
};

netgis.Map.prototype.onDrawPolygonsUpdateGeom = function( coords, geom, proj )
{
	if ( ! geom )
	{
		geom = new ol.geom.Polygon( coords );
	}
	else
	{
		coords = [ coords[ 0 ].concat( [ coords[ 0 ][ 0 ] ] ) ];
		geom.setCoordinates( coords );
	}
	
	// Check Layer Contains Geom
	var inside = true;
	
	if ( coords[ 0 ].length < 4 )
	{
		// Not Yet A Polygon
		for ( var i = 0; i < coords[ 0 ].length; i++ )
		{
			var c = coords[ 0 ][ i ];
			
			// TODO: check line between first two points instead of single points ?
			
			if ( ! this.isPointInsideLayer( this.boundsLayer, c ) )
			{
				inside = false;
				break;
			}
		}
	}
	else
	{
		// Complete Polygon Check
		inside = this.isGeomInsideLayer( this.boundsLayer, geom );
	}
	
	this.drawError = ! inside;
	
	return geom;
};

netgis.Map.prototype.onDrawPointsEnd = function( e )
{
	// NOTE: https://gis.stackexchange.com/questions/252045/openlayers-map-draw-polygon-feature-inside-boundaries
	
	// Check Point Inside Bounds Layer
	if ( ! this.boundsLayer ) return;
	
	var feature = e.feature;
	var layer = this.editLayer;
	
	var inside = this.isPointInsideLayer( this.boundsLayer, feature.getGeometry().getCoordinates() );
	
	// TODO: refactor with line / polygon draw end functions ?
	
	if ( ! inside )
	{
		window.setTimeout( function() { layer.getSource().removeFeature( feature ); }, 10 );
	}
};

netgis.Map.prototype.onDrawLinesEnd = function( e )
{
	// Check Line Inside Bounds Layer
	if ( ! this.boundsLayer ) return;
	
	var feature = e.feature;
	var layer = this.editLayer;
	
	var inside = this.isGeomInsideLayer( this.boundsLayer, feature.getGeometry() );
	
	if ( ! inside )
	{
		window.setTimeout( function() { layer.getSource().removeFeature( feature ); }, 10 );
	}
};

netgis.Map.prototype.onDrawPolygonsEnd = function( e )
{
	// Check Polygon Inside Bounds Layer
	if ( ! this.boundsLayer ) return;
	
	var feature = e.feature;
	var layer = this.editLayer;
	
	var inside = this.isGeomInsideLayer( this.boundsLayer, feature.getGeometry() );
	
	if ( ! inside )
	{
		window.setTimeout( function() { layer.getSource().removeFeature( feature ); }, 10 );
	}
};

netgis.Map.prototype.onExportBegin = function( e )
{
	var params = e.detail;
	
	switch ( params.format )
	{
		case "geojson":
		{
			this.exportFeatures( params.nonEdits );
			break;
		}
		
		default:
		{
			this.exportImage( params.format, params.width, params.height, params.landscape, params.padding );
			break;
		}
	}
};

netgis.Map.prototype.onScalebarSelectChange = function( e )
{
	var scale = this.scalebarSelect.value;
	
	netgis.util.invoke( this.scalebarSelect, netgis.Events.MAP_ZOOM_SCALE, { scale: scale, anim: true } );
};

netgis.Map.prototype.onTimeSliderShow = function( e )
{
	var params = e.detail;
};

netgis.Map.prototype.onTimeSliderHide = function( e )
{
	var params = e.detail;
};

netgis.Map.prototype.onTimeSliderSelect = function( e )
{
	var params = e.detail;
	this.layers[ params.layer ].getSource().updateParams( { "TIME": params.time } );
};