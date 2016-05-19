var startDate = new Date(1963, 1, 2);
var endDate = new Date(2016, 4, 30);
var docWidth = $(document).width();
var docHeight = $(document).height();
var showCircleWithinCurrentExtent, showAllCircles;
var queryParams, updateSliderPositions;
var sliderInDrag = false;
var initialHash = '#1965/1980/4.0/7.0/0/50/2';

// Set the dimensions of the canvas / graph
var margin = {top: 30, right: 0, bottom: 10, left: 50},
    width = docWidth  - margin.left - margin.right,
    height = docHeight * 0.39 - margin.top - margin.bottom;
    
// Adds the svg canvas
var svg = d3.select("#chartDiv")
    .append("svg")
        .attr('class', 'svg-container')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr('class', 'canvas-element')
        .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")");
                
var parseDate = d3.time.format("%m/%d/%Y").parse;

// Set the ranges
var xScale = d3.time.scale()
    .domain([startDate, endDate])
    .range([0, width - margin.left - margin.right]);
    
var yScale = d3.scale.linear()
    .domain([1, 7])
    .range([(height - margin.top), 0]);

// Define the axes
var xAxis = d3.svg.axis()
    .scale(xScale)
    .orient("bottom")
    .ticks(60)
    .tickPadding(12)
    .tickFormat(function(d){
        var year = d3.time.format('%Y')(new Date(d));
        return year.slice(-2);
    })
    .innerTickSize(-(height - margin.top));

var yAxis = d3.svg.axis()
    .scale(yScale)
    .orient("left")
    .tickValues(yScale.domain())    
    .tickFormat(function(d){
        if(d == 1){
            return '-  ';
        } else {
            return '+';
        }
    })
    .ticks(2)
    .tickPadding(8);
    // .innerTickSize(-(width - margin.left - margin.right));

// Add the X Axis
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + (height - margin.top) + ")")
    .call(xAxis);

// Add the Y Axis
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis); 

//re-style y axis ticks    
d3.select('.y').selectAll('text').each(function(d){
    if(d == 1){
        d3.select(this)
        .attr('x', -16)
        .style('fill', function(d){
            return '#B5004D';
        });      
          
    } else {
        d3.select(this).style('fill', function(d){
            return '#FFFF00';
        });            
    }    
});

var yAxisGradientLine = svg.append('line')
    .attr({
        'x1': -19.5,
        'y1': 10,
        'x2': -19.5,
        'y2': height - margin.top -7
    })
    // .style("display", "none")
    .attr('stroke-width', '2')
    .style('opacity', 1)
    .attr("stroke", "#998743")
    .attr('class', 'y-axis-gradient-line');
 
//create gradient color encoding object  
svg.append("linearGradient")
    .attr("id", "temperature-gradient")
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0).attr("y1", yScale(1))
    .attr("x2", 0).attr("y2", yScale(7))
    .selectAll("stop")
        .data([
            {offset: "0%", color: "#B5004D"},
            {offset: "50%", color: "#FF5300"},
            {offset: "100%", color: "#FFFF00"}
        ])
    .enter().append("stop")
        .attr("offset", function(d) { return d.offset; })
        .attr("stop-color", function(d) { return d.color; });    
    
var radiusScale = d3.scale.linear()
    .domain([0, 7])
    .range([1, 2]);  
    
var colorScale = d3.scale.linear()
    .domain([2, 4, 6])
    .range(['#B5004D', '#FF5300', '#FFFF00']);
    
// Get the data
d3.csv("./data/blast-data.csv", function(error, data) {

    data.forEach(function(d) {
        d.DateTime = parseDate(d.DateTime);
        d.Magnitude = +d.Magnitude;
    });
    
    // console.log(data[0]);
    // addAllBlastSites({Longitude: 0, Latitude:0, Magnitude: 0});  
    
    
    svg.selectAll("circle")
        .data(data).enter()
        .append("circle")
        .attr('class', 'circle')
        .attr("cx",function(d) {return xScale(d.DateTime);})
        .attr("cy",function(d) {return yScale(d.Magnitude);})
        .attr("r",function(d) {
            return radiusScale(d.Magnitude);
            // return 2;
        })
        .style("fill", function(d) {
            return colorScale(+d.Magnitude);
        })
        .style("opacity", function(d) {
            return 0.2;
        })
        .on('click', function(d){
            // console.log(d);
            zoomToBlastSite([d.Longitude, d.Latitude])
        })
        .on('mouseover', function(d){
            d3.select(this)
                .attr("r", 5)
                .style("opacity", 1);
                
            if($('#yearDiv').text()){
                addBlastHighlightSites([d.Longitude, d.Latitude, d.DateTime, d.Magnitude]);
            }
            
        })
        .on('mouseout', function(d){
            d3.select(this)
                .attr("r", 2)
                .style("opacity", 0.5);
            
            map.getLayer('blastHighlightLayer').clear(); 
            map.infoWindow.hide();
        }); 

    function getDateByX(x){
        return xScale.invert(x);
    }
    
    function getMagByY(y){
        return yScale.invert(y);
    }   
        
    var drag = d3.behavior.drag()
        .on("drag", dragmove)
        .on("dragend", dragend);

    function dragmove(d) {
        sliderInDrag = true;
        
        // console.log(xScale(endDate));
        var x = d3.event.x,
        xMin = xScale(startDate),
        xMax = xScale(endDate);
        x = (x < xMin) ? xMin : x;
        x = (x > xMax) ? xMax : x;
        
        var y = d3.event.y,
        yMin = yScale(8),
        yMax = yScale(1);
        y = (y < yMin) ? yMin : y;
        y = (y > yMax) ? yMax : y;
        
        if(d3.select(this).attr('class') == 'vLine'){
            d3.select(this)
            .attr("x1", x)
            .attr("x2", x);   
        } else {
            d3.select(this)
            .attr("y1", y)
            .attr("y2", y);  
        }

        var xRange = [+d3.selectAll('#vLine0').attr('x1'), +d3.selectAll('#vLine1').attr('x1')];
        var yRange = [+d3.selectAll('#hLine0').attr('y1'), +d3.selectAll('#hLine1').attr('y1')];
        var timeExtent = [getDateByX(xRange[0]), getDateByX(xRange[1])];
        var magExtent = [getMagByY(yRange[0]), getMagByY(yRange[1])];
        
        // var format = d3.time.format("%Y");

        // var yearText = format(d3.min(timeExtent)) + ' - ' + format(d3.max(timeExtent));
        // var magText = 'magnitude ' + d3.min(magExtent).toFixed(1)+ ' - ' + d3.max(magExtent).toFixed(1);
        
        // if($('#yearDiv').text() !== yearText){
        //     $('#yearDiv').text(yearText); 
        // }
        
        // if(!$("#magDiv").width()) {
        //     console.log($("#yearDiv").width());
        //     $("#magDiv").css('width', $("#yearDiv").width()); 
        // }
        
        // if($('#magDiv').text() !== magText){
        //     $('#magDiv').text(magText); 
        // }
        
        updateBillboard(timeExtent, magExtent);
        
        queryParams = [new Date(d3.min(timeExtent)).getFullYear(), new Date(d3.max(timeExtent)).getFullYear(), d3.min(magExtent).toFixed(1), d3.max(magExtent).toFixed(1)];
        updateHash(queryParams, mapViewData);         
    }
    
    updateBillboard = function(timeExtent, magExtent){
        var format = d3.time.format("%Y");
        var yearText = format(d3.min(timeExtent)) + ' - ' + format(d3.max(timeExtent));
        var magText = 'magnitude ' + d3.min(magExtent).toFixed(1)+ ' - ' + d3.max(magExtent).toFixed(1);
        
        if($('#yearDiv').text() !== yearText){
            $('#yearDiv').text(yearText); 
        }
        
        if(!$("#magDiv").width()) {
            $("#magDiv").css('width', $("#yearDiv").width()); 
        }
        
        if($('#magDiv').text() !== magText){
            $('#magDiv').text(magText); 
        }
    }
    
    updateSliderPositions = function(data){
        if(!sliderInDrag){
            if(data){
                var startYearFromHash = data[0],
                    endYearFromHash = data[1],
                    magLowFromHash = data[2],
                    magHighFromHash = data[3];
                    
                var xStart = xScale(new Date(startYearFromHash, 1, 2));
                var xEnd = xScale(new Date(endYearFromHash, 1, 2));
                var yLow = yScale(magLowFromHash);
                var yHigh = yScale(magHighFromHash);
                
                d3.select('#vLine0')
                    .attr("x1", xStart)
                    .attr("x2", xStart);  
                    
                d3.select('#vLine1')
                    .attr("x1", xEnd)
                    .attr("x2", xEnd);    
                    
                d3.select('#hLine0')
                    .attr("y1", yLow)
                    .attr("y2", yLow);  
                
                d3.select('#hLine1')
                    .attr("y1", yHigh)
                    .attr("y2", yHigh);                                              
            }

            var xRange = [+d3.selectAll('#vLine0').attr('x1'), +d3.selectAll('#vLine1').attr('x1')];
            var yRange = [+d3.selectAll('#hLine0').attr('y1'), +d3.selectAll('#hLine1').attr('y1')];
                
            var timeExtent = [getDateByX(xRange[0]), getDateByX(xRange[1])];
            var magExtent = [getMagByY(yRange[0]), getMagByY(yRange[1])];
            
            updateBillboard(timeExtent, magExtent);
            // var format = d3.time.format("%Y");
            // $('#yearDiv').text(format(d3.min(timeExtent)) + ' - ' + format(d3.max(timeExtent)));
            // console.log(format(d3.min(timeExtent)), format(d3.max(timeExtent)));
            
            var locations = [];
            d3.selectAll(".circle").each(function(d){
                // 
                if((d.DateTime >= d3.min(timeExtent) && d.DateTime <= d3.max(timeExtent) ) && (+d.Magnitude >= d3.min(magExtent) && +d.Magnitude <= d3.max(magExtent))){
                    // d3.select(this).style("fill", "#00A8E8");
                    d3.select(this).style("opacity", .8);
                    locations.push([d.Longitude, d.Latitude, d.Magnitude.toFixed(0)])                
                } else {
                    d3.select(this).style("opacity", .2);
                }
            }); 
            addBlastSites(locations);             
        }

    }

    function dragend(d){
        sliderInDrag = false;
        // queryPointsByXYRanges();          
        updateSliderPositions(); 
    }
    
    // function queryPointsByXYRanges(){
        
    //     var xRange = [+d3.selectAll('#vLine0').attr('x1'), +d3.selectAll('#vLine1').attr('x1')];
    //     var yRange = [+d3.selectAll('#hLine0').attr('y1'), +d3.selectAll('#hLine1').attr('y1')];
            
    //     var timeExtent = [getDateByX(xRange[0]), getDateByX(xRange[1])];
    //     var magExtent = [getMagByY(yRange[0]), getMagByY(yRange[1])];
        
    //     // var format = d3.time.format("%Y");
    //     // $('#yearDiv').text(format(d3.min(timeExtent)) + ' - ' + format(d3.max(timeExtent)));
    //     // console.log(format(d3.min(timeExtent)), format(d3.max(timeExtent)));
        
    //     var locations = [];
    //     d3.selectAll(".circle").each(function(d){
    //         // 
    //         if((d.DateTime >= d3.min(timeExtent) && d.DateTime <= d3.max(timeExtent) ) && (+d.Magnitude >= d3.min(magExtent) && +d.Magnitude <= d3.max(magExtent))){
    //             // d3.select(this).style("fill", "#00A8E8");
    //             d3.select(this).style("opacity", .8);
    //             locations.push([d.Longitude, d.Latitude, d.Magnitude.toFixed(0)])                
    //         } else {
    //             d3.select(this).style("opacity", .2);
    //         }
    //     }); 
    //     addBlastSites(locations); 
        
    // }

    var selectionLines = [
        {x1: 0, y1: 0, x2: 0, y2: height - margin.top, cursor: "w-resize", class: 'vLine'}, 
        {x1: 0, y1: 0, x2: 0, y2: height - margin.top, cursor: "w-resize", class: 'vLine'}, 
        {x1: 0, y1: 0, x2: width - margin.left - margin.right, y2: 0, cursor: "n-resize", class: 'hLine'}, 
        {x1: 0, y1: 0, x2: width - margin.left - margin.right, y2: 0, cursor: "n-resize", class: 'hLine'},   
    ];

    selectionLines.forEach(function(d, i){
        //drwa the vertical line    
        var selectionLine = svg.append('line')
            .attr({
                'x1': +d.x1,
                'y1': +d.y1,
                'x2': +d.x2,
                'y2': +d.y2
            })
            // .style("display", "none")
            .attr('stroke-width', '2')
            .style('opacity', 0.3)
            .attr("stroke", "#58C7B6")
            .attr('class', d.class)
            .attr('id', d.class + i % 2)
            .style("cursor", d.cursor)
            .call(drag);    
    });
    
    showCircleWithinCurrentExtent = function(config){
        var lonExtent = [config.coordMin[0], config.coordMax[0]];
        var latExtent = [config.coordMin[1], config.coordMax[1]];
        
        d3.selectAll(".circle").each(function(d){
            //cross international date line
            if(lonExtent[0] > 0 && lonExtent[1] < 0) {
                if( (+d.Longitude > lonExtent[0] || +d.Longitude < lonExtent[1]) && (+d.Latitude >= d3.min(latExtent) && +d.Latitude <= d3.max(latExtent))){
                    d3.select(this).attr("display", null);  
                } else {
                    d3.select(this).attr("display", "none"); 
                }
            } else {
                if((+d.Longitude > lonExtent[0] && +d.Longitude < lonExtent[1]) && (+d.Latitude >= d3.min(latExtent) && +d.Latitude <= d3.max(latExtent))){
                    d3.select(this).attr("display", null);  
                } else {
                    d3.select(this).attr("display", "none"); 
                }
            }
        });
    }
    
   showAllCircles = function(){
       d3.selectAll(".circle").attr("display", null);  
   }

});

function updateHash(data, view){  
    //data = [startYear, endYear, lowMag, highMag, lon, lat, lod]  
    var dataValues = (data) ? data.join('/') : '';
    var viewValues = (view) ? view.join('/') : '';
    var hash = '#' + dataValues + '/' + viewValues;
    window.location.hash = hash;
}

function parseHashData(){
    var hashData = window.location.href.split('#')[1].split('/');
    var chartViewData = hashData.slice(0, 4);
    var mapViewDataFromHash = hashData.slice(4, 7);
        
    if((!queryParams || !arraysEqual(queryParams, chartViewData)) && !sliderInDrag){
        queryParams = chartViewData;
        // console.log(queryParams);
        updateSliderPositions(queryParams);
        resetMapView(mapViewDataFromHash);
    }  
}

$(window).on('hashchange', function() { 
    if(!window.location.hash || window.location.hash == '' || window.location.hash == '#'){
        window.location.hash = initialHash;
        parseHashData();
    } else {
        parseHashData();
    }
});

function arraysEqual(arr1, arr2) {

    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(+arr1[i] !== +arr2[i])
            return false;
    }
    return true;
}

function getHashData(callback){
    var hashData = window.location.href.split('#')[1].split('/');
    var chartViewData = hashData.slice(0, 4);
    var mapViewDataFromHash = hashData.slice(4, 7);
    
    callback({
        hashData: hashData,
        chartViewData: chartViewData,
        mapViewData: mapViewDataFromHash
    });
}
