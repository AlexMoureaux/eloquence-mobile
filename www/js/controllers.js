'use strict';

angular.module('eloquence.controllers', [])

.controller('SentenceCtrl', function($scope, $APIService, $StorageService) {

	$scope.filters = {
		complexity : 0,
		length : 0,
		informal : false,
		common : false
	};

	var synData = {};
	var sentence;
	var parseData = {};

	var parserTypeToThesaurus = {
		"NNP": "",
		"VBP": "",
		"VB": "verb",
		"DT": "",
		"RB": "adv",
		"JJ": "adj",
		"NN": "noun",
		"PRP": "pron",
		"MD": "verb"
	};

	function clone(obj) {
	    if (null == obj || "object" != typeof obj) return obj;
	    var copy = obj.constructor();
	    for (var attr in obj) {
	        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	    }
	    return copy;
	}

	function getObjectFirstValue(obj){
		for(var key in obj)
			return obj[key];
	}

	function isEmpty(object) { 
		for(var i in object) 
			return false; 
		return true; 
	}

	function randInt(n){
		return Math.floor((Math.random() * n));
	}

	function getBestMeaningForType(selectedType){
		var max = -1;
		var best;
		for(var meaning in selectedType){
			var curMax = selectedType[meaning].length;
			if(curMax > max){
				best = meaning;
				max = curMax;
			}
		}
		return selectedType[best];
	}

	var isSecondPass = true;
	var newSentence;

	$scope.getSentenceTransformed = function(){
		console.log('getSentenceTransformed called');
		if(!sentence || sentence.toLowerCase() !== $scope.sentenceInput.toLowerCase()) return;
		isSecondPass = !isSecondPass;
		if(isSecondPass) return newSentence;

		console.log('getSentenceTransformed running');

		var newWords = [];
		var oldWords = sentence.split(" ");

		var filters = $scope.filters;

		oldWords.forEach(function(word){
			var newWord = word;
			if(!isEmpty(synData[word])){
				var type = parserTypeToThesaurus[parseData[word]];
				if(type && synData[word].hasOwnProperty(type))
					newWord = getNewWord(synData[word][type], filters);
				else
					console.error("Parser type: " + parseData[word], word);
			}
			newWords.push(newWord);
		});

		newSentence = newWords.join(" ");
		return newSentence;
	}

	function onDataReceived(data){
		parseData = data['parse-data'];

		for(var word in data['synonyms-data']){
			var wordData = data['synonyms-data'][word];
			synData[word] = wordData;
			$StorageService.setWordData(word, wordData);
		}
	}

	function getNewWord(synonyms, filters){
		var selectedMeaning = getBestMeaningForType(synonyms);
		var possibleWords = getPossibleWords(selectedMeaning, filters);
		var selectedWord = selectWord(possibleWords);
		return selectedWord["text"];
	}

	var RANGE_ATTRIBUTES = ["complexity", "relevancy", "length"];
	var BOOLEAN_ATTRIBUTES = ["common", "informal"];

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
			else if(wordScore == score){
				selected.push(word);
			}
		});

		return selected;
	}

	function selectWord(words){
		return words[randInt(words.length)];
	}

	function getWordsFromSentence(sentence){
		return sentence.match(/[,.!?;:]|\b[a-z']+\b/ig);
	}

	$scope.callSentenceAPI = function(){
		var sentencePassedToAPI = $scope.sentenceInput;
		if(!sentencePassedToAPI) return;

		sentencePassedToAPI = sentencePassedToAPI.toLowerCase();
		var words = getWordsFromSentence(sentencePassedToAPI);

		words = words.filter(function(word){
			console.log(word, synData.hasOwnProperty(word), $StorageService.getWordData(word))

			if(synData.hasOwnProperty(word)) return false;
			var storedData = $StorageService.getWordData(word);
			if(storedData){
				synData[word] = storedData;
				return false;
			}
			return true;
		});

		var jsonParams = {
			sentence: sentencePassedToAPI,
			words: words
		};

		console.log(jsonParams);

		$APIService.callUrl('/sentence/' + JSON.stringify(jsonParams)).then(function(data) {
				sentence = sentencePassedToAPI;
		    	onDataReceived(data);
		  	}, function(err) {
		  		//error
	  	});
	}
});
