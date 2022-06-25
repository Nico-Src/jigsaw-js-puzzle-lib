/*
    Nico Thuniot 2022
*/

/** @const */
const DEFAULT_ROWS = 10;
/** @const */
const DEFAULT_COLUMNS = 15;
/** @const */
const MAX_IMAGE_WIDTH_PERCENTAGE = 50;
/** @const */
const MAX_IMAGE_HEIGHT_PERCENTAGE = 75;
/** @const */
const ANIMATION_DURATION = 250.0;
/** @const */
const MIN_ANIMATION_DURATION = 50.0;
/** @const */
const SOLVE_RANDOM = false;
/** @const */
const HINTS_ENABLED = true;
/** @const */
const SCALE_MULTIPLIER = 2.0;

class Puzzle{
    constructor(obj){
        /** @type {HTMLCanvasElement} */
        this.canvas = obj.canvas;
        /** @type {Number} */
        this.rows = obj.rows || DEFAULT_ROWS;
        /** @type {Number} */
        this.columns = obj.columns || DEFAULT_COLUMNS;

        /** @type {Number} */
        this.maxImageWidth = obj.maxImageWidth || MAX_IMAGE_WIDTH_PERCENTAGE;
        /** @type {Number} */
        this.maxImageHeight = obj.maxImageHeight || MAX_IMAGE_HEIGHT_PERCENTAGE;

        this.animationDuration = obj.animationDuration || ANIMATION_DURATION;
        if(this.animationDuration < MIN_ANIMATION_DURATION) this.animationDuration = MIN_ANIMATION_DURATION;

        /** @type {Number} */
        this.solveRandom = obj.solveRandom || SOLVE_RANDOM;

        /** @type {Boolean} */
        this.hintsEnabled = obj.hintsEnabled && HINTS_ENABLED;

        /** @type {CanvasRenderingContext2D} */
        this.ctx = canvas.getContext('2d');

        /** @type {Piece[]} */
        this.pieces = [];

        /** @type {HTMLImageElement} */
        this.img = obj.image;

        this.scaleMultiplier = obj.scaleMultiplier || SCALE_MULTIPLIER;

        // set canvas width and height to image dimensions
        this.canvas.width = window.innerWidth * this.scaleMultiplier;
        this.canvas.height = window.innerHeight * this.scaleMultiplier;

        /** @type {Piece} */
        this.selected = null;

        this.viewMode = 'All';

        this.pieceCount = this.rows * this.columns;

        this.debugPoints = [];

        this.translate = {x:0,y:0};

        // check if image width is greater than height
        if(this.img.width > this.img.height){
            // place image in the middle of canvas
            let width = this.canvas.width * (this.maxImageWidth / 100);
            let height = 0;
            let ratio = this.img.width / this.img.height;

            do {
                // calculate aspect ratio to calculate height
                height = width / ratio;

                // if height is greater than max image height, reduce width
                if(height > this.canvas.height * ((this.maxImageHeight / 100))){
                    width--;
                }

            } while(height > this.canvas.height * ((this.maxImageHeight / 100)));

            // calculate x and y coordinates of image
            let x = this.canvas.width / 2.0 - width / 2.0;
            let y = this.canvas.height / 2.0 - height / 2.0;

            this.imgX = x;
            this.imgY = y;
            this.imgWidth = width;
            this.imgHeight = height;
        } else {
            // place image in the middle of canvas
            let height = this.canvas.height * (this.maxImageHeight / 100);
            // calculate aspect ratio to calculate height
            let ratio = this.img.height / this.img.width;
            let width = 0;

            do {
                // calculate aspect ratio to calculate height
                width = height / ratio;

                // if height is greater than max image height, reduce width
                if(width > this.canvas.width * ((this.maxImageWidth / 100))){
                    height--;
                }

            } while(width > this.canvas.width * ((this.maxImageWidth / 100)));

            // calculate x and y coordinates of image
            let x = this.canvas.width / 2.0  - width / 2.0;
            let y = this.canvas.height / 2.0 - height / 2.0;

            this.imgX = x;
            this.imgY = y;
            this.imgWidth = width;
            this.imgHeight = height;
        }


        // add event listeners
        this.canvas.addEventListener('mousedown',() => {this.mousedown(event)});
        this.canvas.addEventListener('mousemove',() => {this.mousemove(event)});
        this.canvas.addEventListener('mouseup',() => {this.mouseup(event)});
    }

    // check if a piece was clicked and if so return it
    getClickedPiece(e){
        // check if pieces were generated if not return
        if(this.pieces.length <= 0) return;

        var clicked = null;
        var maxZIndex = 99999;

        for(var y = 0; y < this.rows; y++){            
            for(var x = 0; x < this.columns; x++){
                if(e.x>this.pieces[x][y].x && e.x<this.pieces[x][y].x + this.pieces[x][y].width){
                    if(e.y>this.pieces[x][y].y && e.y<this.pieces[x][y].y + this.pieces[x][y].height){
                        if(this.pieces[x][y].zIndex < maxZIndex && !this.pieces[x][y].isClose()){
                            if(this.viewMode === 'All'){
                                clicked = this.pieces[x][y];
                            } else if(this.viewMode === 'BorderPieces'){
                                if(this.pieces[x][y].isBorder === true){
                                    clicked = this.pieces[x][y];
                                }
                            } else if(this.viewMode === 'NonBorderPieces'){
                                if(this.pieces[x][y].isBorder === false){
                                    clicked = this.pieces[x][y];
                                }
                            }
                        }
                    }
                }
            }
        }

        return clicked;
    }

    getMousePos(e){
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: (e.clientX - rect.left) * this.scaleMultiplier,
          y: (e.clientY - rect.top) * this.scaleMultiplier,
        };
    }

    mousedown(e){
        e.stopPropagation();
        e.preventDefault();

        var pos = this.getMousePos(e);
        this.selected = this.getClickedPiece(pos);

        if(this.selected!=null){
            this.selected.offset = {
                x: e.x-this.selected.x / this.scaleMultiplier,
                y: e.y-this.selected.y / this.scaleMultiplier
            }
        }
    }

    mousemove(e){
        if(this.selected!=null){
            const rect = this.canvas.getBoundingClientRect();

            this.selected.x = (e.clientX - rect.left) * this.scaleMultiplier - this.selected.offset.x;
            this.selected.y = (e.clientY - rect.top) * this.scaleMultiplier - this.selected.offset.y;
        }

        this.currentClientY = (e.clientY - rect.top) * this.scaleMultiplier;
        this.currentClientX = (e.clientX - rect.left) * this.scaleMultiplier;
    }

    mouseup(e){
        // if there is no selected piece or pieces weren't generated already return
        if(this.selected === null || this.pieces.length <= 0) return;

        if(this.selected.isClose()){
            this.selected.snap();
        }
        this.selected = null;
    }

    generatePieces(){
        var puzzleWidth = this.imgWidth / this.columns;
        var puzzleHeight = this.imgHeight / this.rows;
        
        for(var y = 0; y < this.rows; y++){
            for(var x = 0; x < this.columns; x++){
                if(!this.pieces[x]) this.pieces[x] = [];
                this.pieces[x][y] = (new Piece({
                    x:x*puzzleWidth+this.imgX,
                    y:y*puzzleHeight+this.imgY,
                    width:puzzleWidth,
                    height:puzzleHeight,
                    row:y,
                    column:x,
                    rows:this.rows,
                    columns:this.columns,
                    img:this.img,
                    ctx:this.ctx,
                    zIndex: 0,
                    hintsEnabled: this.hintsEnabled
                }));
                this.pieces[x][y].isBorder = (y == 0 || y == this.rows-1 || x == 0 || x == this.columns-1);
            }
        }

        for(var y = 0; y < this.rows; y++){            
            for(var x = 0; x < this.columns; x++){
                var curPiece = this.pieces[x][y];

                if(y === this.rows - 1){
                    curPiece.bottom = null;
                } else {
                    var tabState = Math.random() > 0.5 ? 1 : -1;
                    var pos = tabState * (Math.random() * 0.4 + 0.3); // between 0.3 and 0.7 (to avoid overlapping tabs)
                    curPiece.bottom = pos;
                }

                if(x === this.columns - 1){
                    curPiece.right = null;
                } else {
                    var tabState = Math.random() > 0.5 ? 1 : -1;
                    var pos = tabState * (Math.random() * 0.4 + 0.3); // between 0.3 and 0.7 (to avoid overlapping tabs)
                    curPiece.right = pos;
                }

                if(x === 0){
                    curPiece.left = null;
                } else {
                    var pos = -this.pieces[x-1][y].right;
                    curPiece.left = pos;
                }

                if(y === 0){
                    curPiece.top = null;
                } else {
                    var tabState = Math.random() > 0.5 ? 1 : -1;
                    var pos = -this.pieces[x][y-1].bottom;
                    curPiece.top = pos;
                }
            }
        }
    }

    randomizePieces(){
        // get puzzle piece dimensions
        let puzzleWidth = this.pieces[0][0].width;
        let puzzleHeight = this.pieces[0][0].height;

        var x = 0;
        var y = 0;

        var placedCount = 0;

        for(var pieceList of this.pieces){
            for(var piece of pieceList){
                // generate random positions until every piece was moved
                var moved = false;
                while(moved === false){
                    // generate random x and y
                    x = Math.floor(Math.random() * this.canvas.width);
                    y = Math.floor(Math.random() * this.canvas.height);
                    
                    // on the left side
                    if(x > this.canvas.width * .11 && x < (this.imgX - puzzleWidth - 10)){
                        if(y < (this.canvas.height - puzzleHeight * 2)){
                            piece.setPosition(x,y);
                            placedCount++;
                            moved = true;

                            this.debugPoints.push({type: 'valid', x: x, y: y});
                        }
                        else {
                            console.log(`Invalid: `, {x,y});
                            this.debugPoints.push({type: 'invalid', x: x, y: y});
                            continue;
                        }
                    // in the middle
                    } else if (x > this.canvas.width * .11 && x < (this.imgX + this.imgWidth + puzzleWidth + 10)) {
                        // top or bottom middle
                        if(y < (this.imgY - puzzleHeight - 10) && y > puzzleHeight){
                            piece.setPosition(x,y);
                            placedCount++;
                            moved = true;
                            this.debugPoints.push({type: 'valid', x: x, y: y});
                        } else if(y > (this.imgY + puzzleHeight + this.imgHeight + 10) && y < (this.canvas.height - puzzleHeight - 10)){
                            piece.setPosition(x,y);
                            placedCount++;
                            moved = true;
                            this.debugPoints.push({type: 'valid', x: x, y: y});
                        }
                        else {
                            console.log(`Invalid: `, {x,y});
                            this.debugPoints.push({type: 'invalid', x: x, y: y});
                            continue;
                        }
                    // on the right
                    } else if(x > (this.imgX + this.imgWidth + puzzleWidth + 10) && x < (this.canvas.width - puzzleWidth - 10)){
                        if(y < this.canvas.height - puzzleHeight * 2){
                            piece.setPosition(x,y);
                            placedCount++;
                            moved = true;
                            this.debugPoints.push({type: 'valid', x: x, y: y});
                        } else {
                            console.log(`Invalid: `, {x,y});
                            this.debugPoints.push({type: 'invalid', x: x, y: y});
                            continue;
                        }
                    }
                    else {
                        console.log(`Invalid: `, {x,y});
                        this.debugPoints.push({type: 'invalid', x: x, y: y});
                        continue;
                    }
                }
            }
        }
    }

    draw(){
        // update canvas width and height
        this.canvas.width = window.innerWidth * this.scaleMultiplier;
        this.canvas.height = window.innerHeight * this.scaleMultiplier;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(this.translate.x,this.translate.y);

        this.ctx.globalAlpha = 0.15;
        // check if image width is greater than height
        if(this.img.width > this.img.height){
            // place image in the middle of canvas
            let width = this.canvas.width * (this.maxImageWidth / 100);
            let height = 0;
            let ratio = this.img.width / this.img.height;

            do {
                // calculate aspect ratio to calculate height
                height = width / ratio;

                // if height is greater than max image height, reduce width
                if(height > this.canvas.height * ((this.maxImageHeight / 100))){
                    width--;
                }

            } while(height > this.canvas.height * ((this.maxImageHeight / 100)));

            // calculate x and y coordinates of image
            let x = this.canvas.width / 2.0 - width / 2.0;
            let y = this.canvas.height / 2.0 - height / 2.0;

            this.imgX = x;
            this.imgY = y;
            this.imgWidth = width;
            this.imgHeight = height;

            // draw image
            this.ctx.drawImage(this.img,x,y,width,height);
        } else {
            // place image in the middle of canvas
            let height = this.canvas.height * (this.maxImageHeight / 100);
            // calculate aspect ratio to calculate height
            let ratio = this.img.height / this.img.width;
            let width = 0;

            do {
                // calculate aspect ratio to calculate height
                width = height / ratio;

                // if height is greater than max image height, reduce width
                if(width > this.canvas.width * ((this.maxImageWidth / 100))){
                    height--;
                }

            } while(width > this.canvas.width * ((this.maxImageWidth / 100)));

            // calculate x and y coordinates of image
            let x = this.canvas.width / 2.0  - width / 2.0;
            let y = this.canvas.height / 2.0 - height / 2.0;

            this.imgX = x;
            this.imgY = y;
            this.imgWidth = width;
            this.imgHeight = height;

            // draw image
            this.ctx.drawImage(this.img,x,y,width,height);
        }
        this.ctx.globalAlpha = 1;

        // For Debugging Random Placement
        /*for(var point of this.debugPoints){
            if(point.type === 'valid'){
                this.ctx.fillStyle = `rgb(0,255,0)`;
                this.ctx.fillRect(point.x,point.y,10,10);
                this.ctx.fillText(`${point.x},${point.y}`,point.x,point.y);
            } else {
                this.ctx.fillStyle = `rgb(255,0,0)`;
                this.ctx.fillRect(point.x,point.y,10,10);
                this.ctx.fillText(`${point.x},${point.y}`,point.x,point.y);
            }
        }*/

        this.pieces.forEach(pieceList => {
            pieceList.forEach((piece)=>{
                if(piece.animation){
                    // animate piece to destination
                    piece.x += piece.animation.dX * piece.animation.xFactor;
                    piece.y += piece.animation.dY * piece.animation.yFactor;

                    if(piece.isClose()){
                        piece.animation = undefined;
                        piece.snap();
                        this.solved = true;
                    }
                }

                if((!piece.isClose() && this.selected !== piece) || (piece.isClose() || this.selected === piece)){
                    if(this.viewMode === 'All'){
                        piece.draw(this.ctx);
                    } else if(this.viewMode === 'BorderPieces'){
                        if(piece.isBorder === true || piece.snapped === true) piece.draw(this.ctx);
                    } else if(this.viewMode === 'NonBorderPieces'){
                        if(piece.isBorder === false || piece.snapped === true) piece.draw(this.ctx);
                    }
                }
            });
        });

        this.ctx.restore();

        requestAnimationFrame(this.draw.bind(this));
    }

    solve(){
        this.viewMode = 'All';
        this.pieces.forEach(pieceList => {
            pieceList.forEach((piece)=>{
                let animationDuration = (this.solveRandom === true ? Math.floor(Math.random() * this.animationDuration + MIN_ANIMATION_DURATION) : this.animationDuration);
                let xFactor = piece.x < piece.xCorrect ? 1 : -1;
                let dX = Math.abs(piece.x - piece.xCorrect) / animationDuration;

                let yFactor = piece.y < piece.yCorrect ? 1 : -1;
                let dY = Math.abs(piece.y - piece.yCorrect) / animationDuration;

                piece.animation = {
                    dX,
                    dY,
                    xFactor,
                    yFactor
                }
            });
        });
    }

    toggleHints(val){
        this.hintsEnabled = val;
        this.pieces.forEach(pieceList => {
            pieceList.forEach((piece)=>{
                piece.hintsEnabled = val;
            });
        });
        console.log(this);
    }
}

class Piece{
    constructor(obj){
        this.x = obj.x;
        this.xCorrect = obj.x;
        this.y = obj.y;
        this.yCorrect = obj.y;
        this.row = obj.row;
        this.zIndex = obj.zIndex;
        this.hintsEnabled = obj.hintsEnabled;
        this.column = obj.column;
        this.rows = obj.rows;
        this.columns = obj.columns;
        this.img = obj.img;
        this.width = obj.width;
        this.height = obj.height;
        this.ctx = obj.ctx;
    }

    draw(ctx){
        ctx.fillStyle = '#000';
        ctx.beginPath();

        const size = Math.min(this.width, this.height);
        const neck = 0.1 * size;
        const tabWidth = 0.2 * size;
        const tabHeight = 0.2 * size;

        if(this.isClose() && !this.snapped && this.hintsEnabled === true){
            this.ctx.strokeStyle = 'rgb(0,255,0)';
        } else if(!this.snapped) {
            this.ctx.strokeStyle = '#000';
        } else {
            this.ctx.strokeStyle = 'rgba(1,1,1,0)';
        }

        // from top left
        ctx.moveTo(this.x,this.y);
        // to top right
        if(this.top){
            ctx.lineTo(this.x+this.width*Math.abs(this.top)-neck,this.y);
            ctx.bezierCurveTo(
                this.x+this.width*Math.abs(this.top)-neck,
                this.y-tabHeight*Math.sign(this.top)*0.2,

                this.x+this.width*Math.abs(this.top)-tabWidth,
                this.y-tabHeight*Math.sign(this.top),

                this.x+this.width*Math.abs(this.top),
                this.y-tabHeight*Math.sign(this.top)
            );
            ctx.bezierCurveTo(
                this.x+this.width*Math.abs(this.top)+tabWidth,
                this.y-tabHeight*Math.sign(this.top),

                this.x+this.width*Math.abs(this.top)+neck,
                this.y-tabHeight*Math.sign(this.top)*0.2,

                this.x+this.width*Math.abs(this.top)+neck,
                this.y
            );
            ctx.lineTo(this.x+this.width*Math.abs(this.top)+neck,this.y);
        }
        ctx.lineTo(this.x+this.width,this.y);
        // to bottom right
        if(this.right){
            ctx.lineTo(this.x+this.width,this.y+this.height*Math.abs(this.right)-neck);
            ctx.bezierCurveTo(
                this.x+this.width-tabHeight*Math.sign(this.right)*0.2,
                this.y+this.height*Math.abs(this.right)-neck,

                this.x+this.width-tabHeight*Math.sign(this.right),
                this.y+this.height*Math.abs(this.right)-tabWidth,

                this.x+this.width-tabHeight*Math.sign(this.right),
                this.y+this.height*Math.abs(this.right)
            );
            ctx.bezierCurveTo(
                this.x+this.width-tabHeight*Math.sign(this.right),
                this.y+this.height*Math.abs(this.right)+tabWidth,

                this.x+this.width-tabHeight*Math.sign(this.right)*0.2,
                this.y+this.height*Math.abs(this.right)+neck,

                this.x+this.width,
                this.y+this.height*Math.abs(this.right)+neck
            );
            ctx.lineTo(this.x+this.width,this.y+this.height*Math.abs(this.right)+neck);
        }
        ctx.lineTo(this.x+this.width,
                   this.y+this.height);
        // to bottom left
        if(this.bottom){
            ctx.lineTo(this.x+this.width*Math.abs(this.bottom)+neck,this.y+this.height);
            ctx.bezierCurveTo(
                this.x+this.width*Math.abs(this.bottom)+neck,
                this.y+this.height+tabHeight*Math.sign(this.bottom)*0.2,

                this.x+this.width*Math.abs(this.bottom)+tabWidth,
                this.y+this.height+tabHeight*Math.sign(this.bottom),

                this.x+this.width*Math.abs(this.bottom),
                this.y+this.height+tabHeight*Math.sign(this.bottom)
            );
            ctx.bezierCurveTo(
                this.x+this.width*Math.abs(this.bottom)-tabWidth,
                this.y+this.height+tabHeight*Math.sign(this.bottom),

                this.x+this.width*Math.abs(this.bottom)-neck,
                this.y+this.height+tabHeight*Math.sign(this.bottom)*0.2,

                this.x+this.width*Math.abs(this.bottom)-neck,
                this.y+this.height
            );
            ctx.lineTo(this.x+this.width*Math.abs(this.bottom)-neck,this.y+this.height);
        }
        ctx.lineTo(this.x,this.y+this.height);
        // back to top left
        if(this.left){
            ctx.lineTo(this.x,this.y+this.height*Math.abs(this.left)+neck);
            ctx.bezierCurveTo(
                this.x+tabHeight*Math.sign(this.left)*0.2,
                this.y+this.height*Math.abs(this.left)+neck,

                this.x+tabHeight*Math.sign(this.left),
                this.y+this.height*Math.abs(this.left)+tabWidth,

                this.x+tabHeight*Math.sign(this.left),
                this.y+this.height*Math.abs(this.left)
            );

            ctx.bezierCurveTo(
                this.x+tabHeight*Math.sign(this.left),
                this.y+this.height*Math.abs(this.left)-tabWidth,

                this.x+tabHeight*Math.sign(this.left)*0.2,
                this.y+this.height*Math.abs(this.left)-neck,

                this.x,
                this.y+this.height*Math.abs(this.left)-neck
            );
            ctx.lineTo(this.x,this.y+this.height*Math.abs(this.left)-neck);
        }
        ctx.lineTo(this.x,this.y);

        ctx.save();
        ctx.clip();

        const scaledTabHeight = Math.min(this.img.width/this.columns,
                                this.img.height/this.rows)*tabHeight/size;

        ctx.drawImage(this.img,
            this.column*(this.img.width/this.columns)-scaledTabHeight,
            this.row*(this.img.height/this.rows)-scaledTabHeight,
            this.img.width/this.columns+(scaledTabHeight*2),
            this.img.height/this.rows+(scaledTabHeight*2),
            this.x-tabHeight,
            this.y-tabHeight,
            this.width+tabHeight*2,
            this.height+tabHeight*2);

        ctx.restore();
        ctx.stroke();
        this.ctx.strokeStyle = '#000';
    }

    setPosition(x,y){
        this.x = x;
        this.y = y;
    }

    isClose(){
        if(this.distance({x:this.x,y:this.y},{x:this.xCorrect,y:this.yCorrect})<=this.width/5){
            return true;
        }
        return false;
    }

    snap(){
        this.x = this.xCorrect;
        this.y = this.yCorrect;
        this.snapped = true;
    }

    distance(a,b){
        return Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2));
    }
}