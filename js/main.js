// define global variables
var startDate = new Date(1963, 1, 2);
var endDate = new Date(2016, 4, 30);
var magMin = 1, magMax = 7;
var sliderInDrag = false;
var initialHash = '#1965/1980/4.0/7.0/0/50/2';
var showBlastsInMapExtent, showAllCircles;
var queryParams, updateSliderPositions;
var populateChartElements;

$(document).ready(function(){

    // Get the blasts data
    d3.csv("./data/blast-data.csv", function(error, data) {
        
        var parseDate = d3.time.format("%m/%d/%Y").parse;
        var colors = ['#B5004D', '#FF5300', '#FFFF00'];
            
        data.forEach(function(d) {
            d.DateTime = parseDate(d.DateTime);
            d.Magnitude = +d.Magnitude;
        });

        var radiusScale = d3.scale.linear()
            .domain([0, magMax])
            .range([1, 2]);  
            
        var colorScale = d3.scale.linear()
            .domain([2, 4, 6])
            .range(colors);
            
        populateChartElements = function(){
            
            //empty the svg container
            d3.select(".svg-container").remove();
            
            var chartContainerHeight = $('#chartDiv').height();
            var chartContainerWidth = $('#chartDiv').width();        
            
            // Set the dimensions of the canvas / graph
            var margin = {top: 30, right: 0, bottom: 10, left: 50},
                width = chartContainerWidth  - margin.left - margin.right - 5,
                height = chartContainerHeight - margin.top - margin.bottom - 5;
                            
            var selectionLines = [
                {x1: 0, y1: 0, x2: 0, y2: height - margin.top, cursor: "w-resize", class: 'vLine'}, 
                {x1: 0, y1: 0, x2: 0, y2: height - margin.top, cursor: "w-resize", class: 'vLine'}, 
                {x1: 0, y1: 0, x2: width - margin.left - margin.right, y2: 0, cursor: "n-resize", class: 'hLine'}, 
                {x1: 0, y1: 0, x2: width - margin.left - margin.right, y2: 0, cursor: "n-resize", class: 'hLine'},   
            ];

            // generate x and y scales
            var xScale = d3.time.scale()
                .domain([startDate, endDate])
                .range([0, width - margin.left - margin.right]);
                
            var yScale = d3.scale.linear()
                .domain([magMin, magMax])
                .range([(height - margin.top), 0]);

            // define the axes
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
                    return (d==1) ? '-' : '+';
                })
                .ticks(2)
                .tickPadding(8);
                // .innerTickSize(-(width - margin.left - margin.right));        
            
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

                var x = d3.event.x,
                    xMin = xScale(startDate),
                    xMax = xScale(endDate);
                    x = (x < xMin) ? xMin : x;
                    x = (x > xMax) ? xMax : x;
                
                var y = d3.event.y,
                    yMin = yScale(magMax),
                    yMax = yScale(magMin);
                    y = (y < yMin) ? yMin : y;
                    y = (y > yMax) ? yMax : y;
                
                // update position of sliders
                if(d3.select(this).attr('class') == 'vLine'){
                    d3.select(this)
                    .attr("x1", x)
                    .attr("x2", x);   
                } else {
                    d3.select(this)
                    .attr("y1", y)
                    .attr("y2", y);  
                }
                
                var selectionExtent = getSliderSelectionExtent();
                queryParams = [new Date(d3.min(selectionExtent[0])).getFullYear(), new Date(d3.max(selectionExtent[0])).getFullYear(), d3.min(selectionExtent[1]).toFixed(1), d3.max(selectionExtent[1]).toFixed(1)];
                updateHash(queryParams, mapViewData);         
            }
            
            function dragend(d){
                sliderInDrag = false;       
                updateSliderPositions(); 
            }            
            
            getSliderSelectionExtent = function(){
                var xRange = [+d3.selectAll('#vLine0').attr('x1'), +d3.selectAll('#vLine1').attr('x1')];
                var yRange = [+d3.selectAll('#hLine0').attr('y1'), +d3.selectAll('#hLine1').attr('y1')];
                var timeExtent = [getDateByX(xRange[0]), getDateByX(xRange[1])];
                var magExtent = [getMagByY(yRange[0]), getMagByY(yRange[1])];
                updateBillboard(timeExtent, magExtent);
                return [timeExtent, magExtent];
            }
            
            updateBillboard = function(timeExtent, magExtent){
                var formatYear = d3.time.format("%Y");
                var yearText = formatYear(d3.min(timeExtent)) + ' - ' + formatYear(d3.max(timeExtent));
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
                    //move slider to appropriate positions using data from hash
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
                    
                    var locations = [];
                    var selectionExtent = getSliderSelectionExtent();
                    
                    //filter circles in that chart are within the slider extent, then plot them on map
                    d3.selectAll(".circle").each(function(d){
                        if((d.DateTime >= d3.min(selectionExtent[0]) && d.DateTime <= d3.max(selectionExtent[0]) ) && (+d.Magnitude >= d3.min(selectionExtent[1]) && +d.Magnitude <= d3.max(selectionExtent[1]))){
                            d3.select(this).style("opacity", .8);
                            locations.push([d.Longitude, d.Latitude, d.Magnitude.toFixed(0)]);                
                        } else {
                            d3.select(this).style("opacity", .2);
                        }
                    }); 
                    addBlastSites(locations);             
                }
            }
            
            showBlastsInMapExtent = function(config){
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
            
            showAllBlasts = function(){
                d3.selectAll(".circle").attr("display", null);  
            }            
            
            // Adds the svg canvas
            var svg = d3.select("#chartDiv")
                .append("svg")
                    .attr('class', 'svg-container')
                    .attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                .append("g")
                    .attr('class', 'canvas-element')
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 
                            
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
                    .style('fill', colors[0]);      
                } else {
                    d3.select(this).style('fill', colors[2]);            
                }    
            });
            
            // create gradient line along y axis
            var yAxisGradientLine = svg.append('line')
                .attr({
                    'x1': -19.5,
                    'y1': 10,
                    'x2': -19.5,
                    'y2': height - margin.top -7
                })
                .attr('stroke-width', '2')
                .style('opacity', 1)
                .attr("stroke", "#998743")
                .attr('class', 'y-axis-gradient-line');
            
            //create gradient color encoding object to render yAxisGradientLine
            svg.append("linearGradient")
                .attr("id", "temperature-gradient")
                .attr("gradientUnits", "userSpaceOnUse")
                .attr("x1", 0).attr("y1", yScale(magMin))
                .attr("x2", 0).attr("y2", yScale(magMax))
                .selectAll("stop")
                    .data([
                        {offset: "0%", color: colors[0]},
                        {offset: "50%", color: colors[1]},
                        {offset: "100%", color: colors[2]}
                    ])
                .enter().append("stop")
                    .attr("offset", function(d) { return d.offset; })
                    .attr("stop-color", function(d) { return d.color; });                          

            //populate circles on chart represent balsts
            svg.selectAll("circle")
                .data(data).enter()
                .append("circle")
                .attr('class', 'circle')
                .attr("cx",function(d) {return xScale(d.DateTime);})
                .attr("cy",function(d) {return yScale(d.Magnitude);})
                .attr("r",function(d) {
                    return radiusScale(d.Magnitude);
                })
                .style("fill", function(d) {
                    return colorScale(+d.Magnitude);
                })
                .style("opacity", function(d) {
                    return 0.2;
                })
                .on('click', function(d){
                    zoomToBlastSite([d.Longitude, d.Latitude])
                })
                .on('mouseover', function(d){
                    d3.select(this)
                        .attr("r", 5)
                        .style("opacity", 1);
                    addBlastHighlightSites([d.Longitude, d.Latitude, d.DateTime, d.Magnitude]);    
                })
                .on('mouseout', function(d){
                    d3.select(this)
                        .attr("r", 2)
                        .style("opacity", 0.5);
                    map.getLayer('blastHighlightLayer').clear(); 
                    map.infoWindow.hide();
                });    
                
            //drwa the slider lines  
            selectionLines.forEach(function(d, i){
                var selectionLine = svg.append('line')
                    .attr({
                        'x1': +d.x1,
                        'y1': +d.y1,
                        'x2': +d.x2,
                        'y2': +d.y2
                    })
                    .attr('stroke-width', '2')
                    .style('opacity', 0.3)
                    .attr("stroke", "#58C7B6")
                    .attr('class', d.class)
                    .attr('id', d.class + i % 2)
                    .style("cursor", d.cursor)
                    .call(drag);    
            });  
        }
        
        populateChartElements();
    });
});    

function updateHash(data, view){  
    var dataValues = (data) ? data.join('/') : '';
    var viewValues = (view) ? view.join('/') : '';
    var hash = '#' + dataValues + '/' + viewValues;
    window.location.hash = hash;
}

function parseHashData(){    
    getHashData(function(d){
        if((!queryParams || !arraysEqual(queryParams, d.chartViewData)) && !sliderInDrag){
            queryParams = d.chartViewData;
            updateSliderPositions(queryParams);
            resetMapView(d.mapViewData);
        } 
    })
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

function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length){
        return false;
    }
    for(var i = arr1.length; i--;) {
        if(+arr1[i] !== +arr2[i]) {
            return false;
        }  
    }
    return true;
}

