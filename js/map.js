var map, addBlastSites, addBlastHighlightSites, zoomToBlastSite;

require(["esri/map", 
"esri/graphic",
"esri/layers/GraphicsLayer",
"esri/geometry/Point",
"esri/symbols/SimpleMarkerSymbol",
"esri/Color",
"dojo/domReady!"], 
function(Map, Graphic, GraphicsLayer, Point, SimpleMarkerSymbol, Color) {
    
    map = new Map("mapDiv", {
        center: [180, 45],
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
  
});