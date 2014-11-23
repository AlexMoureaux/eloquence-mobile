angular.module('eloquence.utils', [])

.factory('$localStorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      var obj = $window.localStorage[key];
      return obj ? JSON.parse(obj) : undefined;
    }
  };
}])

.service('$jsUtils', function(){
/*  this.clone = function(obj) {
      if (null == obj || "object" != typeof obj) return obj;
      var copy = obj.constructor();
      for (var attr in obj) {
          if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
      }
      return copy;
  };*/

/*  this.getObjectFirstValue = function (obj){
    for(var key in obj)
      return obj[key];
  };*/

  this.isEmpty = function (object) { 
    for(var key in object)
      if(object.hasOwnProperty(key))
        return false; 
    return true; 
  };

  this.randInt = function(n){
    return Math.floor((Math.random() * n));
  };

  this.getWordsFromSentence = function(sentence){
    return sentence.match(/[,.!?;:]|\b[a-z']+\b/ig);
  };

  this.isStringAWord = function(str){
    return str.match(/[a-z]/i);
  };
});