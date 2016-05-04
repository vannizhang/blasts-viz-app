var map, addBlastSites, addBlastHighlightSites, zoomToBlastSite;

require(["esri/map", 
"esri/graphic",
"esri/layers/GraphicsLayer",
"esri/geometry/Point",
"esri/symbols/SimpleMarkerSymbol",
"esri/geometry/webMercatorUtils",
"esri/Color",
"dojo/domReady!"], 
function(
    Map, Graphic, GraphicsLayer, 
    Point, SimpleMarkerSymbol, 
    webMercatorUtils, Color
) {
    
    map = new Map("mapDiv", {
        center: [0, 45],
        zoom: 3,
        basemap: "dark-gray"
    });

    var blastLayer = new GraphicsLayer({
        id: 'blastLayer',
        opacity: 0.8
    });
    
    var blastHighlightLayer = new GraphicsLayer({
        id: 'blastHighlightLayer',
        opacity: 0.8
    });    
    
    map.addLayer(blastLayer);
    map.addLayer(blastHighlightLayer);

    addBlastSites = function(locations){
        map.getLayer('blastLayer').clear(); 
        map.getLayer('blastHighlightLayer').clear();   
         
        var symbol = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CIRCLE, 
          5, 
          null,
          new Color([0, 168, 232, 0.5])
        );    
        
        locations.forEach(function(d){
            var graphic = new Graphic(new Point(d[0], d[1]), symbol);    
            map.getLayer('blastLayer').add(graphic);          
        });
    }
    
    addBlastHighlightSites = function(location, hightlight){
        map.getLayer('blastHighlightLayer').clear();  
         
        var symbol = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CIRCLE, 
          10, 
          null,
          new Color([176, 23, 31, 0.9])
        );    
        
        var graphic = new Graphic(new Point(location[0], location[1]), symbol);    
        map.getLayer('blastHighlightLayer').add(graphic);  
    }    
    
    zoomToBlastSite = function(location){
        map.centerAt(new Point(location[0], location[1]));
    }
    
    map.on("extent-change", changeHandler);

    function changeHandler(evt){
        var extent = evt.extent;
        var lod = evt.lod.level;
        
        console.log(evt);

        coordMin = webMercatorUtils.xyToLngLat(extent.xmin, extent.ymin);
        coordMax = webMercatorUtils.xyToLngLat(extent.xmax, extent.ymax);
        
        // console.log(evt);
        
        if(lod >= 5){
            showCircleWithinCurrentExtent({
                coordMin: coordMin,
                coordMax: coordMax
            });
        } else {
            showAllCircles();
        }

    }    
    
  
});