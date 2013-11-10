angular.module('TCWS.tools.symbology', ['TCWS.symbology'])
    .run(function($rootScope) {
        $rootScope.startSymbologyView = 'polygon';
    })


    .controller('SymbologyCtrl', ['$scope',function ($scope) {
        $scope.currentSymbologyView = $scope.startSymbologyView;
        $scope.symbologyView = '/app/tools/symbology/symbology_' + $scope.currentSymbologyView + '.tpl.html';

        $scope.selectSymbologyView = function(type){
            $scope.currentSymbologyView = type;
            $scope.symbologyView = '/app/tools/symbology/symbology_' + $scope.currentSymbologyView + '.tpl.html';
        };
    }])

    .controller('SymbologyPointCtrl', ['$scope',function ($scope) {

    }])

    .controller('SymbologyLineCtrl', ['$scope',function ($scope) {

    }])

    .controller('SymbologyPolygonCtrl', ['$scope','DataStore','Editor','Symbology',function ($scope,DataStore,Editor,Symbology) {

        var polygonGroupSymbology = Symbology.getPolygonGroupSymbology();

        $scope.currentStyle = null;

        var groupSymbologyList = [];
        var polygonSymbologyList = [];


        for (var prop in polygonGroupSymbology) {
            if (polygonGroupSymbology.hasOwnProperty(prop)) {
                groupSymbologyList.push({id:polygonGroupSymbology[prop].groupId, text : polygonGroupSymbology[prop].groupName})
            }
        }

        $scope.selectOptionsGroupSymbology = {
            allowClear:true,
            data: groupSymbologyList
        };

        $scope.selectOptionsPolygonSymbology = {
            allowClear:true,
            data: polygonSymbologyList
        };

        $scope.$watch('groupSymbology', function (newValue, oldValue) {
            if(newValue){

                $scope.polygonSymbologyList = [];
                for (var prop in polygonGroupSymbology[$scope.groupSymbology.id].symbologys) {
                    if (polygonGroupSymbology[$scope.groupSymbology.id].symbologys.hasOwnProperty(prop)) {
                        $scope.polygonSymbologyList.push(
                            {
                                id : prop,
                                text : polygonGroupSymbology[$scope.groupSymbology.id].symbologys[prop].name
                            }
                        );
                    }
                }

                //Hack because options get not updated
                $('#polygonSymbology').select2({data : $scope.polygonSymbologyList})
            }
            else{
                $scope.spatialColumnList = [];
                $('#polygonSymbology').select2({data : []})
            }
        });

        $scope.$watch('polygonSymbology', function (newValue, oldValue) {
            if(newValue){
                $scope.currentStyle = polygonGroupSymbology[$scope.groupSymbology.id].symbologys[$scope.polygonSymbology.id];
            }
            else{
                $scope.currentStyle = null;
            }
        });

        //layer input

        var layerShortList = Editor.getLayerListShort();

        var layerList = [];
        $scope.columnList = [];

        var length = layerShortList.length;
        for (var i=0;i<length;i++)
        {
            layerList.push({id:layerShortList[i].id,text:layerShortList[i].name});
        }

        $scope.selectOptionsLayer = {
            allowClear:true,
            data: layerList
        };

        $scope.selectOptionsColumn = {
            allowClear:true,
            data: $scope.columnList
        };

        $scope.$watch('layer', function (newValue, oldValue) {
            if(newValue){
                $scope.layerData = DataStore.getLayer(newValue.id);

                $scope.columnList = [];
                for (var prop in $scope.layerData.labels) {
                    if ($scope.layerData.labels.hasOwnProperty(prop)) {
                        $scope.columnList.push({id:prop,text:$scope.layerData.labels[prop]});
                    }
                }

                //Hack because options get not updated
                $('#columnInput').select2({data : $scope.columnList})
            }
            else{
                $scope.columnList = [];
                $('#columnInput').select2({data : []})
            }
        });

        $scope.applySymbology = function(){

            $scope.currentStyle.variableSymbology[0].column = $scope.column.id;
            for (var prop in polygonGroupSymbology[$scope.groupSymbology.id].groupStyle) {
                if (polygonGroupSymbology[$scope.groupSymbology.id].groupStyle.hasOwnProperty(prop)) {

                    if(!$scope.currentStyle.style[prop]){
                        $scope.currentStyle.style[prop] = polygonGroupSymbology[$scope.groupSymbology.id].groupStyle[prop];
                    }

                }
            }

            Editor.applySymbology($scope.layer.id,$scope.currentStyle)
        };


    }])

    .controller('SymbologyTypoCtrl', ['$scope',function ($scope) {

    }]);