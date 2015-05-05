var underscore = angular.module('underscore', []);
underscore.factory('_', function() {
    return window._; // assumes underscore has already been loaded on the page
});


angular.module('mnApp', ['ngTagsInput', 'underscore'])

    .controller('rsvpCtrl', [ '$scope', '$http', '$timeout', '_',
        function ($scope, $http, $timeout, _) {

            $scope.program = [{"day":"Fredag","dressCode":"Uformelt/pent","activities":[{"name":"Velkomstdrink","details":{"desc":"Vi ønsker velkommen til bryllupshelg","time":"18.30","place":"Holckenhavn Slot"}},{"name":"Middag","details":{"desc":"Serveres fra grillen. Vi satser på fint og varmt sensommer vær, og middagen vil da serveres ute i Borregården! Etter middagen legger vi opp til ”fredagshygge” på stranden nedenfor slottet, så det kan være lurt å ta med seg en ekstra genser eller lignende.","place":"Borregården","time":"19.00"}}]},{"day":"Lørdag","dressCode":"Smoking/mørk dress","activities":[{"name":"Vielse","details":{"desc":"Gjestene bes møte 30 minutter før","time":"14.00","place":"Slotskapellet"}},{"name":"Kake og champagne","details":{"time":"15.00"}},{"name":"Bryllupsmiddag","details":{"time":"18.00","place":"Riddersalen"}},{"name":"Fest","details":{"time":"00.00","place":"Riddersalen"}}]},{"day":"Søndag","dressCode":"","activities":[{"name":"Felles frokost","details":{"desc":"Vi avslutter helgen med en felles frokost før hjemreise","time":"10.00","place":"Holckenhavn Slot"}}]}];

            $scope.showForm = false;
            $scope.showValidation = true;
            $scope.participants = {};
            $scope.sent = false;
            $scope.selectA = "";
            $scope.selectB = "";
            $scope.form = {};
            $scope.areaError = '';
            $scope.dayError = '';
            $scope.validationError = '';

            $scope.selected = function (val) {
                $scope.form.email = "";
                $scope.form.name = "";
                $scope.dayError = '';
                $scope.emailError = '';
                $scope.areaError = '';
                $scope.area = '';
                $scope.participants = [];

                //console.log(val);
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

            $scope.testSecret = function(token){
                //console.log("testing token");

                var test = {token: token};

                $http.post('/token/', test).success(function () {
                    //console.log("Token accepted");
                    $scope.showForm = true;
                    $scope.token = token;
                    $scope.validationError = '';
                    $scope.showValidation = false;
                }).error(function (data, status, headers, config) {

                    if (status == 403) {
                        $scope.validationError = 'Wops, her gikk noe galt. Last inn siden på nytt';
                    }else {
                        $scope.validationError = "Feil kode dessverre";
                    }
                    $timeout(function() {
                        $scope.validationError = "";
                    }, 3000);
                });
            };


            $scope.submitForm = function (area) {


                $scope.area = area;

                $scope.error = false;

                if($scope.area.length > 500) { // too big
                    $scope.areaError = "Wops, du har skrevet for langt!"
                    $scope.errorArea = true;
                }else{
                    $scope.errorArea = false;
                    $scope.areaError = '';
                }

                if(!$scope.form.email){
                    $scope.emailError = "Ikke gyldig epost-addresse";
                    $scope.errorEmail = true;
                }else{
                    $scope.errorEmail = false;
                    $scope.emailError = '';
                }

                if($scope.participants.length > 0){
                    $scope.errorPart = false;
                    $scope.partError = '';
                }else{
                    $scope.partError = "Du må legge til i hvert fall én deltager";
                    $scope.errorPart = true;

                    $timeout(function() {
                        $scope.partError = "";
                    }, 2000);

                }

                if(!testDays()){
                    $scope.dayError = "En eller flere deltagere står ikke oppført på noen dag. Fjern dem fra listen dersom de ikke kan delta.";
                    $scope.errorDay = true;
                }else{
                    $scope.errorDay = false;
                    $scope.dayError = '';
                }

                if(!$scope.form.name) {
                    $scope.nameError = "Du glemte visst navnet ditt";
                    $scope.errorName = true;
                }else{
                    $scope.nameError = "";
                    $scope.errorName = false;
                }

                if($scope.positive && !$scope.errorEmail && !$scope.errorArea && !$scope.errorDay){ // means that the person is attending
                    //console.log("lets do business");

                    var payload = {
                        token: $scope.token,
                        email: $scope.form.email,
                        people: $scope.participants,
                        msg: $scope.area,
                        hotel: $scope.form.hotel
                    };

                    //console.log(payload);

                    $http.post('/accept/', payload).success(function () {
                        $scope.showForm = false;
                        $scope.showValidation = false;
                        $scope.showSucccess = true;
                    }).error(function (data, status, headers, config) {
                        //console.log(status);
                        if (status == 400) {
                            $scope.areaError = 'What? Det er noe galt med feltene. Prøv igjen.';
                            $scope.errorArea = true;
                        } else if (status == 401) {
                            $scope.areaError = data + '. Hvis problemet vedvarer, send epost til martine.nikolai@gmail.com ';
                            $scope.errorArea = true;
                        } else if (status == 403) {
                            $scope.areaError = 'Wops, her gikk noe feil. Last inn siden på nytt';
                            $scope.errorArea = true;
                        } else {
                            $scope.areaError = 'Feil på serveren. Last inn siden på nytt. Hvis problemet vedvarer, send en mail til martine.nikolai@gmail.com';
                            //$scope.errorArea = true;
                            //$scope.area = JSON.stringify(payload.email) + JSON.stringify(_.flatten(payload.people)) + JSON.stringify(payload.msg);
                        }
                    });


                }else if($scope.negative && !$scope.errorName && !$scope.errorEmail) { // means that the person is not attending
                    //console.log("Someone is not showing up...");

                    var payload = {
                        token: $scope.token,
                        email: $scope.form.email,
                        name: $scope.form.name
                    };
                    $http.post('/decline/', payload).success(function () {
                        $scope.showForm = false;
                        $scope.showValidation = false;
                        $scope.showSucccess = true;
                    }).error(function (data, status, headers, config) {
                        //console.log(status);
                        if(status == 400){
                            $scope.emailError = 'Prøver du å hacke meg? Det er noe galt med feltene, prøv igjen.';
                            $scope.errorEmail = true;
                        }else if(status == 401){
                            $scope.emailError = data +'. Hvis problemet vedvarer, send epost til martine.nikolai@gmail.com ';
                            $scope.errorEmail = true;
                        }else if (status == 403) {
                            $scope.emailError = 'Wops, her gikk noe feil. Last inn siden på nytt';
                            $scope.errorEmail = true;
                        }else{
                            $scope.emailError = 'Feil på serveren. Hvis problemet vedvarer, send epost til martine.nikolai@gmail.com ';
                            $scope.errorEmail = true;
                        }
                    });
                }else{
                    // What.jpg
                }
            };

            var testDays = function () {
                for(var i in $scope.participants){
                    if($scope.participants[i].participate && _.some($scope.participants[i].participate)){
                        // Do nothing
                    }else{
                        return false;
                    }
                }
                return true;
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