var toggleSideBar;

$(document).ready(function(){
    toggleSideBar = function(){
        
        var sidebarWidth, mapDivWidth;
        
        if( $('.meun-icon').hasClass('active')){
            sidebarWidth = '0px';
            mapDivWidth = '100%';            
        }
        else {
            sidebarWidth = '20%';
            mapDivWidth = '80%';
        }
        
        // console.log($('#mapDiv').css('width'));
        $('#sidebar').css("width", sidebarWidth);
        $('#mapDiv').css("width", mapDivWidth);
        
        $('.meun-icon').toggleClass('active');
    }
    
    $('.meun-icon').on('click', function(){
        toggleSideBar();
    })
});