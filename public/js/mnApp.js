angular.module('underscore', [])
    .factory('_', function() {
        return window._; // assumes underscore has already been loaded on the page
    });


angular.module('mnApp', ['ngTagsInput', 'underscore', 'ui.bootstrap'])

    .factory('$csrf', function () {
        var cookies = document.cookie.split('; ');
        for (var i=0; i<cookies.length; i++) {
            var cookie = cookies[i].split('=');
            if(cookie[0].indexOf('XSRF-TOKEN') > -1) {
                return cookie[1];
            }
        }
        return 'none';
    });