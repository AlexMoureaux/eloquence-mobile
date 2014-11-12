'use strict';

angular.module('eloquence.services', [])

.service('APIService', function($http, $q, $ionicLoading){
    var BACKEND_URL = window.cordova ?'https://mysterious-reaches-6529.herokuapp.com' : 'http://localhost:5000';

    this.callUrl = function(url){
    	$ionicLoading.show({
	      template: 'Thinking...'
	    });

    	return $http.get(BACKEND_URL + encodeURI(url))
	        .then(function(response) {
	        	$ionicLoading.hide();
	            if (typeof response.data === 'object') {
	                return response.data;
	            } else {
	                // invalid response
	                return $q.reject(response.data);
	            }

	        }, function(response) {
	            $ionicLoading.hide();
	            return $q.reject(response.data);
	    	});
    }
 
});
