# netgis-client
WebGIS-Client in development for NetGIS / Geoportal RLP.

## Disclaimer:
In early development, things will change and break frequently!

## Principles:
- **Small Footprint:** Because this map clients purpose is to be included in other websites in multiple instances, no frameworks are used to keep it lean. Obviously some libraries like OL are necessary (see dependencies), but the goal is to mostly rely on browser APIs only.
- **Backwards Compatibility:** This map client may be used in work environments with relatively old hardware and software.
- **Modularization:** Functionality is encapsulated in module classes (classic JS prototyped objects).
- **Programming Patterns:** At the core this client makes heavy use of the Observer and State patterns. Where possible pure functions shall be implemented to reduce side effects.

## Dependencies:
### Core:
- OpenLayers 6
- FontAwesome 5

### Optional:
- Proj4js
- JSTS
- ShapefileJS
- JSPDF
- GIFJS

## Documentation:
Coming soon. See the "demo" folder for example implementations.
