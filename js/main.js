//main.js

"use strict"

//obj lit
var app = app || {};

app.main = {

  //MODULES
  myKeys: undefined,

  //PROPERTIES
  canvas: undefined,
  ctx: undefined,
  animationID: 0,
  debug:false,
  paused:false,

  //canvas dimensions
  WIDTH: 640,
  HEIGHT: 480,

  //time props
  time: 0,
  lastTime: 0,
  dt: 1/60.0,
  worldTime: 0,
  bFrame: 5,
  fFrame: 0,
  tickCount: 0,
  squeekCount:0,
  interval: 5,

  //image props
  foodImage:undefined,

  //audio props
  sound: undefined,

  //emitter props
  Emitter: undefined,
  pulsar: undefined,
  pX: 640/2,//WIDTH/2
  pY: 0,
  pSPEED: 5.5,

  //props for wavering "Press Enter to Play" button 
  playButtonAlpha: [0,0],
  playButtonAlphaUp: true,

  BACKGROUND:{
    IMAGE: undefined,
    WIDTH: 640*2, //WIDTH*2,
    HEIGHT: 480*2, //HEIGHT*2,
    SPEED: 6.5,
    x: 0 - 640/2,
    y: 0 - 480/2, //uhhh
  },
  //do you love the color of the sky?
  skyColors:[	'#262640','#343456','#85609f','#e09eb2',' #ffab66',' #ffffb3','lightblue'],
  preColorAlpha: 1,
  nextColorAlpha: 0,
  currentColor: 0,
  daySpeed: 0.001,
  sunPos:{ x: 30, y: 480 - 58},
  timeKeeper: undefined,
  sunImage: undefined,

  BAT:{
    IMAGE: undefined,
    SPEED: 60.5,
    WIDTH: 133,
    HEIGHT: 133,
    IMAGE_WIDTH: 785,//actually 1200
    x: 640/2, //WIDTH/2,
    y: 480/2,
    RADIUS:40,
  },

  FOOD:{
    eaten: false,
    //VALUE: 10,
    IMAGE: undefined,
    IMAGE_WIDTH: 38*4,
    SPEED: 5,//was at 5
    //TYPE: undefined,
    AMOUNT:10,
    WIDTH: 38,
    HEIGHT: 38,
    RADIUS:25,
    direction: 0.01,
    radiusMag: 50,
  },
  foodArray: [],


  /*ECHOLOCATION: Object.seal({
        SPEED: 5,
        RADIUS: 0,
        RIPPLES_PER_ECHO: 3,//not sure if this will be usefull

    }),
    echolocate: true,*/


  GAME_STATE:Object.freeze({
    BEGIN: 0,
    DEFAULT: 1,
    ROUND_OVER: 3,
    FAILED_ROUND: 4,
    END: 5,
  }),
  gameState : undefined,
  level: 1,
  NUMBER_OF_LEVELS: 5,
  roundScore: 0,



  init : function(){
    this.canvas = document.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.height = this.HEIGHT;  
    this.canvas.width = this.WIDTH;

    //set up 'notes' section below game
    const documentation = document.querySelector("#documentation");
    document.querySelector("#notes").addEventListener('click', function(){
      if(documentation.style.height === '290px'){
        documentation.style.height = '0px';
        documentation.style.color = '#121222';
        arrow.style.transform = 'rotate(-45deg)';
      }else{
        documentation.style.height = '290px';
        documentation.style.color = '#aaa';
        arrow.style.transform = 'rotate(45deg)';
      }
    })


    this.gameState = this.GAME_STATE.BEGIN;

    //PREPARE IMAGES
    var image = new Image();
    image.src = "media/background.png";
    this.BACKGROUND.IMAGE = image;

    this.timeKeeper = new Image();
    this.timeKeeper.src = "media/timeKeeper.png";

    this.sunImage = new Image();
    this.sunImage.src = "media/sun.png";

    var image = new Image();
    image.src = "media/batSpriteSheet.png";
    this.BAT.IMAGE = image;

    this.foodImage = new Image();
    this.foodImage.src = "media/lunaMothSpriteSheet.png"

    this.foodArray = this.createCreatures(this.foodImage);
    this.createPulsar();

    this.update();

  },//end init

  update : function(){ 

    this.animationID = requestAnimationFrame(this.update.bind(this));

    //paused? if so, bail out of loop
    if(this.paused){
      this.drawPauseScreen(this.ctx);
      return;
    }

    this.dt = calculateDeltaTime(this.lastTime);
    if(!this.paused){
      this.worldTime = this.dt + this.worldTime;
    }


    //handle some keyboard stuff -- maybe move this later..
    //change gameStates on ENTER
    if(this.gameState == this.GAME_STATE.BEGIN && this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_ENTER]){

      this.gameState = this.GAME_STATE.DEFAULT;
    }
    if(this.gameState == this.GAME_STATE.END && this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_ENTER]){
      this.reset();
      this.gameState = this.GAME_STATE.BEGIN;

      this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_ENTER] = false;
      this.canvas.width = this.WIDTH;
      this.canvas.height = this.HEIGHT;

    }
    if(this.gameState == this.GAME_STATE.ROUND_OVER && this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_ENTER]){
      this.reset();
      this.gameState = this.GAME_STATE.DEFAULT;

      this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_ENTER] = false;
      this.canvas.width = this.WIDTH;
      this.canvas.height = this.HEIGHT;

    }

    //
    this.noiseControl();

    //draw
    //draw background
    this.drawDayCycle(this.ctx);

    if(this.debug){
      this.ctx.save();
      this.ctx.strokeStyle = 'white';
      this.ctx.beginPath();

      this.ctx.rect(this.BACKGROUND.x,this.BACKGROUND.y,(this.canvas.width*2),(this.canvas.height*2));
      this.ctx.closePath();
      this.ctx.stroke();

      this.ctx.restore();
    }

    //draw particles
    this.pulsar.updateAndDraw(this.ctx,{x:this.pX,y:this.pY});

    //draw and move food
    this.drawFood(this.ctx);
    this.moveFood(this.dt);

    //draw and move bat plus check collisions
    if(this.gameState == this.GAME_STATE.DEFAULT){
      this.moveBat();         
      this.drawBat(this.ctx, this.BAT.IMAGE, this.BAT.x, this.BAT.y, this.BAT.WIDTH, this.BAT.HEIGHT);
      this.checkForCollisions();
    }

    this.drawHUD(this.ctx);

  },//end update

  reset: function(){
    if(this.gameState == this.GAME_STATE.ROUND_OVER){

      //increase difficulty of next level
      this.FOOD.AMOUNT +=5;
      this.FOOD.radiusMag +=50;
      this.FOOD.direction +=.003;

      this.roundScore = 0;
      this.level++;
      this.foodArray = this.createCreatures(this.foodImage);
      this.lastTime += this.worldTime;
      this.worldTime = 0;
    }
    if(this.gameState == this.GAME_STATE.END){

      //increase difficulty of next level
      this.FOOD.AMOUNT = 10;
      this.FOOD.radiusMag =50;
      this.FOOD.direction =.01;

      this.roundScore = 0;
      this.level = 1;
      this.foodArray = this.createCreatures(this.foodImage);
      this.lastTime += this.worldTime;
      this.worldTime = 0;
      this.currentColor = 0;
      this.sunPos.x = 30; 
    }
  },

  noiseControl: function(){
    //randomly make bat squeekly noises  
    if(Math.round(this.squeekCount) > this.interval ){
      //console.log("played squeek");
      this.sound.playSqueeks();
      this.interval = Math.floor(getRandom(30,50));
      this.squeekCount = 0;
    }
    this.squeekCount = this.squeekCount + this.dt;

  },

  //DRAW
  drawBat: function(ctx,image,x,y,width, height){

    //tick count controls animation
    if(this.tickCount%10 == 0){
      this.bFrame += width;
      if(this.bFrame >= this.BAT.IMAGE_WIDTH){
        this.bFrame = 6;
      }
    }

    var halfW = width/2 -2;
    var halfH = height/2 -35;
    ctx.drawImage(image,this.bFrame, 0, width,height, x- halfW, y- halfH, width, height);

    if(this.debug){
      ctx.save();
      ctx.strokeStyle = 'white';
      ctx.beginPath();
      ctx.arc(x,y,this.BAT.RADIUS,0,Math.PI*2,false);
      ctx.stroke();
      ctx.closePath();
      ctx.restore();
    }
  },

  drawFood : function(ctx){

    //tick count controls animation
    if(this.tickCount%30 == 0){
      this.fFrame += this.FOOD.WIDTH;
      if(this.fFrame >= this.FOOD.IMAGE_WIDTH){
        this.fFrame = 0;
      }
    }
    this.tickCount++;

    //go through all food and draw 
    for(var i = 0; i<this.foodArray.length; i++){
      var f = this.foodArray[i];

      var halfW = f.width/2;
      var halfH = f.height/2;

      ctx.drawImage(f.image,this.fFrame, 0, f.width,f.height,f.x- halfW, f.y- halfH, f.width, f.height);

      if(this.debug){
        //cirlces around moths
        ctx.save();
        if(f.eaten == true){
          ctx.strokeStyle = 'red';
        }else{
          ctx.strokeStyle = 'white';
        }
        ctx.beginPath();
        ctx.arc(f.x,f.y,f.radius,0,Math.PI*2,false);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
      }
    }
  },


  drawDayCycle : function(ctx){
    //changes colors to look like the world goes from evening to night to daybreak
    //only effects the sky/background

    if(this.gameState == this.GAME_STATE.BEGIN){
      this.ctx.fillStyle = "#262640"; 	
      this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
    }
    else if(this.gameState == this.GAME_STATE.DEFAULT){
      //solid color to keep sky from turning black at end
      this.ctx.fillStyle = "lightblue";//"#262640"; 	
      this.ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);

      var preColor = this.skyColors[this.currentColor];
      //console.log("pre: " + preColor);
      var nextColor = this.skyColors[this.currentColor+1];
      //console.log("next: " + nextColor);

      this.preColorAlpha-=this.daySpeed;
      this.nextColorAlpha+=this.daySpeed;
      //console.log("preAlpha: "+ this.preColorAlpha);
      //console.log("nextAlpha: "+ this.nextColorAlpha);
      //console.log("daySpeed " +this.daySpeed);

      this.sunPos.x+=this.daySpeed*67.6;

      ctx.save();
      ctx.globalAlpha = this.preColorAlpha;
      ctx.fillStyle = preColor; 	
      ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = this.nextColorAlpha;
      ctx.fillStyle = nextColor; 	
      ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
      ctx.restore();

      //if done with this color move to next
      if(this.preColorAlpha < 0){
        this.currentColor++;
        this.preColorAlpha = 1;
        this.nextColorAlpha = 0;
      }



    }else{
      var preColor = "lightblue";//this.skyColors[this.currentColor];
      var nextColor = this.skyColors[this.currentColor+1];

      ctx.save();
      ctx.globalAlpha = this.preColorAlpha;
      ctx.fillStyle = preColor; 	
      ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = this.nextColorAlpha;
      ctx.fillStyle = nextColor; 	
      ctx.fillRect(0,0,this.WIDTH,this.HEIGHT);
      ctx.restore();       

    }

    //draw background image
    this.ctx.drawImage(this.BACKGROUND.IMAGE, this.BACKGROUND.x, this.BACKGROUND.y, this.BACKGROUND.WIDTH, this.BACKGROUND.HEIGHT);

    //draw timeKeepr
    this.ctx.drawImage(this.timeKeeper, 20, this.HEIGHT - 60, this.WIDTH -30, 50 );

    this.ctx.drawImage(this.sunImage, this.sunPos.x, this.sunPos.y, 46, 46);

    //draw and move sun icon
//    ctx.save();
//    ctx.beginPath();
//    ctx.fillStyle = "yellow";
//    ctx.arc(this.sunPos.x, this.sunPos.y, 15, 0, 2*Math.PI, false);
//    //ctx.arc(0, 0, 30, 0, 2*Math.PI, false);
//    ctx.fill();
//    ctx.restore();
  },

  drawHUD : function(ctx){

    if(this.gameState == this.GAME_STATE.DEFAULT){
      ctx.save();
      this.fillText(ctx,"Moths: " + this.roundScore + "/" + this.FOOD.AMOUNT, 20, 20, "14pt Cinzel", "#ddd"); 
      //timer
      //this.fillText(ctx,"Timer: " + (this.worldTime/10).toFixed(1),this.canvas.width - 150, 20, "14pt Cinzel", "#ddd");
      ctx.restore();
    }
    //(performance.now()/1000).toFixed(1)

    if(this.gameState == this.GAME_STATE.BEGIN){
      //interesting effect, completly an accident
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      this.fillText(ctx,"Echolocate", this.WIDTH/2, this.HEIGHT/2 - 20, " 30pt Cinzel", "white");            
      ctx.restore();
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 20;
      this.fillText(ctx,"Echolocate", this.WIDTH/2, this.HEIGHT/2 - 20, " 30pt 'Cinzel'", "black");            
      ctx.restore();

      this.playButtonAlpha = waveringAlpha(this.playButtonAlpha);

      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = .9;
      this.fillText(ctx,"Eat all the moths before dawn!",this.WIDTH/2, this.HEIGHT/2+30, "15pt Cinzel","white");
      this.fillText(ctx,"~Press Enter to Play~", this.WIDTH/2, this.HEIGHT/2+80, " 20pt Cinzel", "rgba(255,255,255," + this.playButtonAlpha[1] + ")");             
      //console.log(this.playButtonAlpha);

      ctx.restore();
    }
    if(this.gameState == this.GAME_STATE.ROUND_OVER){
      //console.log("round over hud if");
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = '#000';
      ctx.shadowOffsetY = 2;
      ctx.shadowOffsetX = 2;
      ctx.shadowBlur = 5;
      this.fillText(ctx, "You ate all " + this.FOOD.AMOUNT + " insects!", this.WIDTH/2, this.HEIGHT/2-20, "20pt Cinzel", "white");
      this.fillText(ctx,"~Press Enter to go to the next level~", this.WIDTH/2, this.HEIGHT/2+20, " 15pt Cinzel", "white");  

      ctx.restore();

    }
    if(this.gameState == this.GAME_STATE.END){


      ctx.save();
      this.playButtonAlpha = waveringAlpha(this.playButtonAlpha);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = 'black';
      ctx.shadowOffsetY = 2;
      ctx.shadowOffsetX = 2;
      ctx.shadowBlur = 4;
      if(this.level > this.NUMBER_OF_LEVELS){
        this.fillText(ctx, "You Won!", this.WIDTH/2, this.HEIGHT/2-50, "30pt Cinzel", "white");
        this.fillText(ctx, "You ate many moths and you are satified.", this.WIDTH/2, this.HEIGHT/2, "15pt Cinzel", "white");
        this.fillText(ctx,"~Press Enter to Play Again~", this.WIDTH/2, this.HEIGHT/2+50, "bold 20pt Cinzel", "rgba(255,255,255," + this.playButtonAlpha[1] + ")"); 
      }
      else{
        this.fillText(ctx, "Game Over!", this.WIDTH/2, this.HEIGHT/2-50, "30pt Cinzel", "white");
        this.fillText(ctx, "Dawn has come and you failed to eat all the moths.", this.WIDTH/2, this.HEIGHT/2, "15pt Cinzel", "white");
        this.fillText(ctx,"~Press Enter to Play Again~", this.WIDTH/2, this.HEIGHT/2+50, "bold 20pt Cinzel", "rgba(255,255,255," + this.playButtonAlpha[1] + ")"); 
      }
      ctx.restore();
    }

  },

  drawPauseScreen:function(ctx){

    ctx.save();

    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "rgba(0,0,0,0.5)";//alpha doesn't want to work :( idk
    ctx.fillRect(0,0,this.WIDTH, this.HEIGHT);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.fillText(this.ctx,"PAUSED", this.WIDTH/2, this.HEIGHT/2, "30pt Cinzel", "white");
    ctx.restore();    


  },//end draw

  fillText: function(ctx,string, x, y, css, color) {
    ctx.save();
    // https://developer.mozilla.org/en-US/docs/Web/CSS/font
    ctx.font = css;
    ctx.fillStyle = color;
    ctx.fillText(string, x, y);
    ctx.restore();
  },

  Food : function(image,bgSettings,foodSettings){
    this.degree = getRandom(0, 360);
    this.image = image;
    this.x = getRandom(bgSettings.x, bgSettings.WIDTH - 200);
    this.y = getRandom(bgSettings.y, bgSettings.HEIGHT -150);
    this.centerX = this.x;
    this.centerY = this.y;
    this.direction = foodSettings.direction;
    this.radiusMag = foodSettings.radiusMag;
    this.speed = foodSettings.SPEED;
    this.eaten = foodSettings.eaten;
    this.width = foodSettings.WIDTH;
    this.height = foodSettings.HEIGHT;
    this.radius = foodSettings.RADIUS;

  },

  createCreatures : function(foodImage){
    //make arrays of creatures? and pass them to their draw functions?

    var menuArray = []

    for(var i = 0; i< this.FOOD.AMOUNT; i++){

      //if you wanted to used multiple insects, i think this is where you would set up conditons to pass in differ images
      var food = new this.Food(foodImage,this.BACKGROUND, this.FOOD);

      //can probably seal ',:\
      Object.seal(food);
      menuArray.push(food);
    }

    return menuArray;
  },
  createPulsar : function(){
    //pulsar
    //right side is "pulsar"
    this.pulsar=new this.Emitter();
    this.pulsar.red = 255;
    this.pulsar.green = 255;
    this.pulsar.blue = 255;
    this.pulsar.minXspeed=this.pulsar.minYspeed=-0.25;
    this.pulsar.maxXspeed=this.pulsar.maxYspeed=0.1;
    this.pulsar.lifetime=500;
    this.pulsar.expansionRate=0.03;
    this.pulsar.numParticles=35;
    this.pulsar.xRange=this.WIDTH*2;
    this.pulsar.yRange=this.HEIGHT*2;
    this.pulsar.useCircles=true;
    this.pulsar.useSquares=false;
    this.pulsar.createParticles({x:this.WIDTH/2,y:0});

  },


  moveBat : function(){

    if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_LEFT] || this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_A]){

      // if the edge of the screen approches 
      if(this.BACKGROUND.x + (this.BACKGROUND.SPEED * this.dt *10) >= 0 && !this.debug){
        //if bat is not at the edge of the screen
        if(this.BAT.x > 0 + this.BAT.WIDTH/2){
          //move bat
          this.BAT.x -= this.BAT.SPEED * this.dt;
        }
        //this.BACKGROUND.x -= this.BACKGROUND.SPEED * this.dt *10;
      }
      else{
        //recenters bat
        if(this.BAT.x >= this.canvas.width/2){
          this.BAT.x -= this.BAT.SPEED * this.dt;
        }
        //move bg
        this.BACKGROUND.x += this.BACKGROUND.SPEED * this.dt *10;
        //move particles                
        for(var i = 0; i < this.pulsar.numParticles; i++){//***********************
          var p = this.pulsar._particles[i];
          p.x += this.pSPEED * this.dt *10;
        }

        //move food
        for(var i = 0; i < this.foodArray.length; i++){
          var f = this.foodArray[i];  
          f.centerX += f.speed * this.dt *10;
        }
      }
    }

    if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_RIGHT] || this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_D]){

      if(this.BACKGROUND.x - (this.BACKGROUND.SPEED * this.dt *10) <= (-this.BACKGROUND.WIDTH + this.canvas.width) && !this.debug){
        if(this.BAT.x < this.canvas.width - this.BAT.WIDTH/2){
          this.BAT.x += this.BAT.SPEED * this.dt;
        }
      }
      else{
        //recenters bat
        if(this.BAT.x <= this.canvas.width/2){
          this.BAT.x += this.BAT.SPEED * this.dt;
        }
        //move bg
        this.BACKGROUND.x -= this.BACKGROUND.SPEED * this.dt *10;
        //move particles
        for(var i = 0; i < this.pulsar.numParticles; i++){//***********************
          var p = this.pulsar._particles[i];
          p.x -= this.pSPEED * this.dt *10;
        }
        //move food
        for(var i = 0; i < this.foodArray.length; i++){    
          var f = this.foodArray[i];
          f.centerX -= f.speed *this.dt *10;
        } 
      }
    }

    if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_UP] || this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_W]){
      // if the edge of the screen approches 
      if(this.BACKGROUND.y + (this.BACKGROUND.SPEED * this.dt *10) >= 0 && !this.debug){
        if(this.BAT.y - this.BAT.RADIUS > 0){
          this.BAT.y -= this.BAT.SPEED * this.dt;
        }
      }
      else{
        //recenters bat
        if(this.BAT.y >= this.canvas.height/2){
          this.BAT.y -= this.BAT.SPEED * this.dt;
        }
        //move bg
        this.BACKGROUND.y += this.BACKGROUND.SPEED * this.dt *10;
        //move particles
        for(var i = 0; i < this.pulsar.numParticles; i++){//***********************
          var p = this.pulsar._particles[i];
          p.y += this.pSPEED * this.dt *10;
        }
        //move food
        for(var i = 0; i < this.foodArray.length; i++){    
          var f = this.foodArray[i];
          f.centerY += f.speed *this.dt *10;
        } 
      }
    }

    if(this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_DOWN] || this.myKeys.keydown[this.myKeys.KEYBOARD.KEY_S]){
      //if the edge of the screen approches
      if(this.BACKGROUND.y - (this.BACKGROUND.SPEED * this.dt *10) <= (-this.BACKGROUND.HEIGHT + this.canvas.height) && !this.debug){
        if(this.BAT.y + this.BAT.RADIUS < this.canvas.height){
          this.BAT.y += this.BAT.SPEED * this.dt;
        }
      }
      else{
        //recenters bat
        if(this.BAT.y <= this.canvas.height/2){
          this.BAT.y+= this.BAT.SPEED * this.dt;
        }
        //move bg
        this.BACKGROUND.y -= this.BACKGROUND.SPEED * this.dt *10;
        //move particles
        for(var i = 0; i < this.pulsar.numParticles; i++){//***********************
          var p = this.pulsar._particles[i];
          p.y -= this.pSPEED * this.dt *10;
        }                
        //move food
        for(var i = 0; i < this.foodArray.length; i++){    
          var f = this.foodArray[i];
          f.centerY -= f.speed *this.dt *10;
        } 
      }
    }

    //OR if mouse is over the canvas follow the mouse.
  },

  moveFood : function(dt){
    //food moves around in small circles
    for(var i = 0; i < this.foodArray.length; i++){

      var f = this.foodArray[i];

      //make food move in a circle  
      //var radiusMag = 50;

      f.degree+=f.direction;

      var radiusX = Math.cos(f.degree)*f.radiusMag;
      var radiusY = Math.tan(f.degree)*radiusX;

      var desiredX = f.centerX + radiusX;
      var desiredY = f.centerY + radiusY;

      f.x = desiredX;
      f.y = desiredY;

      //check collision with edge of world
      //Left
      if(f.centerX-f.radiusMag <= this.BACKGROUND.x  ){
        f.centerX = this.BACKGROUND.x + f.radiusMag + 1;
      }
      //Right
      if(f.centerX+f.radiusMag >= this.BACKGROUND.x + this.BACKGROUND.WIDTH){
        f.centerX = this.BACKGROUND.x + this.BACKGROUND.WIDTH -f.radiusMag - 1;
      }
      //Top
      if(f.centerY-f.radiusMag <= this.BACKGROUND.y){
        f.centerY = this.BACKGROUND.y + f.radiusMag + 1
      }
      //Bottom
      if(f.centerY+f.radiusMag>= this.BACKGROUND.y + this.BACKGROUND.HEIGHT){
        f.centerY = this.BACKGROUND.y + this.BACKGROUND.HEIGHT - f.radiusMag - 1;
      }

    }
  },

  checkForCollisions : function(){
    //enemies cause damage to bat
    //bat makes food disappear and adds to score
    //mosquitos just add to score
    //moths give bonuses Ex: echolocation radar comes more often, health increase,


    //BAT FOOD COLLISION
    for(var i = 0; i < this.foodArray.length; i++){
      var f = this.foodArray[i];

      //call circleInterset function from utilites
      if(circlesIntersect(this.BAT,this.foodArray[i]) ){
        if(!f.eaten){
          this.roundScore ++;
        }
        //console.log("collision");
        this.foodArray.splice(i,1);
        f.eaten = true;                
      }
    }
    //console.log("roundScore: " + this.roundScore);
    //console.log("FOOD.AMOUNT: " + this.FOOD.AMOUNT);

    if(this.roundScore >= this.FOOD.AMOUNT){
      if(this.level <= this.NUMBER_OF_LEVELS){
        this.gameState = this.GAME_STATE.ROUND_OVER;
      }
    }
    if(this.currentColor > this.skyColors.length || this.level > this.NUMBER_OF_LEVELS){
      this.gameState = this.GAME_STATE.END;
    }
  },
  toggleDebug: function(){

    if(this.debug == false){
      this.debug = true;
    }
    else{
      this.debug = false;
    }
  },
  pauseGame: function(){
    this.paused = true;
    this.sound.stopBGAudio();
    //stop the animation loop        
    cancelAnimationFrame(this.animationID);
    //call update() once so that our paused screen gets drawn
    this.update();
  },
  resumeGame: function(){

    //stop the animation loop, just in case it's running
    cancelAnimationFrame(this.animationID);
    this.paused = false;
    this.sound.playBGAudio();

    //restart the loop
    this.update();
  }

};//end app.main