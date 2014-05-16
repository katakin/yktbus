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
    
//    var rasX = tile2long(56406*2,17)-tile2long(56405*2+1,17);
//    var rasY = tile2lat(18355*2+1,17)-tile2lat(18356*2,17);
//    var bol;
//    for(var x=28174*2*2-4;x<=28203*2*2;x++)
//    {
//        for(var y=9103*2*2-4;y<=9178*2*2;y++)
//        {
//            bol = false;
//            var pl = [];
//            $.each(bus_station, function(l, val)
//            {
//                   if (bus_station[l].lat <= tile2lat(y,17) && bus_station[l].lat >= (tile2lat(y,17) - rasY) && bus_station[l].lng >= tile2long(x,17) && bus_station[l].lng <= (tile2long(x,17) + rasX))
//                   {
//                       if (!bol) {console.log(x + " " + y); bol=true;}
//                       pl.push(l);
//                   }
//            });
//            if (bol) console.log(pl);
//        }
//    }
}

var stations = [];

function initMap() {
    DG.then(function() {
        MAP = new DG.Map('myMap', {
            updateWhenIdle: true,
            unloadInvisibleTiles: true,
            fadeAnimation:true,
            zoomAnimation:true,
            zoomControl: false,
            fullscreenControl: false,
            minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, zoom: DEFAULT_ZOOM,
            center: DG.latLng(DEFAULT_LAT, DEFAULT_LNG)
        });
        MAP.addControl(DG.control.zoom({position: 'topright'}));
        MAP.addControl(DG.control.location({position: 'topright'}));
        
        var mytiles1 = DG.tileLayer('img/mapTiles/{z}/{x}/{y}.png', {
            minZoom: MIN_ZOOM,
            maxZoom: 14
        }).addTo(MAP);
        
        var mytiles2 = DG.tileLayer('http://{s}.maps.2gis.ru/tiles?x={x}&y={y}&z={z}', {
            minZoom: 15,
            maxZoom: MAX_ZOOM,
            subdomains: ['tile0','tile1','tile2','tile3','tile4','tile5','tile6','tile7','tile8','tile9']
        }).addTo(MAP);
        
        MAP.on('click', function(e){
            DG.popup()
            .setLatLng(e.latlng)
            .setContent("Координаты точки: " + e.latlng.toString())
            .openOn(MAP);
        });
            
        MAP.on('zoomend', function(e){
            for(val in stations) {
               stations[val].clearLayers();
            }
            stations = [];
        });
        
        mytiles1.on('tileload', function(e){
            var tile = (/mapTiles\/(.*\/.*\/.*).png/gm).exec(e.tile.src)[1].replace(/&.=/g, '/');
            var title = tile.split("/");
            var z = title[title.length-3];
            var x = title[title.length-2];
            var y = title[title.length-1].split(".")[0];

            if (!$.isEmptyObject(tile_station[z][x + " " + y]))
            {
                stations[x + " " + y] = new DG.LayerGroup().addTo(MAP);
                $.each(tile_station[z][x + " " + y], function(l, val)
                {
                    var station = new DG.marker([bus_station[val].lat, bus_station[val].lng], {icon: new DG.Icon({iconUrl: "img/station.png", iconSize: [15,15]}), riseOnHover: true});
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
                    stations[x + " " + y].addLayer(station);
                });
                
            }
        });
        
        mytiles1.on('tileunload', function(e){
            var tile = (/mapTiles\/(.*\/.*\/.*).png/gm).exec(e.tile.src)[1].replace(/\//g, '/');
            var title = tile.split("/");
            var x = title[title.length-2];
            var y = title[title.length-1].split(".")[0];
            if (!$.isEmptyObject(stations[x + " " + y]))
            {
                stations[x + " " + y].clearLayers();
            }
        });

        mytiles2.on('tileload', function(e){
            var tile = (/maps.2gis.ru\/tiles\?x=(.*&y=.*&z=.*)/gm).exec(e.tile.src)[1].replace(/&.=/g, '/');
            var title = tile.split("/");
            var x = title[title.length-3];
            var y = title[title.length-2];
            var z = title[title.length-1].split(".")[0];
            if (!$.isEmptyObject(tile_station[z][x + " " + y]))
            {
                stations[x + " " + y] = new DG.LayerGroup().addTo(MAP);
                $.each(tile_station[z][x + " " + y], function(l, val) {
                    var station = new DG.marker([bus_station[val].lat, bus_station[val].lng], {icon: new DG.Icon({iconUrl: "img/station.png", iconSize: [15,15]}), riseOnHover: true});
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
                    stations[x + " " + y].addLayer(station);
                });

            }
        });

        mytiles2.on('tileunload', function(e){
            var tile = (/maps.2gis.ru\/tiles\?x=(.*&y=.*&z=.*)/gm).exec(e.tile.src)[1].replace(/&.=/g, '/');
            var title = tile.split("/");
            var x = title[title.length-3];
            var y = title[title.length-2];
            if (!$.isEmptyObject(stations[x + " " + y]))
            {
                stations[x + " " + y].clearLayers();
            }
        });
    });
}

function onConfirm(buttonIndex) {
}

function resizeMapIfVisible() {
    if (!  $("#myMap").is(':visible') ) return;

    $("#myMap").height($(window).height() - $(".ui-content").outerHeight() + $(".ui-content").height());
    if (MAP) MAP.invalidateSize();
}

function tile2long(x,z) {
    return (x/Math.pow(2,z)*360-180);
}
function tile2lat(y,z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}