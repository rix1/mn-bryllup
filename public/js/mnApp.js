angular.module('mnApp', [])

    .controller('rsvpCtrl', [ '$scope',
        function ($scope) {

            $scope.showForm = false;

            $scope.heading = 'RSVP';
            $scope.area = '';

                $scope.access = function (code) {

                // TODO: Valudate code

                console.log("Code sumbitted: " + code);
                $scope.showForm = true;
            };

            $scope.submit = function (form, area) {
                form.area = area;
                console.log(form);
            };
            
        }]);