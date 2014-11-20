'use strict';

angular.module('eloquence.services', ['ionic.utils'])

.service('$APIService', function($http, $q, $ionicLoading, $ionicPopup){
  var BACKEND_URL = window.cordova ?'https://mysterious-reaches-6529.herokuapp.com' : 'http://localhost:5000';

  function showNotConnectedAlert() {
    var alertPopup = $ionicPopup.alert({
      title: 'Sorry!',
      template: "I can't connect to the internet..."
    });
  };

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
        showNotConnectedAlert();
        return $q.reject(response.data);
      }

    }, function(response) {
      $ionicLoading.hide();
      showNotConnectedAlert();
      return $q.reject(response.data);
    });
  }

})

.service('$StorageService', function($localStorage){
  var WORD_PREFIX = 'word_';

  function getKeyForWord(word){
    return WORD_PREFIX + word;
  }

  this.setWordData = function(word, data) {
      $localStorage.setObject(getKeyForWord(word), data);
  };

  this.getWordData = function(word) {
      return $localStorage.getObject(getKeyForWord(word));
  };
});
