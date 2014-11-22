'use strict';

angular.module('eloquence.controllers', [])

.controller('SentenceCtrl', function($scope, $APIService, $StorageService, $jsUtils, $SentenceService) {

  $scope.filters = {
    complexity : 0,
    length : 0,
    informal : false,
    common : false
  };

  //Current sentence for which we have the data
  var sentence;

  //Prevent second pass - newSentence is the sentence transformed obtained at first pass
  var isSecondPass = true;
  var newSentence;

  $scope.getSentenceTransformed = function(){
    //If there's no sentence or if input has changed, quit
    if(!sentence || sentence.toLowerCase() !== $scope.sentenceInput.toLowerCase()) return;

    //Prevent second pass (model will not stabilize since we introduce randomness in getSentenceTransformed)
    //TO DO: Find a better implementation
    isSecondPass = !isSecondPass;
    if(isSecondPass) return newSentence;

    newSentence = $SentenceService.getSentenceTransformed(sentence, $scope.filters);
    return newSentence;
  }

  $scope.callSentenceAPI = function(){
    var sentencePassedToAPI = $scope.sentenceInput;
    if(!sentencePassedToAPI) return;

    $SentenceService.callSentenceAPI(sentencePassedToAPI).then(function(data) {
        sentence = sentencePassedToAPI;
      }, function(err) {
        //error
    });
  }
});
