let video;
let handPose;
let hands = [];
let hand;
let handVals;
let fingers;
let handBounds;
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
        draw: false,
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
        show: true,
        stroke: 2
    }

}

let palm_kps = [0, 1, 5, 17];

function preload() {
    handPose = ml5.handPose({ flipped: true });
}

function setup() {
    createCanvas(window.innerWidth, window.innerHeight);
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

    image(video, 0, 0);

    handBounds = {};

    if (hands.length > 0) {
        hand = hands[0];
        let index = {
            x: hand.index_finger_tip.x,
            y: hand.index_finger_tip.y
        }
        let middle = {
            x: hand.middle_finger_tip.x,
            y: hand.middle_finger_tip.y
        }
        let ring = {
            x: hand.ring_finger_tip.x,
            y: hand.ring_finger_tip.y
        }
        let pinky = {
            x: hand.pinky_finger_tip.x,
            y: hand.pinky_finger_tip.y
        }
        let thumb = {
            x: hand.thumb_tip.x,
            y: hand.thumb_tip.y
        }
        fingers = [thumb, index, middle, ring, pinky];

        handVals = {
            fingers: fingers,
            handBounds: getBounds(hand.keypoints),
            handRad: null,
            palmBounds: getBounds(palm_kps.map(i => hand.keypoints[i])),
            palmRad: null,
            fingersBounds: getBounds(fingers),
            fingersRad: null,


            fingersInPalm: null,
            fingersOnBounds: 0,
            handedness: hand.handedness,
            pose: "none",
        }

        handVals.palmRad = dist(handVals.palmBounds.min.x, handVals.palmBounds.min.y, handVals.palmBounds.max.x, handVals.palmBounds.max.y) / 2;
        handVals.handRad = dist(handVals.handBounds.min.x, handVals.handBounds.min.y, handVals.handBounds.max.x, handVals.handBounds.max.y) / 2;
        handVals.fingersRad = dist(handVals.fingersBounds.min.x, handVals.fingersBounds.min.y, handVals.fingersBounds.max.x, handVals.fingersBounds.max.y) / 2;

        handVals.fingersInPalm = fingers.filter(f => dist(f.x, f.y, handVals.palmBounds.c.x, handVals.palmBounds.c.y) < handVals.palmRad * 1.2).length;
        handVals.fingersOnBounds = fingers.filter(f => dist(f.x, f.y, handVals.fingersBounds.c.x, handVals.fingersBounds.c.y) < handVals.fingersRad * 1.2).length;

        loopKP(hand, handVals);
        // drawConnections(hand);
        // drawHandText(hand);
        drawBounds(handVals);
        detectGestures(handVals);

        debug.innerHTML = `
        Hands detected: ${hands.length}<br>
        Palm radius: ${handVals.palmRad.toFixed(2)}<br>
        Fingers in palm: ${handVals.fingersInPalm}<br>
        Hand radius: ${handVals.handRad.toFixed(2)}<br>
        Fingers on edge: ${handVals.fingersOnBounds}<br>
        Pose: ${handVals.pose}<br>
        `;

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

function detectGestures(handVals) {
    if (handVals.fingersInPalm >= 4) {
        stroke(0, 255, 0);
        fill(0, 255, 0, 100);
        // circle(handVals.palmBounds.c.x, handVals.palmBounds.c.y, handVals.palmRad * 2);
        handVals.pose = "🪨";
    } else if (handVals.fingersOnBounds == 2 && handVals.fingersInPalm >= 2) {
        // && dist(handVals.fingers[0].x, handVals.fingers[0].y, handVals.palmBounds.c.x, handVals.palmBounds.c.y) < handVals.palmRad * 1.2
        stroke(255, 0, 0);
        fill(255, 0, 0, 100);

        handVals.pose = "✂️";
    } else if (handVals.fingersInPalm == 0 && handVals.fingersOnBounds >= 3) {
        handVals.pose = "📄";
    }

    textSize(64);
    fill(conf.hands[handVals.handedness]);
    text(handVals.pose, handVals.palmBounds.c.x - textWidth(handVals.pose) / 2, handVals.palmBounds.c.y);
}

function drawBounds(handVals) {
    let x = handVals.handBounds.min.x;
    let y = handVals.handBounds.min.y;
    let w = handVals.handBounds.max.x - x;
    let h = handVals.handBounds.max.y - y;

    noFill();
    stroke(conf.hands[handVals.handedness]);
    strokeWeight(conf.hand_bounds.stroke);
    // rect(x, y, w, h);

    // circle(handVals.palmBounds.c.x, handVals.palmBounds.c.y, handVals.palmRad * 2);// Palm center
    // circle(handVals.fingersBounds.c.x, handVals.fingersBounds.c.y, handVals.fingersRad * 2);// Finger center
    // // rect(handVals.fingersBounds.min.x, handVals.fingersBounds.min.y, handVals.fingersBounds.max.x - handVals.fingersBounds.min.x, handVals.fingersBounds.max.y - handVals.fingersBounds.min.y);// Finger bounds
    // // rect(handVals.palmBounds.min.x, handVals.palmBounds.min.y, handVals.palmBounds.max.x - handVals.palmBounds.min.x, handVals.palmBounds.max.y - handVals.palmBounds.min.y);// Palm bounds
}

function loopKP(hand, handVals) {
    for (let j = 0; j < hand.keypoints.length; j++) {
        const kp = hand.keypoints[j];
        fill(conf.kps.color);
        noStroke();
        if (conf.kps.draw) circle(kp.x, kp.y, conf.kps.size);

        fill(conf.kp_text.color);
        textSize(conf.kp_text.size);
        // text(`[${j}]`, kp.x + conf.kp_text.offx, kp.y - conf.kp_text.offy);


    }
    handVals.fingersOnBounds = fingers.filter(f => f.x == handVals.handBounds.min.x || f.x == handVals.handBounds.max.x || f.y == handVals.handBounds.min.y || f.y == handVals.handBounds.max.y).length;

}

function drawHandText(hand) {
    fill(conf.hands[hand.handedness]);
    textSize(conf.kp_text.size * 1.5);

    let avgX = conf.hands.palm_kps.reduce((sum, i) => sum + hand.keypoints[i].x, 0) / conf.hands.palm_kps.length;
    let avgY = conf.hands.palm_kps.reduce((sum, i) => sum + hand.keypoints[i].y, 0) / conf.hands.palm_kps.length;
    let offset = (conf.kp_text.size * 1.5) / 2;
    text(hand.handedness, avgX - textWidth(hand.handedness) / 2, avgY + offset);
}
function getBounds(arr) {
    let b = { min: { x: Infinity, y: Infinity }, max: { x: -Infinity, y: -Infinity }, c: { x: 0, y: 0 } };
    for (let i of arr) {
        if (i.x < b.min.x) b.min.x = i.x
        if (i.y < b.min.y) b.min.y = i.y
        if (i.x > b.max.x) b.max.x = i.x
        if (i.y > b.max.y) b.max.y = i.y
    }
    b.c.x = (b.min.x + b.max.x) / 2;
    b.c.y = (b.min.y + b.max.y) / 2;
    return b;
}

const clamp = (min, num, max) => Math.min(Math.max(num, min), max);


