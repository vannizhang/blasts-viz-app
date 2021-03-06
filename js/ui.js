var toggleSideBar;
var showSideBar = false;

var bookmarks = [
    {name: 'Just the Giants', hash: '#1963/2016/4.5/7.0/-8.83/26.04/1'},
    {name: 'Nevada’s Atomic Age', hash: '#1965/1992/1.9/6.7/-116.25/37.13/9'},
    {name: 'Coalscape', hash: '#1968/1971/3.6/5.9/-114.83/49.77/13'},
    {name: 'Mt St Helens’ Shadow', hash: '#1980/2011/1.0/3.2/-122.37/46.32/10'},
    {name: 'Centralia (WA) Triplets', hash: '#1980/2011/1.0/4.3/-122.80/46.74/11'},
    {name: 'Semipalatinsk Polygon', hash: '#1963/1990/4.2/6.7/78.44/49.83/8'},
    {name: 'Soviet Atomic Archipelago', hash: '#1964/1991/4.2/7.1/54.27/72.50/5'},
    {name: 'American Atomic Archipelago', hash: '#1965/1972/4.2/7.1/178.98/51.36/8'},
    {name: 'Neighbor Standoff', hash: '#1974/1999/4.4/5.4/68.04/27.94/5'},
    {name: 'Nuclear Lop Nur', hash: '#1966/1997/4.4/6.8/88.61/41.46/6'},
    {name: 'Moruroa Atol Test bed', hash: '#1968/1996/4.3/6.2/-138.96/-21.97/9'},
];

$(document).ready(function(){
    
    toggleSideBar = function(){
        var sidebarWidth = ($('.meun-icon').hasClass('active')) ? '0' : '340px';    
        $('#sidebar').css("width", sidebarWidth);
        $('#navbar').css("right", sidebarWidth);
        $('#attribution').css("right", sidebarWidth);
        $('.meun-icon').toggleClass('active');
        $('#sidebar').toggleClass('hide');
    }
    
    $('.meun-icon').on('click', function(){
        toggleSideBar();
    });
    
    //populate bookmarks
    bookmarks.forEach(function(d, i){
        var bookmark = $('<div id="bookmark-' + i + '" class="bookmark-div">' + d.name + '</div>');
        $('#siderbar-bookmark-wrapper').append(bookmark);
    });
    
    $('.bookmark-div').on('click', function(){
        var index = this.id.split('-')[1];
        window.location.hash = bookmarks[index].hash;
    })
    
    //add twitter share box
    $('.twitter-popup').on('click', function(event) {
        var fromYear, toYear;
        getHashData(function(d){
           fromYear = d.chartViewData[0];
           toYear = d.chartViewData[1];
        });
        var message = 'Check out these man-made explosions from ' + fromYear + ' to ' + toYear;
        var width  = 500,
            height = 300,
            left   = ($(window).width()  - width)  / 2,
            top    = ($(window).height() - height) / 2,
            url    = 'http://twitter.com/intent/tweet?hashtags=BlastMap&text=' + message + '&url=' + encodeURIComponent(window.location.href);
            opts   = 'status=1' +
                    ',width='  + width  +
                    ',height=' + height +
                    ',top='    + top    +
                    ',left='   + left;
        
        window.open(url, 'twitter', opts);
    
        return false;
    }); 
    
    // add hash change event listener
    $(window).on('hashchange', function() { 
        if(!window.location.hash || window.location.hash == '' || window.location.hash == '#'){
            window.location.hash = initialHash;
        } 
        parseHashData();
    });   
    
    // add resize end event listener
    var rtime;
    var timeout = false;
    var delta = 200;
    
    $(window).resize(function() {
        rtime = new Date();
        if (timeout === false) {
            timeout = true;
            setTimeout(resizeend, delta);
        }
    });

    function resizeend() {
        if (new Date() - rtime < delta) {
            setTimeout(resizeend, delta);
        } else {
            timeout = false;
            populateChartElements();
            updateSliderPositions(queryParams); 
        }               
    } 
    
    $('.banner').on('click', function(){
       $('.banner').hide(); 
    });       
    
    $('#closeWelcomeDiv').on('click', function(){
       $('.banner').hide(); 
    });    
    
    console.info('Hi there, want to see the codes behind this app? it\'s on Github: https://github.com/vannizhang/blasts-viz-app' + '\n' + 'happy coding!');
});