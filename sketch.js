let video;
let handPose;
let hands = [];
let gui = new lil.GUI();
let folders = {};
let painting;
let connections = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [1, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [13, 9],
    [9, 5],
    [2, 5],
    [9, 10],
    [10, 11],
    [11, 12],
    [17, 13],
    [13, 14],
    [14, 15],
    [15, 16],
    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20]
];
let clearStart = 0;
let videoScale;
let prev = {
    Left: { x: null, y: null },
    Right: { x: null, y: null }
}

let conf = {
    hands: {
        palm_kps: [0, 1, 5, 9, 13, 17],
        palm_kps_str: null,
        Left: "#ff0000",
        Right: "#0000ff",
        show: true,
        paint: true,
    },
    canvas: {
        bg: "#00000000"
    },
    kps: {
        size: 8,
        color: "#000000",
        draw: true,
    },
    kp_conn: {
        connect: true,
        stroke: 1,
    },
    kp_text: {
        show: false,
        size: 8,
        offx: 10,
        offy: 5,
        color: "#000000ff"
    },
    camera: {
        show: true,
    },
    hand_bounds: {
        show: false,
        stroke: 2
    }

}

function preload() {
    handPose = ml5.handPose({ flipped: true });
}

function guiInit() {
    conf.hands.palm_kps_str = conf.hands.palm_kps.join(", ");

    folders.canvas = gui.addFolder("Canvas");
    {
        folders.canvas.addColor(conf.canvas, "bg");
        folders.canvas.close();
    }

    folders.render = gui.addFolder("Rendering");
    {

        folders.render.points = folders.render.addFolder("Points");
        {
            folders.render.points.add(conf.kps, "draw");
            folders.render.points.addColor(conf.kps, "color");
            folders.render.points.add(conf.kps, "size", 1, 30, 0.5);
            folders.render.points.close();
        }

        folders.render.conn = folders.render.addFolder("Connections");
        {
            folders.render.conn.add(conf.kp_conn, "connect");
            folders.render.conn.add(conf.kp_conn, "stroke", 0.5, 10, 0.5);
            folders.render.conn.close();
        }

        folders.render.labels = folders.render.addFolder("Labels");
        {
            folders.render.labels.add(conf.kp_text, "show");
            folders.render.labels.add(conf.kp_text, "size", 4, 32, 1);
            folders.render.labels.add(conf.kp_text, "offx", -50, 50, 1);
            folders.render.labels.add(conf.kp_text, "offy", -50, 50, 1);
            folders.render.labels.addColor(conf.kp_text, "color");
            folders.render.labels.close();
        }
    }

    folders.view = gui.addFolder("View");
    {

        folders.view.camera = folders.view.addFolder("Camera");
        {
            folders.view.camera.add(conf.camera, "show");
            folders.view.camera.close();
        }

        folders.view.bounds = folders.view.addFolder("Bounds");
        {
            folders.view.bounds.add(conf.hand_bounds, "show");
            folders.view.bounds.add(conf.hand_bounds, "stroke", 0.5, 10, 0.5);
            folders.view.bounds.close();
        }

        folders.view.hands = folders.view.addFolder("Hands");
        {
            folders.view.hands.add(conf.hands, "palm_kps_str").name("palm_kps").onChange((value) => {
                conf.hands.palm_kps = value.trim().split(",").map(Number).map(i => isNaN(i) ? 0 : clamp(0, i, 20));
            });
            folders.view.hands.addColor(conf.hands, "Left");
            folders.view.hands.addColor(conf.hands, "Right");
            folders.view.hands.add(conf.hands, "show");
            folders.view.hands.add(conf.hands, "paint");
            folders.view.hands.close();
        }

    }
}

function setup() {
    guiInit();
    createCanvas(window.innerWidth, window.innerHeight);
    painting = createGraphics(width, height);
    video = createCapture({
        video: {
        },
        audio: false,
        flipped: true,
    });
    videoScale = Math.min(window.innerWidth / 640, window.innerHeight / 480);
    video.size(640 * videoScale, 480 * videoScale);
    handPose.detectStart(video, (results) => { hands = results; });

    video.hide();

}

function draw() {
    clear();
    strokeWeight(1);
    stroke(255);
    fill(conf.canvas.bg);
    rect(0, 0, width, height);
    rect(0, 0, video.width, video.height);

    if (conf.camera.show) {
        image(video, 0, 0);
    }
    if (conf.hands.paint) {
        image(painting, 0, 0);
    } else {
        painting.clear();
    }
    for (let i = 0; i < hands.length; i++) {
        let hand = hands[i];
        let bounds = { min: { x: Infinity, y: Infinity }, max: { x: -Infinity, y: -Infinity } }

        if (conf.kp_conn.connect) {
            drawConnections(hand);
        }

        loopKP(hand, i, bounds);
        if (conf.hands.show) drawHandText(hand, i);
        if (conf.hand_bounds.show) drawBounds(bounds, hand.handedness);

    }
}

function drawConnections(hand) {
    for (let j = 0; j < connections.length; j++) {
        let pointAIndex = connections[j][0];
        let pointBIndex = connections[j][1];
        let pointA = hand.keypoints[pointAIndex];
        let pointB = hand.keypoints[pointBIndex];
        stroke(conf.hands[hand.handedness]);
        strokeWeight(conf.kp_conn.stroke);
        line(pointA.x, pointA.y, pointB.x, pointB.y);
    }
}

function drawBounds(bounds, handedness) {
    let x = bounds.min.x;
    let y = bounds.min.y;
    let w = bounds.max.x - x;
    let h = bounds.max.y - y;
    noFill();
    stroke(conf.hands[handedness]);
    strokeWeight(conf.hand_bounds.stroke);
    rect(x, y, w, h);
}

function loopKP(hand, i, bounds) {
    for (let j = 0; j < hand.keypoints.length; j++) {
        const kp = hand.keypoints[j];
        fill(conf.kps.color);
        noStroke();
        if (conf.kps.draw) circle(kp.x, kp.y, conf.kps.size);

        if (kp.x < bounds.min.x) bounds.min.x = kp.x
        if (kp.y < bounds.min.y) bounds.min.y = kp.y
        if (kp.x > bounds.max.x) bounds.max.x = kp.x
        if (kp.y > bounds.max.y) bounds.max.y = kp.y

        if (conf.kp_text.show) {
            fill(conf.kp_text.color);
            textSize(conf.kp_text.size);
            text(`[${i}][${j}]`, kp.x + conf.kp_text.offx, kp.y - conf.kp_text.offy);

        }
    }
    doPainting(hand);

}

function drawHandText(hand, i) {
    fill(conf.hands[hand.handedness]);
    textSize(conf.kp_text.size * 1.5);

    let avgX = conf.hands.palm_kps.reduce((sum, i) => sum + hand.keypoints[i].x, 0) / conf.hands.palm_kps.length;
    let avgY = conf.hands.palm_kps.reduce((sum, i) => sum + hand.keypoints[i].y, 0) / conf.hands.palm_kps.length;
    let offset = (conf.kp_text.size * 1.5) / 2;
    text(hand.handedness, avgX - textWidth(hand.handedness) / 2, avgY + offset);
}

function doPainting(hand) {
    const thumbTip = hand.keypoints[4];
    const indexTip = hand.keypoints[8];
    const handColor = conf.hands[hand.handedness];
    const prevPoint = prev[hand.handedness];

    const getMidpoint = (a, b) => ({
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
    });

    const resetPrev = () => {
        prevPoint.x = null;
        prevPoint.y = null;
    };

    const drawPaintStroke = (mid) => {
        fill("#00ff00");
        noStroke();

        painting.noStroke();
        painting.fill(handColor);
        circle(thumbTip.x, thumbTip.y, conf.kps.size * 1.5);
        circle(indexTip.x, indexTip.y, conf.kps.size * 1.5);

        painting.circle(mid.x, mid.y, conf.kps.size * 1.5);
        painting.stroke(handColor);
        painting.strokeWeight(conf.kps.size * 1.5);
        painting.line(prevPoint.x ?? mid.x, prevPoint.y ?? mid.y, mid.x, mid.y);

        prevPoint.x = mid.x;
        prevPoint.y = mid.y;
    };

    let pinchClose = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y) < 30;
    let pinchFar = dist(thumbTip.x, thumbTip.y, indexTip.x, indexTip.y) > 60;
    if (pinchClose && conf.hands.paint) {
        drawPaintStroke(getMidpoint(thumbTip, indexTip));
    }

    if (pinchFar) {
        resetPrev();
    }

    if (hands.length >= 2) {
        const [h1, h2] = hands;
        const clearGesture = dist(h1.index_finger_tip.x, h1.index_finger_tip.y, h2.index_finger_tip.x, h2.index_finger_tip.y) < 20;
        if (clearGesture) {
            if (clearStart === 0) {
                clearStart = Date.now();
            }
            fill("#ff0000");
            noStroke();
            circle((h1.index_finger_tip.x + h2.index_finger_tip.x) / 2, (h1.index_finger_tip.y + h2.index_finger_tip.y) / 2, 40);
            if (Date.now() - clearStart > 200) {
                painting.clear();
                resetPrev();
                pinchClose = false;
                pinchFar = true;
                clearStart = 0;
            }

        } else {
            clearStart = 0;
        }
    }
}

const clamp = (min, num, max) => Math.min(Math.max(num, min), max);