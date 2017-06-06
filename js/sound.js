// sound.js
"use strict";

var app = app || {};

app.sound = function(){
    var bgAudio = undefined;
    var squeeksAudio = undefined;
    var batSqueeks = ["batSqueek1.mp3","batSqueek2.mp3","batSqueek3.mp3","batSqueek4.mp3"];
    
    function init(){
        bgAudio = document.querySelector("#bgAudio");
		bgAudio.volume=0.25;
        bgAudio.play();
		squeeksAudio = document.querySelector("#squeeksAudio");
		squeeksAudio.volume = 0.1;
//        munchAudio = document.querySelector("#munchAudio");
//        munchAudio.volume = 0.3;
    }
    
    function playBGAudio(){
        bgAudio.play();
    }
    
    function stopBGAudio(){
        bgAudio.pause();
        squeeksAudio.pause();
		//bgAudio.currentTime = 0;
    }
    
    function playSqueeks(){
        //currentEffect = Math.floor(getRandom(0, 3));
		squeeksAudio.src = "media/" + batSqueeks[Math.floor(getRandom(0, batSqueeks.length))];
		squeeksAudio.play();
    }
    
//    function playMunch(){
//        
//    }
    
    return{
        init: init,
        playBGAudio: playBGAudio,
        stopBGAudio: stopBGAudio,
        playSqueeks: playSqueeks
    }
    
}()