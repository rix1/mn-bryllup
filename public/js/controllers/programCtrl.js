

angular.module('mnApp')
    .controller('programCtrl', ['$scope',
        function ($scope) {

            $scope.weddingProgram = [{"day":"Fredag","dressCode":"Uformelt/pent","activities":[{"name":"Velkomstdrink","details":{"desc":"Vi ønsker velkommen til bryllupshelg!","time":"18.30","place":"Holckenhavn Slot"}},{"name":"Middag","details":{"desc":"Serveres fra grillen. Vi satser på fint og varmt sensommer vær, og middagen vil da serveres ute i Borregården! Etter middagen legger vi opp til ”fredagshygge” på stranden nedenfor slottet, så det kan være lurt å ta med seg en ekstra genser eller lignende.","place":"Borregården","time":"19.00"}}]},{"day":"Lørdag","dressCode":"Smoking/mørk dress","activities":[{"name":"Vielse","details":{"desc":"Gjestene bes møte 30 minutter før.","time":"14.00","place":"Slotskapellet"}},{"name":"Kake og champagne","details":{"time":"15.00"}},{"name":"Bryllupsmiddag","details":{"time":"18.00","place":"Riddersalen"}},{"name":"Fest!","details":{"time":"00.00","place":"Riddersalen"}}]},{"day":"Søndag","dressCode":"Uformelt","activities":[{"name":"Felles frokost","details":{"desc":"Vi avslutter helgen med en felles frokost før hjemreise.","time":"10.00","place":"Holckenhavn Slot"}}]}];
        }
    ]);