angular.module('mnApp', [])

    .controller('rsvpCtrl', [ '$scope', '$http',
        function ($scope, $http) {

            $scope.showForm = true;

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

            var request = $http({
                method: "post",
                url: "http://localhost:8880/",
                data:{
                    name: "Gunnar",
                    alder: "Frank12"
                }
            });
            
            request.success(function () {
                    console.log("YEAA");
            })
        }]);