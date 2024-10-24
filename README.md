# Jigsaw JS Puzzle Library (WIP)
## Demo
[Demo](https://nico-src.github.io/portfolio/projects/jigsaw-puzzle/)
## Installation
Include the script in your file:
```html
<script src="js/puzzle.js"></script>
```
## Usage
Create a Puzzle Instance:
```html
<script defer> // defer to wait till everything else loaded
     var c = document.getElementById('canvas');
     var img = document.getElementById('image');

     var puzzle = new Puzzle({
       canvas: c,
       rows: 15,
       columns: 20,
       image: img,
       maxImageWidth: 60,
       maxImageHeight: 75,
       solveRandom: true,
       hintsEnabled: false,
       scaleMultiplier: 1,
     });

     puzzle.generatePieces();
     puzzle.randomizePieces();
     requestAnimationFrame(puzzle.draw.bind(puzzle));
</script>
```
### Options
| **Property-Name** | **Default** | **Description**                                                                                        | Required |
|-------------------|-------------|--------------------------------------------------------------------------------------------------------|----------|
| animationDuration | 250ms       | How long the solve animation will take to finish.                                                      |          |
| canvas            | -            | An HTMLCanvasElement to draw the puzzle to.                                                            | •        |
| columns           | 15          | How many columns the puzzle should have.                                                               |          |
| hintsEnabled      | true        | If true the outline of the puzzle piece turns green when it is close enought to the correct position.  |          |
| image             |  -           | The Image to generate the puzzle out of.                                                               | •        |
| maxImageHeight    | 75          | Determines the Maximum Height the image can take up. (In %)                                            |          |
| maxImageWidth     | 50          | Determines the Maximum Width the image can take up. (In %)                                             |          |
| rows              | 10          | How many rows the puzzle should have.                                                                  |          |
| scaleMultiplier   | 1.0         | The Scale of the Canvas. (Higher Resolution = Worse Performance).  **Keep at 1-2 for stable performance.** |          |
| solveRandom       | false       | Boolean that tells if the solve animation duration  for each piece should be randomised a little bit.  |          |
