// Pigleto Game - Tomasz Borowski, Arkadiusz Kwa�ny - 2012

Game = {
	width: 640,
	height: 480,
	
	initialTimeToPill: 2000,
	initialSpeed: 0.8,
	initialLives: 5,
	initialScore: 0,
	
	timeToPill: 2000,
	currentTimeToPill: 2000,
	speed: 0.8,
	acceleration: 0.05,
	
	score: 0,
	highscore:0,
	lives: 5,
	
	goodPoints: 100,
	badPoints: 150,
		
	colors: ['red', 'yellow', 'green', 'blue'],	
	stage: null,
	
	state: 'init',
		
	objects: new Kinetic.Layer(),
	doc: null,
	cover: null,
	
	scoreText: null,
	livesText: null,
	intoText: null,

	init: function() {
		var self = this;
		this.stage = new Kinetic.Stage({
			container: "container",
			width: this.width,
			height: this.height
		});		
				
		this.stage.add(this.objects);			
 	    this.stage.onFrame(function(frame) {
			if (self.state == 'play') {
			  if (self.currentTimeToPill < 0) {
				self.generatePill();
				self.cover.moveToTop();
				self.currentTimeToPill = self.timeToPill;			
			  } else {
				self.currentTimeToPill -= frame.timeDiff * self.speed;
			  }					
			}
		
		  for (index in self.objects.getChildren()) { 
			obj = self.objects.getChildren()[index]; 
			if(obj.update) {
				obj.update(frame) ;			
			}
		  }
		  self.objects.draw();
		});		
		this.stage.start();			
		this.sounds.init();
		this.displayIntro();
	},
	
	generatePill: function() {				
		var position= {x:0, y: Math.floor(Math.random()*15) + 315};
		var color = this.colors[Math.floor(Math.random()*this.colors.length)];
 	    var pill = new Game.Pill({
			  color: color,
			  x: position.x,
			  y: position.y,
		});									
		this.objects.add(pill);	
	},
	
	generateBottles: function() {
		var position = {x:40, y:130};
		for(index in this.colors) {		   					
			var bottle = new Game.Bottle({
				color: this.colors[index],
				x: position.x,
				y: position.y
			})
			position.x += bottle.getWidth() * 2;
			this.objects.add(bottle);						
		}
	},
	
	addPoints: function(){
		this.score += this.goodPoints;
		this.speed += this.acceleration;
		this.doc.doOk();
		this.sounds.play('pills');
	},
	
	removePoints: function(){
		this.score -= this.badPoints;
		this.doc.doWrong();
		this.sounds.play('drop');
	},
	
	removeLife: function(){
		this.lives -= 1;
		this.doc.doWrong();
		if (this.lives == 0) {
			this.endGame();
		}		
		this.sounds.play('drop');
	},
	
// ************* STATES *********************
// ******************************************	
	
	startGame: function(){
		self = this;
		this.objects.remove(this.introText);
		this.lives = this.initialLives;
		this.timeToPill = this.initialTimeToPill;
		this.speed = this.initialSpeed;	
		this.score = this.initialScore;
		
		this.state = 'play';
		this.generateBottles();
			
		this.doc = new Game.Doc({});
		this.cover = new Game.Cover({});
		this.scoreText = new Game.ScoreText({});		
		this.livesText = new Game.LivesText({});
		
		this.objects.add(this.scoreText);
		this.objects.add(this.livesText);				
		this.objects.add(this.doc);
		this.objects.add(this.cover);		
		this.sounds.play('music');
	},
	
	endGame: function(){
		this.objects.removeChildren();
		if (this.highscore < this.score) {
			this.highscore = this.score
			this.sounds.play('win');
		} else {
			this.sounds.play('fail');
		}
		this.sounds.stop('music');
		this.displayIntro();
	},
	
	displayIntro: function() {
		this.state = 'intro';
		this.introText = new Game.IntroText({});
		this.objects.add(this.introText);		
	}
};

// ************* CLASSES ********************
// ******************************************

Game.Bottle = Kinetic.Image.extend({
	imageObj: null,
	init: function(a){
		this.imageObj = new Image();
		this.color = a.color;	
		this.setDefaultAttrs({width:50,height:70, image: this.imageObj});
		this._super(a);
		this.imageObj.src = "assets/bottles/bottle_"+a.color+".png";
	}
});

Game.Pill = Kinetic.Image.extend({
	isMoving: true,
	imageObj: null,
	init: function(a){
		var self = this;
		this.imageObj = new Image();
		this.color = a.color;
		this.setDefaultAttrs({width:32,height:16,draggable:true,image: this.imageObj});
		this._super(a);
		this.imageObj.src = "assets/pills/pill_"+a.color+".png";
		this.on('dragstart', self.onDrag);
		this.on('dragend', self.onDrop);				
	},
	update: function(frame) {		
		if (this.isMissed()) {
			Game.objects.remove(this);
			Game.removeLife();
		} else if (this.isMoving) {
			this.move(Game.speed,0);
		}		
	},
	isMissed: function(){
		return this.getX() > Game.width
	},
	onDrag: function(evt){
		this.setScale(2,2);
		this.isMoving = false;
	},
	onDrop: function(evt){
		var bottle = Game.objects.getIntersections(evt.offsetX, evt.offsetY)[0];
		
		if (bottle && this != bottle && bottle.color == this.color) {
			Game.addPoints();
		} else {
			Game.removePoints();	
		}
		Game.objects.remove(this);	
	}
});

Game.Doc = Kinetic.Image.extend({
	imageObj: null,
	init: function(a){
		this.imageObj = new Image();
		this.color = a.color;	
		this.setDefaultAttrs({x:440, y:85, width:190,height:230, image: this.imageObj});
		this._super(a);
		this.doOk();
	},
	doOk: function(){
		this.imageObj.src = "assets/doctor_good.png";		
		this.setSize(190,230);
	},
	doWrong: function(){
		this.imageObj.src = "assets/doctor_bad.png";
		this.setSize(220,230);
	}
});

Game.Cover = Kinetic.Image.extend({
	imageObj: null,
	init: function(a){
		this.imageObj = new Image();
		this.color = a.color;	
		this.setDefaultAttrs({x:0, y:297, width:54,height:108, image: this.imageObj});
		this._super(a);
		this.imageObj.src = "assets/cover.png";		
	}
});

Game.ScoreText = Kinetic.Text.extend({
	init: function(a){
		this.setDefaultAttrs({
          x: 5,
          y: 5,
          text: this.fetchText(),
          fontSize: 14,
          fontFamily: "Calibri",
          textFill: "white",
		  fontStyle: "bold"
		});
		this._super(a);
	},
	fetchText: function(){
		return 'Your score: ' + Game.score + ' points'
	},
	update: function(frame) {
		this.setText(this.fetchText());
	}
});

Game.LivesText = Kinetic.Text.extend({
	init: function(a){
		this.setDefaultAttrs({
          x: 500,
          y: 5,
          text: this.fetchText(),
          fontSize: 14,
          fontFamily: "Calibri",
          textFill: "white",
		  fontStyle: "bold"
		});
		this._super(a);
	},
	fetchText: function(){
		return 'Lives: ' + Game.lives
	},
	update: function(frame) {
		this.setText(this.fetchText());
	}
});

Game.IntroText = Kinetic.Text.extend({
	init: function(a){
		self = this;
		this.setDefaultAttrs({
          x: 100,
          y: 60,
		  lineHeight: 1.5,
          stroke: '#555',
          strokeWidth: 5,
          fill: '#ddd',
          text: 'Welcome to PIGLETO!\n\nTry to sort our pills properly. Doc will grant you with '+Game.goodPoints+' points for each good matching. If you made a mistake, then you can say goodbye to your '+Game.badPoints+' points. You can miss up to '+Game.initialLives+' pills. Good luck!\n\nCLICK TO START\n\nScore: '+Game.score+' points\nHighscore: '+Game.highscore+' points',
          fontSize: 14,
          fontFamily: 'Calibri',
          textFill: '#555',
          width: 440,
          padding: 20,
          align: 'center',
          fontStyle: 'italic',
          shadow: {
            color: 'black',
            blur: 1,
            offset: [10, 10],
            alpha: 0.2
          },
          cornerRadius: 10
		});
		this._super(a);
		this.on('mousedown touchstart', self.onClick);			
	},
	onClick:function(){		
		Game.startGame();
	}
});

// ************** SOUNDS ********************
// ******************************************

Game.sounds = {
	list: {
		music: new Audio('assets/sfx/music.mp3'),
		fail: new Audio('assets/sfx/end.mp3'),
		win: new Audio('assets/sfx/win.mp3'),
		pills: new Audio('assets/sfx/pills.mp3'),
		drop: new Audio('assets/sfx/drop.mp3')
	},
	
	init: function() {
		this.list.music.loop = true;
	},

	play: function(name, attrs) {
		this.list[name].play();
	},
	
	stop: function(name) {
		this.list[name].pause();
	}	
};