var p = {
    resolution: 130,
    pointSize: 11,
    ballNb: 9,
    cols: 0,
    row: 0,
    threshold: 0.1,
    ballMin: 10,
    ballMax: 160,
    noiseSpeed: 2,
    noiseScale: 0.07,
    drawGrid: true,
    noise: false,
    drawCircle: false,
    drawPoint: false,
    interpolate: false,
    darkmode: true
};

var gui = new dat.GUI();
const parametersFolder = gui.addFolder("Parameters")
const boolFolder = gui.addFolder("Bools")
const noiseFolder = gui.addFolder("Noise")
const ballsFolder = gui.addFolder("Balls")

parametersFolder.add(p, "resolution").min(10).max(1000).step(1).onChange(function() {
    init()
}).name("Resolution")

parametersFolder.add(p, "threshold").min(0).max(1).step(0.01).onChange(function() {}).name("Threshold")

boolFolder.add(p, "drawGrid").name("Draw the grid").onChange(function() {
    drawGrid()
})

boolFolder.add(p, "drawCircle").name("Draw the balls")
boolFolder.add(p, "drawPoint").name("Draw the points")
boolFolder.add(p, "interpolate").name("Interpolation")
boolFolder.add(p, "noise").name("Noise").onChange(function() {
    SwitchBallsNoise()
})
boolFolder.add(p, "darkmode").name("Active dark mode").onChange(function() {
    changeBackground()
    drawGrid()
})


noiseFolder.add(p, "noiseScale").min(0).max(1).step(0.01).onChange(function() {}).name("NoiseScale")
noiseFolder.add(p, "noiseSpeed").min(0).max(10).step(0.01).onChange(function() {}).name("Noise Speed")


ballsFolder.add(p, "ballNb").min(1).max(100).step(1).onChange(function() {
    initBall()
}).name("Ball Number");

ballsFolder.add(p, "ballMin").name("Ball Minimum Size").min(1).max(50).step(1).onChange(function() {
    initBall()
})

ballsFolder.add(p, "ballMax").name("Ball Maximum Size").min(50).max(200).step(1).onChange(function() {
    initBall()
})


gui.__folders["Parameters"].open()
gui.__folders["Bools"].open()
gui.__folders["Noise"].open()
gui.__folders["Balls"].open()

class vector {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
}

var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")

var canvasGrid = document.getElementById("grid")
var ctxGrid = canvasGrid.getContext("2d")


var width
var height


var pointArray = []
var ballArray = []

config = [
    [0, 0, 0, 0], //0
    [0, 0.5, 0.5, 1], //1
    [0.5, 1, 1, 0.5], //2
    [0, 0.5, 1, 0.5], //3
    [0.5, 0, 1, 0.5], //4
    [0, 0.5, 0.5, 0, 0.5, 1, 1, 0.5], //5
    [0.5, 0, 0.5, 1], //6
    [0, 0.5, 0.5, 0], //7
    [0, 0.5, 0.5, 0], //8
    [0.5, 0, 0.5, 1], //9
    [0, 0.5, 0.5, 1, 0.5, 0, 1, 0.5], //10
    [0.5, 0, 1, 0.5], //11
    [0, 0.5, 1, 0.5], //12
    [0.5, 1, 1, 0.5], //13
    [0, 0.5, 0.5, 1], //14
    [0, 0, 0, 0], //15
]
var mouse = {
    x: -100,
    y: -100
}


var r

class ball {
    constructor() {
        this.radius = randomRange(p.ballMin, p.ballMax)
        this.x = Math.random() * (width - this.radius * 2) + this.radius
        this.y = Math.random() * (height - this.radius * 2) + this.radius
        this.velocity = {
            dx: randomRange(-3, 3, 0),
            dy: randomRange(-3, 3, 0)
        }
    }
    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.strokeStyle = "red"
        ctx.stroke()
        ctx.closePath()
    }
    update() {
        if (this.x + this.radius > width || this.x - this.radius < 0) {
            this.velocity.dx = -this.velocity.dx
        }
        if (this.y + this.radius > height || this.y - this.radius < 0) {
            this.velocity.dy = -this.velocity.dy
        }

        this.x += this.velocity.dx
        this.y += this.velocity.dy
    }
}
class interactableMovingBall {
    constructor() {
        this.radius = randomRange(p.ballMin, p.ballMax)
        this.x = -200;
        this.y = -200;

    }
    draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.strokeStyle = "red"
        ctx.stroke()
        ctx.closePath()
    }
    update() {
        this.x = mouse.x
        this.y = mouse.y
    }
}
class point {
    //Constructor
    constructor(x, y) {
            this.radius = 10
            this.active = true
            this.x = x * r
            this.y = y * r
            this.value = 0;
        }
        //Draw the point
    draw() {
        if (!this.active) //If the value of the point is above the threshold
            return // Don't need to spent time on a point that is below the threshold

        this.radius = p.pointSize; //p.pointisze is set with "r"

        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
            // There is two mode, with ball or with noise
            //Set the color in function of the value of the point, the range of the value is different between the two mode, 
            //that why this is two different instruction
        if (!p.noise)
            ctx.fillStyle = `hsl(0, 100%, ${Math.pow(this.value * 30, 2)}%)`
        else
            ctx.fillStyle = `hsl(0, 100%, ${this.value * 100}%)`

        ctx.fill()
        ctx.closePath()
    }

    update() {
        if (!p.noise) {
            for (let i = 0; i < ballArray.length; i++) {
                var circlePos = { x: ballArray[i].x, y: ballArray[i].y }

                var _value = Math.pow(ballArray[i].radius, 2)
                _value = _value / (Math.pow(this.x - circlePos.x, 2) + Math.pow(this.y - circlePos.y, 2))

                this.value += _value;
            }
            this.value = this.value / ballArray.length

            if (this.value > 1)
                this.value = 1

        }
        this.checkTreshold();
    }
    checkTreshold() {
        this.active = this.value > p.threshold
    }
}

function randomRange(min, max, except) {
    var r = Math.floor(Math.random() * (max - min + 1) + min)
    return (r === except) ? randomRange(min, max) : r;

}



init()
initBall()
animate()

var stats;


function init() {


    noise = new SimplexNoise(Date.now());

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.left = '0px';
    stats.domElement.style.zIndex = '2';

    document.body.appendChild(stats.domElement);


    pointArray = []
    configIndex = []

    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = width
    canvas.height = height;

    canvasGrid.width = width
    canvasGrid.height = height;

    if (width > height) {
        p.cols = p.resolution;
        r = width / p.resolution
        p.rows = Math.round(height / r);
    } else {
        p.rows = p.resolution;
        r = height / p.resolution
        p.cols = Math.round(width / r);
    }


    p.pointSize = r * 0.7;

    for (let x = 0; x < p.cols; x++) {
        let tmp = [];
        for (let y = 0; y < p.rows; y++) {
            tmp.push(new point(x, y))
        }
        pointArray.push(tmp);
    }


    changeBackground();
    drawGrid()
    SwitchBallsNoise()
}

//UI change between the two mode
function SwitchBallsNoise() {
    if (p.noise) {

        gui.__folders["Balls"].hide()
        gui.__folders["Noise"].show()

    } else {

        gui.__folders["Noise"].hide()
        gui.__folders["Balls"].show()

    }
}

dat.GUI.prototype.removeFolder = function(name) {
    var folder = this.__folders[name];
    if (!folder) {
        return;
    }
    folder.close();
    this.__ul.removeChild(folder.domElement.parentNode);
    delete this.__folders[name];
    this.onResize();
}



var zoff = 0;
//Generation of the noise, attributing the nois value to each point of the grid
function generateNoise() {
    let xoff = 0;
    for (let i = 0; i < p.cols; i++) {
        xoff += p.noiseScale;
        let yoff = 0;
        for (let j = 0; j < p.rows; j++) {
            pointArray[i][j].value = noise.noise3D(xoff, yoff, zoff);
            yoff += p.noiseScale;
        }
    }
    zoff += p.noiseSpeed / 500;
}

function initBall() {
    ballArray = []
    for (let i = 0; i < p.ballNb; i++) {
        ballArray[i] = new ball();
    }
    ballArray[p.ballNb] = new interactableMovingBall();
}

function drawGrid() {
    ctxGrid.clearRect(0, 0, canvasGrid.width, canvasGrid.height)


    if (!p.drawGrid) return;
    ctxGrid.strokeStyle = p.darkmode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";

    for (let i = 0; i < p.cols; i++) {
        for (let j = 0; j < p.rows; j++) {
            var _x = i * r
            var _y = j * r

            ctxGrid.beginPath();
            ctxGrid.lineWidth = 1;

            ctxGrid.rect(_x, _y, r, r);
            ctxGrid.stroke()
            ctxGrid.closePath()
        }

    }
}


function MarchSquare() {
    for (let i = 0; i < p.cols - 1; i++) {
        for (let j = 0; j < p.rows - 1; j++) {

            let f0 = pointArray[i][j].value - p.threshold;
            let f1 = pointArray[i + 1][j].value - p.threshold;
            let f2 = pointArray[i + 1][j + 1].value - p.threshold;
            let f3 = pointArray[i][j + 1].value - p.threshold;

            let x = i * r;
            let y = j * r;

            let a, b, c, d

            a = new vector(x + r * f0 / (f0 - f1), y);
            b = new vector(x + r, y + r * f1 / (f1 - f2));
            c = new vector(x + r * (1 - f2 / (f2 - f3)), y + r);
            d = new vector(x, y + r * (1 - f3 / (f3 - f0)));

            var bin = ""
            bin += f0 > 0 ? 1 : 0;
            bin += f1 > 0 ? 1 : 0;
            bin += f2 > 0 ? 1 : 0;
            bin += f3 > 0 ? 1 : 0;

            if (p.interpolate) {
                switch (parseInt(bin, 2)) {
                    case 1:
                        drawLine(c, d);
                        break;
                    case 2:
                        drawLine(b, c);
                        break;
                    case 3:
                        drawLine(b, d);
                        break;
                    case 4:
                        drawLine(a, b);
                        break;
                    case 5:
                        drawLine(a, d);
                        drawLine(b, c);
                        break;
                    case 6:
                        drawLine(a, c);
                        break;
                    case 7:
                        drawLine(a, d);
                        break;
                    case 8:
                        drawLine(a, d);
                        break;
                    case 9:
                        drawLine(a, c);
                        break;
                    case 10:
                        drawLine(a, b);
                        drawLine(c, d);
                        break;
                    case 11:
                        drawLine(a, b);
                        break;
                    case 12:
                        drawLine(b, d);
                        break;
                    case 13:
                        drawLine(b, c);
                        break;
                    case 14:
                        drawLine(c, d);
                        break;
                }

            } else {

                pos = config[parseInt(bin, 2)]
                for (let i = 0; i < pos.length; i = i + 4) {
                    if (pos.every(item => item == 0))
                        continue;

                    ctx.save()
                    ctx.beginPath()

                    if (p.darkmode)
                        ctx.strokeStyle = "#fff"
                    else
                        ctx.strokeStyle = "#000"

                    var x1 = (x) + (pos[i] * r)
                    var y1 = (y) + (pos[i + 1] * r)

                    var x2 = (x) + (pos[i + 2] * r)
                    var y2 = (y) + (pos[i + 3] * r)


                    ctx.moveTo(x1, y1)
                    ctx.lineTo(x2, y2)
                    ctx.stroke();
                    ctx.closePath();
                    ctx.restore()
                }
            }
        }
    }

}

function drawLine(v1, v2) {
    ctx.beginPath()
    ctx.moveTo(v1.x, v1.y)
    ctx.lineTo(v2.x, v2.y)
    if (p.darkmode)
        ctx.strokeStyle = "white";
    else
        ctx.strokeStyle = "#000"

    ctx.lineWidth = 1
    ctx.stroke();
    ctx.closePath();
}


function changeBackground() {
    if (p.darkmode)
        $("#grid").css("background", "#131313");
    else
        $("#grid").css("background", "#fff")
}



window.addEventListener('mousemove', function(event) {
    mouse.x = event.x
    mouse.y = event.y
    ballArray[p.ballNb].update();
})
window.addEventListener('mouseout', function() {
    mouse.x = -200
    mouse.y = -200
})






function animate() {
    configIndex = []

    ctx.clearRect(0, 0, width, height)





    for (let i = 0; i < p.cols - 1; i++)
        for (let j = 0; j < p.rows - 1; j++) {
            pointArray[i][j].update()
            if (p.drawPoint)
                pointArray[i][j].draw()
        }

    //Balls
    if (!p.noise) {
        for (let i = 0; i < ballArray.length - 1; i++) {
            ballArray[i].update();
        }

        if (p.drawCircle)
            ballArray.forEach(ball => {
                ball.draw()
            });

    } else {
        generateNoise();
    }


    MarchSquare();
    requestAnimationFrame(animate);
    stats.update();
}