function initialize() {
    if ( typeof(cordova) !== 'undefined' || typeof(phonegap) !== 'undefined' ) {
        document.addEventListener("deviceready", onReady, false);
    } else {
        $(document).ready(onReady);
    }
}

function onReady() {
}