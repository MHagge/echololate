"use strict";

// returns mouse position in local coordinate system of element
function getMouse(e){
	var mouse = {} // make an object
	mouse.x = e.pageX - e.target.offsetLeft;
	mouse.y = e.pageY - e.target.offsetTop;
	return mouse;
}

function clamp(val, min, max){
	return Math.max(min, Math.min(max, val));
}

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

function circlesIntersect(c1,c2){
    //console.log("circlesIntersect called")
    
    //console.dir(c1);
    //console.dir(c2);
    
    var dx = c2.x - c1.x;
    var dy = c2.y - c1.y;
    var distance = Math.sqrt(dx*dx +dy*dy);
    return distance < c1.RADIUS + c2.radius; 
}

function calculateDeltaTime(lastTime){
    var now,fps;
    now = performance.now(); 
    fps = 1000 / (now - lastTime);
    fps = clamp(fps, 12, 60);
    lastTime = now; 
    return 1/fps;
}

function waveringAlpha(alpha){
    //var alphaUp = alphaUp || false;      
    

        if(alpha[2]==1){
            alpha[1] += .005;

        }
        else{
            alpha[1] -= .01;

        }
        if(alpha[1] >= .9){
            alpha[2] = 0;
        }
        if(alpha[1] <= .3){
            alpha[2] = 1;
        }
    
    return alpha;

}