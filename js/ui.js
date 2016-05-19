var toggleSideBar;
var bookmarks = [
    {name: 'Nevada’s Atomic Age', hash: '#1965/1992/1.9/6.7/-116.25/37.13/9'},
    {name: 'Sparwood BC coal', hash: '#1968/1976/3.6/5.9/-116.40/50.38/7'},
    {name: 'Mt St Helens’ Shadow', hash: '#1980/2011/1.0/3.2/-122.37/46.32/10'},
    {name: 'Centralia (WA) Triplets', hash: '#1980/2011/1.0/4.3/-122.80/46.74/11'},
    {name: 'Semipalatinsk Polygon', hash: '#1963/1990/4.2/6.7/78.44/49.83/8'},
    {name: 'Soviet Atomic Archipelago', hash: '#1964/1991/4.2/7.1/54.27/72.50/5'},
    {name: 'American Atomic Archipelago', hash: '#1965/1972/4.2/7.1/178.98/51.36/8'},
    {name: 'Neighbor Standoff', hash: '#1974/1999/4.4/5.4/68.04/27.94/5'},
    {name: 'Nuclear Lop Nur', hash: '#1966/1996/4.4/6.8/88.65/41.59/8'},
    {name: 'Moruroa Atol Test bed', hash: '#1968/1996/4.3/6.2/-138.96/-21.97/9'},
]

$(document).ready(function(){
    toggleSideBar = function(){
        
        var sidebarWidth, mapDivWidth;
        
        if( $('.meun-icon').hasClass('active')){
            sidebarWidth = '0';          
        }
        else {
            sidebarWidth = '340px';
        }
        
        $('#sidebar').css("width", sidebarWidth);
        $('#mapDiv').css("right", sidebarWidth);
        
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
        console.log(bookmarks[index]);
        window.location.hash = bookmarks[index].hash;
    })
    
    //add twitter share box
    $('.twitter-popup').on('click', function(event) {
        var fromYear, toYear;
        getHashData(function(d){
           fromYear = d.chartViewData[0];
           toYear = d.chartViewData[1];
        });
        console.log(window.location.href);
        var message = 'Blast Map! Check out these man-made explosions from ' + fromYear + ' to ' + toYear;
        var width  = 500,
            height = 300,
            left   = ($(window).width()  - width)  / 2,
            top    = ($(window).height() - height) / 2,
            url    = 'http://twitter.com/intent/tweet?text=' + message + '&url=' + encodeURIComponent(window.location.href);
            opts   = 'status=1' +
                    ',width='  + width  +
                    ',height=' + height +
                    ',top='    + top    +
                    ',left='   + left;
        
        window.open(url, 'twitter', opts);
    
        return false;
    });    
    
    
});