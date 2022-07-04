"use strict";

var netgis = netgis || {};

netgis.Modes = Object.freeze
(
	{
		VIEW: "VIEW",
		PANNING: "PANNING",
		ZOOMING_IN: "ZOOMING_IN",
		ZOOMING_OUT: "ZOOMING_OUT",
		
		DRAW_POINTS: "DRAW_POINTS",
		DRAW_LINES: "DRAW_LINES",
		DRAW_POLYGONS: "DRAW_POLYGONS",
		
		CUT_FEATURE_BEGIN: "CUT_FEATURE_BEGIN",
		CUT_FEATURE_DRAW: "CUT_FEATURE_DRAW",
		MODIFY_FEATURES: "MODIFY_FEATURES",
		DELETE_FEATURES: "DELETE_FEATURES",
		BUFFER_FEATURE_BEGIN: "BUFFER_FEATURE_BEGIN",
		BUFFER_FEATURE_EDIT: "BUFFER_FEATURE_EDIT",
		
		SEARCH_PLACE: "SEARCH_PLACE"
	}
);