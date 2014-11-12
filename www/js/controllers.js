'use strict';

angular.module('eloquence.controllers', [])

.controller('SentenceCtrl', function($scope, APIService) {

	var synData = {};
	var sentence;

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

	function onDataReceived(data){
		synData = data['synonyms-data'];
		var parseData = data['parse-data'];

		console.log(synData);
		console.log(parseData);

		var newWords = [];
		var oldWords = $scope.sentenceInput.split(" ");

		var filters = {
			complexity: {
				min: 3
			},
			length: {
				min: 3
			}
		};

		oldWords.forEach(function(word){
			var newWord = word;
			if(!isEmpty(synData[word])){
				var type = parserTypeToThesaurus[parseData[word]];
				if(type && synData[word].hasOwnProperty(type))
					newWord = getNewWord(synData[word][type], filters);
				else
					console.error("Parser type: " + parseData[word], "Thesaurus data: " + synData[word]);
			}
			newWords.push(newWord);
		});

		return newWords.join(" ");
	}

	function getNewWord(synonyms, filters){
		var selectedMeaning = getBestMeaningForType(synonyms);
		var possibleWords = getPossibleWords(selectedMeaning, filters);
		var selectedWord = selectWord(possibleWords);
		return selectedWord["text"];
	}

	var RANGES_ATTRIBUTES = ["complexity", "relevancy", "length"];
	var BOOLEAN_ATTRIBUTES = ["common", "informal"];

	function getWordScore(word, filters){
		var score = 0;
		RANGES_ATTRIBUTES.forEach(function(attr){
			if(filters.hasOwnProperty(attr)){
				if(word[attr] > filters[attr].max) score += word[attr] - filters[attr].max;
				if(word[attr] < filters[attr].min) score += filters[attr].min - word[attr];
			}
		});

		BOOLEAN_ATTRIBUTES.forEach(function(attr){
			if(filters.hasOwnProperty(attr)){
				console.log(word[attr] !== filters.attr, word[attr], filters[attr]);
				if(word[attr] !== filters[attr]) score += 2;
			}
		});

		//console.log(word, score, filters);
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

	$scope.callSentenceAPI = function(){
		if($scope.sentenceInput)
			APIService.callUrl('/sentence/' + $scope.sentenceInput).then(function(data) {
			    	$scope.sentenceTransformed = onDataReceived(data);
			  	}, function(err) {
			  		$scope.sentenceTransformed = "Sorry, I can't connect to the internet...";
		  	});
	}
});
