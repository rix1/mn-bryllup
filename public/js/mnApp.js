angular.module('mnApp', ['ngTagsInput'])

    .controller('rsvpCtrl', [ '$scope', '$http', '$timeout',
        function ($scope, $http, $timeout) {

            $scope.showForm = true;
            $scope.names = [];

            $scope.selectA = "";
            $scope.selectB = "";

            $scope.selected = function (val) {
                console.log(val);
                if(val == 'a'){
                    $scope.positive = true;
                    $scope.negative = false;
                    $scope.selectA = "btn-selected";
                    $scope.selectB = "";
                }

                if(val == 'b'){
                    $scope.positive = false;
                    $scope.negative = true;
                    $scope.selectB = "btn-selected";
                    $scope.selectA = "";
                }
            };

            $scope.area = '';
            //$scope.error = '';

            $scope.access = function (code) {

                // TODO: Valudate code

                console.log("Code sumbitted: " + code);
                $scope.showForm = true;
            };

            $scope.testSecret = function(token){
                console.log("testing token");

                var test = {token: token};

                $http.post('/', test).success(function () {
                    console.log("Token accepted");
                    $scope.showForm = true;
                    $scope.token = token;
                }).error(function () {
                    $scope.error = "Feil kode dessverre";
                    $timeout(function() {
                        $scope.error = "";
                    }, 3000);
                });
            };

            $scope.submit = function (form, area) {
                form.area = area;
                console.log(form);

                $http.post('/', form).success(function () {
                    console.log("Form posted");
                }).error(function () {
                    $scope.loginMsg = 'Wrong credentials, try again.';
                });
            };
        }])

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