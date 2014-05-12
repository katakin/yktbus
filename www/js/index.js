// the Map object, default center and zoom settings
var MAP;
var DEFAULT_LAT = 62.031;
var DEFAULT_LNG = 129.722;
var DEFAULT_ZOOM = 13;
var MIN_ZOOM = 11;
var MAX_ZOOM = 17;

$(document).on("mobileinit", function(){
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;
    $.mobile.phonegapNavigationEnabled = true;
    $.mobile.defaultDialogTransition = "pop";
    $.mobile.defaultPageTransition = "none";

    $.mobile.loader.prototype.options.text = "loading";
    $.mobile.loader.prototype.options.textVisible = true;
});

$(window).bind('orientationchange pageshow pagechange resize', resizeMapIfVisible);

//$(document).on( "swipeleft", function(e){
//    var nextpage = '#' + $.mobile.activePage.next('div[data-role="page"]')[0].id
//    if (nextpage.length > 0) {
//        $(":mobile-pagecontainer").pagecontainer( "change", nextpage, {reverse: true});
//    }
//});
//
//$(document).on( "swiperight", function(e){
//    var prevpage = '#' + $.mobile.activePage.prev('div[data-role="page"]')[0].id
//    if (prevpage.length > 0) {
//        $(":mobile-pagecontainer").pagecontainer( "change", prevpage, {reverse: true});
//    }
//});

function initialize() {
    if ( typeof(cordova) !== 'undefined' || typeof(phonegap) !== 'undefined' ) {
        document.addEventListener("deviceready", onReady, false);
    } else {
        $(document).ready(onReady);
    }
}

function onReady() {
    // pre-render the pages so we don't have that damnable lazy rendering thing messing with it
    $('div[data-role="page"]').page();
    initMap();
}

function initMap() {
    DG.then(function() {
        MAP = new DG.Map('myMap', {
            zoomControl: false,
            fullscreenControl: false,
            minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, zoom: DEFAULT_ZOOM,
            center: DG.latLng(DEFAULT_LAT, DEFAULT_LNG)
        });
        MAP.addControl(DG.control.zoom({position: 'bottomleft'}));
        MAP.addControl(DG.control.location({position: 'bottomleft'}));
        
        DG.tileLayer('img/mapTiles/{z}/{x}/{y}.png', {
            minZoom: MIN_ZOOM,
            maxZoom: 14
        }).addTo(MAP);
        
        DG.tileLayer('http://{s}.maps.2gis.ru/tiles?x={x}&y={y}&z={z}', {
            minZoom: 15,
            maxZoom: MAX_ZOOM,
            subdomains: ['tile0','tile1','tile2','tile3','tile4','tile5','tile6','tile7','tile8','tile9']
        }).addTo(MAP);
        
        var stations = new DG.LayerGroup();
        $.each(bus_station, function(l, val){
            var station = new DG.marker([bus_station[l].lat, bus_station[l].lng], {icon: new DG.Icon({iconUrl: "img/station.png", iconSize: [15,15]}), opacity: 0, riseOnHover: true});
            station.on('click',function(e){
                if (MAP.getZoom() > 12) {
                    navigator.notification.confirm(
                        'Выбрать ' + bus_station[l].name,
                        onConfirm,
                        'Уведомление',
                        ['Да','Нет']
                    );
                }
            });
            stations.addLayer(station);
        });
        stations.addTo(MAP);
        
        MAP.on('zoomend', function(e){
           if (MAP.getZoom() <= 13) {
               stations.eachLayer(function (layer) {layer.setOpacity(0);});
           } else {
               stations.eachLayer(function (layer) {layer.setOpacity(1);});
           }
        });
    });
}

function onConfirm(buttonIndex) {
}

function resizeMapIfVisible() {
    if (!  $("#myMap").is(':visible') ) return;
    // var page    = $(":jqmData(role='page'):visible");
    // var header  = $(":jqmData(role='header'):visible");
    // var content = $(":jqmData(role='content'):visible");
    // var viewportHeight = $(window).height();
    // page.height(contentHeight + 1);
    // $(":jqmData(role='content')").first().height(contentHeight);
    $("#myMap").height($(window).height() - $(".ui-content").outerHeight() + $(".ui-content").height());
    if (MAP) MAP.invalidateSize();
}