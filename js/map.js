var map, addBlastSites, addBlastHighlightSites, zoomToBlastSite;

require(["esri/map", 
"esri/graphic",
"esri/layers/GraphicsLayer",
"esri/geometry/Point",
"esri/renderers/ClassBreaksRenderer",
"esri/symbols/SimpleMarkerSymbol",
"esri/symbols/SimpleLineSymbol",
"esri/geometry/webMercatorUtils",
"esri/Color",
"dojo/domReady!"], 
function(
    Map, Graphic, GraphicsLayer, 
    Point, ClassBreaksRenderer, SimpleMarkerSymbol, SimpleLineSymbol,
    webMercatorUtils, Color
) {
    
    map = new Map("mapDiv", {
        center: [0, 50],
        zoom: 3,
        basemap: "dark-gray",
        showAttribution: false
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
    
    var rd = new ClassBreaksRenderer(new SimpleMarkerSymbol(), "mag");
    rd.addBreak(6, 8, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 5, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100,0])),new Color([255, 255, 255, 0.4])));
    rd.addBreak(4, 6, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 5, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100,0])),new Color([255, 255, 0, 0.4])));
    rd.addBreak(2, 4, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 4, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100,0])),new Color([255, 83, 0, 0.4])));
    rd.addBreak(0, 2, new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 4, new SimpleLineSymbol().setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([100,100,100,0])),new Color([181, 0, 77, 0.4])));
    
    blastLayer.renderer = rd;

    addBlastSites = function(locations){
        map.getLayer('blastLayer').clear(); 
        map.getLayer('blastHighlightLayer').clear();   

        locations.forEach(function(d){        
            var graphic = new Graphic(new Point(d[0], d[1]), null, {mag: +d[2]});    
            map.getLayer('blastLayer').add(graphic);          
        });
        
        console.log(blastLayer);
    }

    addBlastHighlightSites = function(location, hightlight){
        map.getLayer('blastHighlightLayer').clear();  
         
        var symbol = new SimpleMarkerSymbol(
          SimpleMarkerSymbol.STYLE_CIRCLE, 
          8, 
          null,
          new Color([255, 0, 0, 1])
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
        
        // console.log(evt);

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