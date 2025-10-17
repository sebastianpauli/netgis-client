"use strict";

var netgis = netgis || {};

netgis.Modes = Object.freeze
(
	{
		VIEW: "view",
		ZOOM_BOX: "zoom-box",
		
		MEASURE_LINE: "measure-line",
		MEASURE_AREA: "measure-area",
		
		DRAW_POINTS: "draw-points",
		DRAW_LINES: "draw-lines",
		DRAW_POLYGONS: "draw-polygons",
		MODIFY_FEATURES: "modify-features",
		DELETE_FEATURES: "delete-features",
		BUFFER_FEATURES: "buffer-features",
		BUFFER_FEATURES_EDIT: "buffer-features-edit",
		BUFFER_FEATURES_DYNAMIC: "buffer-features-dynamic",
		CUT_FEATURES: "cut-features",
		CUT_FEATURES_DRAW: "cut-features-draw",
		CUT_FEATURES_DYNAMIC: "cut-features-dynamic",
		
		SEARCH_PARCEL: "search-parcel"
	}
);