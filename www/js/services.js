'use strict';

angular.module('eloquence.services', ['eloquence.utils'])

.service('$APIService', function($http, $q, $ionicLoading, $ionicPopup){
  var BACKEND_URL = 'https://eloquence-node.herokuapp.com';

  function showNotConnectedAlert() {
    $ionicPopup.alert({
      title: 'Sorry!',
      template: "I can't connect to the internet..."
    });
  }

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
  };

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
})

.service('$SentenceService', function($jsUtils, $StorageService, $APIService){
  var synonymsData = {};
  var PARSER_TYPES_TO_THESAURUS = {
    'Tag': '',
    '$': '',
    '``': '',
    "''": '',
    '(': '',
    ')': '',
    ',': '',
    '--': '',
    '.': '',
    ':': '',
    'CC': '',
    'CD': '',
    'DT': '',
    'EX': '',
    'FW': '',
    'IN': '',
    'JJ': 'adj',
    'JJR': 'adj',
    'JJS': 'adj',
    'LS': '',
    'MD': '',
    'NN': 'noun',
    'NNP': 'noun',
    'NNPS': 'noun',
    'NNS': 'noun',
    'PDT': '',
    'POS': '',
    'PRP': 'pron',
    'PRP$': 'pron',
    'RB': 'adv',
    'RBR': 'adv',
    'RBS': 'adv',
    'RP': '',
    'SYM': '',
    'TO': '',
    'UH': '',
    'VB': 'verb',
    'VBD': 'verb',
    'VBG': 'verb',
    'VBN': 'verb',
    'VBP': 'verb',
    'VBZ': 'verb',
    'WDT': '',
    'WP': 'pron',
    'WP$': 'pron',
    'WRB': 'adv'
  };

  var RANGE_ATTRIBUTES = ['complexity', 'relevancy', 'length'];
  var BOOLEAN_ATTRIBUTES = ['common', 'informal'];

  var currentParseData = {};

  function getNewWord (synonyms, filters){
    var selectedMeaning = getBestMeaningForType(synonyms);
    var possibleWords = getPossibleWords(selectedMeaning, filters);
    var selectedWord = selectWord(possibleWords);
    return selectedWord['text'];
  }

  function getWordScore(word, filters){
    var score = 0;
    RANGE_ATTRIBUTES.forEach(function(attr){
      if(filters.hasOwnProperty(attr)){
        score += Math.abs(word[attr] - filters[attr]);
        /*if(word[attr] > filters[attr].max) score += word[attr] - filters[attr].max;
        if(word[attr] < filters[attr].min) score += filters[attr].min - word[attr];*/
      }
    });

    BOOLEAN_ATTRIBUTES.forEach(function(attr){
      if(filters.hasOwnProperty(attr)){
        if(word[attr] !== filters[attr]) score += 2;
      }
    });

    return score;
  }

  function getPossibleWords(words, filters){
    //score should be 0
    var score = 1000;
    var selected = [];

    words.forEach(function(word){
      var wordScore = getWordScore(word, filters);
      if(wordScore < score){
        selected = [word];
        score = wordScore;
      }
      else if(wordScore === score){
        selected.push(word);
      }
    });

    return selected;
  }

  function getBestMeaningForType(selectedType){
    var max = -1;
    var best;
    for(var meaning in selectedType){
      if(selectedType.hasOwnProperty(meaning)){
        var curMax = selectedType[meaning].length;
        if(curMax > max){
          best = meaning;
          max = curMax;
        }
      }    
    }
    return selectedType[best];
  }

  function selectWord(words){
    return words[$jsUtils.randInt(words.length)];
  }

  function onDataReceived(data){
    currentParseData = data['parse-data'];

    for(var word in data['synonyms-data']){
      if(data['synonyms-data'].hasOwnProperty(word)){
        var wordData = data['synonyms-data'][word];
        synonymsData[word] = wordData;
        $StorageService.setWordData(word, wordData);
      }
    }
  }

  this.callSentenceAPI = function(sentence){
    sentence = sentence.toLowerCase();
    var words = $jsUtils.getWordsFromSentence(sentence);

    words = words.filter(function(word){
      if(synonymsData.hasOwnProperty(word)) return false;
      if(!$jsUtils.isStringAWord(word)) return false;

      var storedData = $StorageService.getWordData(word);
      if(storedData){
        synonymsData[word] = storedData;
        return false;
      }
      return true;
    });

    var jsonParams = {
      sentence: sentence,
      words: words
    };

    return $APIService.callUrl('/sentence/' + JSON.stringify(jsonParams)).then(function(data) {
        onDataReceived(data);
      }, function(err) {
        //error
    });
  };

  this.getSentenceTransformed = function(sentence, filters){
    var newWords = [];
    var oldWords = $jsUtils.getWordsFromSentence(sentence);

    oldWords.forEach(function(word){
      var newWord = word;
      if(!$jsUtils.isEmpty(synonymsData[word])){
        var type = PARSER_TYPES_TO_THESAURUS[currentParseData[word]];
        if(type && synonymsData[word].hasOwnProperty(type))
          newWord = getNewWord(synonymsData[word][type], filters);
        else
          console.error('Parser type: ' + currentParseData[word], word);
      }
      newWords.push(newWord);
    });

    return newWords.join(" ");
  };

});
