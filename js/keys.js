// The myKeys object will be in the global scope - it makes this script 
// really easy to reuse between projects

"use strict";

var app = app || {};

//start IIFE
app.myKeys = function(){

    var myKeys = {};

    myKeys.KEYBOARD = Object.freeze({
        "KEY_LEFT": 37, 
        "KEY_UP": 38, 
        "KEY_RIGHT": 39, 
        "KEY_DOWN": 40,
        "KEY_W": 87,
        "KEY_A": 65,
        "KEY_S": 83,
        "KEY_D": 68,
        "KEY_ENTER": 13,
        "KEY_B": 66,
        "KEY_SPACE": 32,
//        "KEY_SHIFT": 16,
    });

    // myKeys.keydown array to keep track of which keys are down
    // this is called a "key daemon"
    // main.js will "poll" this array every frame
    // this works because JS has "sparse arrays" - not every language does
    myKeys.keydown = [];
    myKeys.keyup = [];

    // event listeners
    window.addEventListener("keydown",function(e){
        //console.log("keydown=" + e.keyCode);
        myKeys.keydown[e.keyCode] = true;
    });

    window.addEventListener("keyup",function(e){
        //console.log("keyup=" + e.keyCode);
        myKeys.keydown[e.keyCode] = false;

        var char = String.fromCharCode(e.keyCode);     
        
        // pausing and resuming
        if (char == "p" || char == "P"){
            if (app.main.paused){
                app.main.resumeGame();
            } else {
                app.main.pauseGame();
            }
        }
        
        //toggling FPS
        if (char == "b" || char == "B"){
            app.main.toggleDebug();
        }
    });
    
return myKeys;
}()//end /IIFE