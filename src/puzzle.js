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

        /** @type {Number} */
        this.animationDuration = obj.animationDuration || ANIMATION_DURATION;
        // if animation duration is too low, set it to the minimum
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

        /** @type {Number} */
        /** @description THIS AFFECTS PERFORMANCE (for stable use default of 1) */
        this.scaleMultiplier = obj.scaleMultiplier || SCALE_MULTIPLIER;

        // set canvas width and height to image dimensions multiplied by scale multiplier
        this.canvas.width = window.innerWidth * this.scaleMultiplier;
        this.canvas.height = window.innerHeight * this.scaleMultiplier;

        /** @type {Piece} */
        this.selected = null;

        /** @type {String} */
        this.viewMode = 'All';

        /** @type {Number} */
        this.pieceCount = this.rows * this.columns;

        /** @type {Object[]} */
        this.debugPoints = [];

        /** @type {{x,y}} */
        this.translate = {x:0,y:0};

        // check if image width is greater than height
        if(this.img.width > this.img.height){
            // calculate width of image
            let width = this.canvas.width * (this.maxImageWidth / 100);
            let height = 0;
            // calculate aspect ratio of original image
            let ratio = this.img.width / this.img.height;

            do {
                // calculate height with aspect ratio
                height = width / ratio;

                // if height is greater than max image height, reduce width and recalculate height
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
            // calculate height of image
            let height = this.canvas.height * (this.maxImageHeight / 100);
            let width = 0;
            // calculate aspect ratio of original image
            let ratio = this.img.height / this.img.width;

            do {
                // calculate width with aspect ratio
                width = height / ratio;

                // if width is greater than max image width, reduce height and recalculate width
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

    /**
     * Find the clicked piece
     * @param {MouseEvent} e - mouse event object holding the information about the click
     * @returns the piece that was clicked (if none was found returns null)
     */
    getClickedPiece(e){
        // check if pieces were generated if not return
        if(this.pieces.length <= 0) return;

        var clicked = null;

        for(var y = 0; y < this.rows; y++){            
            for(var x = 0; x < this.columns; x++){
                // check if mouse coordinates overlap with piece
                if(e.x>this.pieces[x][y].x && e.x<this.pieces[x][y].x + this.pieces[x][y].width){
                    if(e.y>this.pieces[x][y].y && e.y<this.pieces[x][y].y + this.pieces[x][y].height){
                        // only return piece if it is not in the right place already
                        if(!this.pieces[x][y].isClose()){
                            // depending on the view-mode only show specific pieces
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

        // return the clicked piece
        return clicked;
    }

    /**
     * calculate relative mouse position in the canvas (without it scaling messes with the mouse coordinates)
     * @param {MouseEvent} e 
     * @returns object with transformed x and y coordinates
     */
    getMousePos(e){
        const rect = this.canvas.getBoundingClientRect();
        return {
          x: (e.clientX - rect.left) * this.scaleMultiplier,
          y: (e.clientY - rect.top) * this.scaleMultiplier,
        };
    }

    /**
     * Event Handler for Clicks on the canvas
     * @param {MouseEvent} e - mouse event object holding the information about the click 
     */
    mousedown(e){
        // prevent default and stop propagation
        e.stopPropagation();
        e.preventDefault();

        // get transformed mouse position
        var pos = this.getMousePos(e);
        // get clicked piece at mouse position
        this.selected = this.getClickedPiece(pos);

        // if there is a selected piece set the offset
        if(this.selected!=null){
            this.selected.offset = {
                x: e.x-this.selected.x / this.scaleMultiplier,
                y: e.y-this.selected.y / this.scaleMultiplier
            }
        }
    }

    /**
     * Event Handler for Mouse Moves on the canvas
     * @param {MouseEvent} e - mouse event object holding the information about the click 
     */
    mousemove(e){
        // if there is a selected piece move it
        if(this.selected!=null){
            const rect = this.canvas.getBoundingClientRect();

            // transform mouse position to relative position in the canvas + the offset
            this.selected.x = (e.clientX - rect.left) * this.scaleMultiplier - this.selected.offset.x;
            this.selected.y = (e.clientY - rect.top) * this.scaleMultiplier - this.selected.offset.y;
        }
        // else just set the current mouse position
        this.currentClientY = (e.clientY - rect.top) * this.scaleMultiplier;
        this.currentClientX = (e.clientX - rect.left) * this.scaleMultiplier;
    }

    /**
     * Event Handler for realeasing the mouse
     * @param {MouseEvent} e - mouse event object holding the information about the click 
     */
    mouseup(e){
        // if there is no selected piece or pieces weren't generated already return
        if(this.selected === null || this.pieces.length <= 0) return;

        // if the selected tile is close enough to the correct position snap it to the correct position
        if(this.selected.isClose()){
            this.selected.snap();
        }

        // set selected to null
        this.selected = null;
    }

    /**
     * Generates each piece for the puzzle
     */
    generatePieces(){
        // calculate the width and height of each puzzle piece
        var puzzleWidth = this.imgWidth / this.columns;
        var puzzleHeight = this.imgHeight / this.rows;
        
        // create pieces and initialize them with their coordinates and other properties
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

                // set boolean to tell if piece is a border piece or not
                this.pieces[x][y].isBorder = (y == 0 || y == this.rows-1 || x == 0 || x == this.columns-1);
            }
        }

        // generate tabs of the piece
        for(var y = 0; y < this.rows; y++){            
            for(var x = 0; x < this.columns; x++){
                var curPiece = this.pieces[x][y];

                // if piece is in the last row there is no bottom tab
                if(y === this.rows - 1){
                    curPiece.bottom = null;
                } else {
                    // randomly decide if the tab is inner or outer and at which position it is
                    var tabState = Math.random() > 0.5 ? 1 : -1;
                    var pos = tabState * (Math.random() * 0.4 + 0.3); // between 0.3 and 0.7 (to avoid overlapping tabs)
                    curPiece.bottom = pos;
                }

                // if piece is in the last column there is no right tab
                if(x === this.columns - 1){
                    curPiece.right = null;
                } else {
                    // randomly decide if the tab is inner or outer and at which position it is
                    var tabState = Math.random() > 0.5 ? 1 : -1;
                    var pos = tabState * (Math.random() * 0.4 + 0.3); // between 0.3 and 0.7 (to avoid overlapping tabs)
                    curPiece.right = pos;
                }

                // if piece is in the first column there is no left tab
                if(x === 0){
                    curPiece.left = null;
                } else {
                    // tab type and position must be the opposite of the previous piece
                    // e.g: Piece1 (Type: 'outer', Pos: 0.3) -> Piece2 (Type: 'inner', Pos: -0.3)
                    var pos = -this.pieces[x-1][y].right;
                    curPiece.left = pos;
                }

                // if piece is in the first row there is no top tab
                if(y === 0){
                    curPiece.top = null;
                } else {
                    // tab type and position must be the opposite of the previous piece
                    // e.g: Piece1 (Type: 'outer', Pos: 0.3) -> Piece2 (Type: 'inner', Pos: -0.3)
                    var pos = -this.pieces[x][y-1].bottom;
                    curPiece.top = pos;
                }
            }
        }
    }

    /**
     * Randomize the puzzle pieces positions
     */
    randomizePieces(){
        // get puzzle piece dimensions
        let puzzleWidth = this.pieces[0][0].width;
        let puzzleHeight = this.pieces[0][0].height;

        var x = 0;
        var y = 0;

        // iterate over all pieces
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
                            moved = true;
                            this.debugPoints.push({type: 'valid', x: x, y: y});
                        }
                        else {
                            this.debugPoints.push({type: 'invalid', x: x, y: y});
                            continue;
                        }
                    // in the middle
                    } else if (x > this.canvas.width * .11 && x < (this.imgX + this.imgWidth + puzzleWidth + 10)) {
                        // top or bottom middle
                        if(y < (this.imgY - puzzleHeight - 10) && y > puzzleHeight){
                            piece.setPosition(x,y);
                            moved = true;
                            this.debugPoints.push({type: 'valid', x: x, y: y});
                        } else if(y > (this.imgY + puzzleHeight + this.imgHeight + 10) && y < (this.canvas.height - puzzleHeight - 10)){
                            piece.setPosition(x,y);
                            moved = true;
                            this.debugPoints.push({type: 'valid', x: x, y: y});
                        }
                        else {
                            this.debugPoints.push({type: 'invalid', x: x, y: y});
                            continue;
                        }
                    // on the right
                    } else if(x > (this.imgX + this.imgWidth + puzzleWidth + 10) && x < (this.canvas.width - puzzleWidth - 10)){
                        if(y < this.canvas.height - puzzleHeight * 2){
                            piece.setPosition(x,y);
                            moved = true;
                            this.debugPoints.push({type: 'valid', x: x, y: y});
                        } else {
                            console.log(`Invalid: `, {x,y});
                            this.debugPoints.push({type: 'invalid', x: x, y: y});
                            continue;
                        }
                    }
                    else {
                        this.debugPoints.push({type: 'invalid', x: x, y: y});
                        continue;
                    }
                }
            }
        }
    }

    /**
     * Draw puzzle pieces, background image etc...
     */
    draw(){
        // update canvas width and height
        this.canvas.width = window.innerWidth * this.scaleMultiplier;
        this.canvas.height = window.innerHeight * this.scaleMultiplier;

        // clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        // translate by current translation
        this.ctx.translate(this.translate.x,this.translate.y);

        // set alpha to draw background image
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

        // restore previous opacity
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

        // draw all puzzle pieces
        this.pieces.forEach(pieceList => {
            pieceList.forEach((piece)=>{
                // if the piece has an animation, draw it
                if(piece.animation){
                    // animate piece to destination
                    piece.x += piece.animation.dX * piece.animation.xFactor;
                    piece.y += piece.animation.dY * piece.animation.yFactor;

                    // if the piece is already close snap piece to destination, remove animation and set solved to true
                    if(piece.isClose()){
                        piece.animation = undefined;
                        piece.snap();
                        this.solved = true;
                    }
                }


                if(this.viewMode === 'All'){
                    piece.draw(this.ctx);
                } else if(this.viewMode === 'BorderPieces'){
                    if(piece.isBorder === true || piece.snapped === true) piece.draw(this.ctx);
                } else if(this.viewMode === 'NonBorderPieces'){
                    if(piece.isBorder === false || piece.snapped === true) piece.draw(this.ctx);
                }
            });
        });

        this.ctx.restore();

        // call draw function again
        requestAnimationFrame(this.draw.bind(this));
    }

    /**
     * Automatically solves the puzzle with an anmation
     */
    solve(){
        // reset view mode to show all pieces
        this.viewMode = 'All';
        // iterate over all pieces
        this.pieces.forEach(pieceList => {
            pieceList.forEach((piece)=>{
                // get animation duration (in ms)
                let animationDuration = (this.solveRandom === true ? Math.floor(Math.random() * this.animationDuration + MIN_ANIMATION_DURATION) : this.animationDuration);
                // calculate deltaX and deltaY
                let xFactor = piece.x < piece.xCorrect ? 1 : -1;
                let dX = Math.abs(piece.x - piece.xCorrect) / animationDuration;

                let yFactor = piece.y < piece.yCorrect ? 1 : -1;
                let dY = Math.abs(piece.y - piece.yCorrect) / animationDuration;

                // set piece animation
                piece.animation = {
                    dX,
                    dY,
                    xFactor,
                    yFactor
                }
            });
        });
    }

    /**
     * Toggles the hint outline around the pieces
     * @param {Boolean} val 
     */
    toggleHints(val){
        this.hintsEnabled = val;
        // iterate over all pieces and set hintsEnabled to true
        this.pieces.forEach(pieceList => {
            pieceList.forEach((piece)=>{
                piece.hintsEnabled = val;
            });
        });
    }
}

class Piece{
    constructor(obj){
        /** @type {Number} */
        this.x = obj.x;
        /** @type {Number} */
        this.xCorrect = obj.x;
        /** @type {Number} */
        this.y = obj.y;
        /** @type {Number} */
        this.yCorrect = obj.y;
        /** @type {Number} */
        this.row = obj.row;
        /** @type {Number} */
        this.zIndex = obj.zIndex;
        /** @type {Boolean} */
        this.hintsEnabled = obj.hintsEnabled;
        /** @type {Number} */
        this.column = obj.column;
        /** @type {Number} */
        this.rows = obj.rows;
        /** @type {Number} */
        this.columns = obj.columns;
        /** @type {HTMLImageElement} */
        this.img = obj.img;
        /** @type {Number} */
        this.width = obj.width;
        /** @type {Number} */
        this.height = obj.height;
        /** @type {CanvasRenderingContext2D} */
        this.ctx = obj.ctx;
    }

    /**
     * Draws the puzzle piece
     * @param {CanvasRenderingContext2D} ctx - the canvas context to draw the piece on
     */
    draw(ctx){
        ctx.fillStyle = '#000';
        ctx.beginPath();

        // calculate puzzle stats
        const size = Math.min(this.width, this.height);
        const neck = 0.1 * size;
        const tabWidth = 0.2 * size;
        const tabHeight = 0.2 * size;

        // if the piece is close to the correct position, not already snapped and hints are enabled, draw the hint outline
        if(this.isClose() && !this.snapped && this.hintsEnabled === true){
            this.ctx.strokeStyle = 'rgb(0,255,0)';
        // else if the piece is not close to the correct position draw the default outline
        } else if(!this.snapped) {
            this.ctx.strokeStyle = '#000';
        // else the piece is already on the correct position so don't draw the outline
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
        // clip contents so the image part fits to the puzzle piece
        ctx.clip();

        const scaledTabHeight = Math.min(this.img.width/this.columns,
                                this.img.height/this.rows)*tabHeight/size;

        // draw the cropped image to the puzzle piece
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

    /**
     * sets the position of the current piece
     * @param {Number} x - destination x coordinate 
     * @param {Number} y - destination y coordinate
     */
    setPosition(x,y){
        this.x = x;
        this.y = y;
    }

    /**
     * checks if the piece is close enough to the correct position
     * @returns {Boolean} true if the piece is close enough to the correct position
     */
    isClose(){
        // check distance against threshold
        if(this.distance({x:this.x,y:this.y},{x:this.xCorrect,y:this.yCorrect})<=this.width/5){
            return true;
        }
        return false;
    }

    /**
     * Snap the piece to the correct position
     */
    snap(){
        this.x = this.xCorrect;
        this.y = this.yCorrect;
        this.snapped = true;
    }

    /**
     * calculates the distance between two points
     * @param {Number} a 
     * @param {Number} b 
     * @returns {Number} distance between the two points
     */
    distance(a,b){
        return Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2));
    }
}