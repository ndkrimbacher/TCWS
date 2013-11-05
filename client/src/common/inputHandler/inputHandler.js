'use strict';

angular.module('TCWS.inputHandler', [])

    .factory('InputHandler', ['$http',function ($http) {
        // Service logic

        var getFileData = function(layerInfo){
            return $http({method: 'GET', url: layerInfo.path}).then(function(result){
                return result.data;
            });
        };

        var parseGMLFileData = function(fileData){
            var parser =  new ol.parser.ogc.GML_v2({readOptions:{axisOrientation: 'en'}});
            return parser.readFeaturesFromString(fileData);
        };

        var parseJSONstatFileData = function(fileData,param){
            var dimensionConfig = param.dimensionConfig;
            var datasetNumber = param.datasetNumber;

            var jsonStatTable = JSONstat(fileData).Dataset(datasetNumber).toTable( { type : "arrobj", content: "id" });

            var oneDimensionalIds = {};
            for (var prop in dimensionConfig) {
                if (dimensionConfig.hasOwnProperty(prop)) {
                    if(dimensionConfig[prop] == 'h'){
                        var horizontalDimension = prop;
                        var horizontalIds = JSONstat(fileData).Dataset(datasetNumber).Dimension(prop).id;
                    }
                    else if(dimensionConfig[prop] == 'v'){
                        var verticalDimension = prop;
                        var verticalIds = JSONstat(fileData).Dataset(datasetNumber).Dimension(prop).id;
                    }
                    else{
                        oneDimensionalIds[prop] = JSONstat(fileData).Dataset(datasetNumber).Dimension(prop).id[dimensionConfig[prop]];
                    }

                }
            }

            var data = {};

            var isData = true;
            var length = jsonStatTable.length;
            for (var i=0;i<length;i++)
            {
                for (var prop in oneDimensionalIds) {
                    if (oneDimensionalIds.hasOwnProperty(prop)) {
                        if(jsonStatTable[i][prop] != oneDimensionalIds[prop]){
                            isData = false;
                            break;
                        }
                    }
                }
                if(isData){
                    if(!data[jsonStatTable[i][verticalDimension]]) data[jsonStatTable[i][verticalDimension]] = {};
                    data[jsonStatTable[i][verticalDimension]][jsonStatTable[i][horizontalDimension]] = jsonStatTable[i].value;
                }
                isData = true;
            }

            var resultData = [];

            for (var prop in data) {
                if (data.hasOwnProperty(prop)) {

                    resultData.push(data[prop]);

                    resultData[resultData.length-1][verticalDimension] = JSONstat(fileData).Dataset(datasetNumber).__tree__.dimension[verticalDimension].category.label[prop];
                    for (var prop in oneDimensionalIds) {
                        if (oneDimensionalIds.hasOwnProperty(prop)) {
                            resultData[resultData.length-1][prop] = JSONstat(fileData).Dataset(datasetNumber).__tree__.dimension[prop].category.label[oneDimensionalIds[prop]];
                        }
                    }
                }
            }

            var labels = {};
            var length = horizontalIds.length;
            for (var i=0;i<length;i++)
            {
                labels[horizontalIds[i]] = JSONstat(fileData).Dataset(datasetNumber).__tree__.dimension[horizontalDimension].category.label[horizontalIds[i]];
            }

            labels[verticalDimension] = JSONstat(fileData).Dataset(datasetNumber).Dimension(verticalDimension).label;

            for (var prop in oneDimensionalIds) {
                if (oneDimensionalIds.hasOwnProperty(prop)) {
                    labels[prop] =  JSONstat(fileData).Dataset(datasetNumber).Dimension(prop).label;
                }
            }

            return {data: resultData, labels : labels};
        };

        // Public API here
        return {
            getDataFromFile : function(layerInfo,inputService){
                return getFileData(layerInfo).then(function(fileData){


                    if(layerInfo.fileType == 'GML'){
                        var GMLData = parseGMLFileData(fileData);

                        var layerData = {
                            id : inputService.sourceId + '-' + layerInfo.layerId,
                            name : layerInfo.name,
                            layerId : layerInfo.layerId,
                            sourceId : inputService.sourceId,
                            type : 'area',
                            gmlData : GMLData,
                            epsg : GMLData.metadata.projection,
                            attributes : [],
                            labels : {},
                            featureCount : null
                        };

                        var length = GMLData.features.length;
                        for (var i=0;i<length;i++)
                        {
                            layerData.attributes[i] = {};
                            for (var prop in GMLData.features[i].values_) {
                                if (prop != 'geometry' && GMLData.features[i].values_.hasOwnProperty(prop)) {
                                    layerData.attributes[i][prop] = GMLData.features[i].values_[prop];
                                }
                            }
                        }
                        layerData.featureCount = i;

                        for (var prop in layerData.attributes[0]) {
                            if (layerData.attributes[0].hasOwnProperty(prop)) {
                                layerData.labels[prop] = prop;
                            }
                        }

                        return layerData;
                    }
                    else if(layerInfo.fileType == 'JSON-stat'){
                        var JSONstatData = parseJSONstatFileData(fileData,layerInfo.param);

                        var layerData = {
                            id : inputService.sourceId + '-' + layerInfo.layerId,
                            name : layerInfo.name,
                            layerId : layerInfo.layerId,
                            sourceId : inputService.sourceId,
                            type : 'attribute',
                            gmlData : null,
                            epsg : null,
                            attributes : JSONstatData.data,
                            labels : JSONstatData.labels,
                            featureCount : JSONstatData.length
                        };

                        return layerData;

                    }
                    else{
                        console.log('No Input Handler!')
                        return false;
                    }

                });
            }
        }
    }]);