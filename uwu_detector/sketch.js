let video;
let handPose;
let hands = [];

function preload() {
    handPose = ml5.handPose({ flipped: true });
}

function setup() {
    noCanvas();
    video = createCapture({
        video: {
        },
        audio: false,
        flipped: true,
    });
    handPose.detectStart(video, (results) => { hands = results; });
    video.hide();

}

function draw() {
    let fDist = null;
    if (hands.length == 2) {
        let leftHand = hands[0];
        let rightHand = hands[1];
        fDist = dist(
            leftHand.index_finger_tip.x, leftHand.index_finger_tip.y,
            rightHand.index_finger_tip.x, rightHand.index_finger_tip.y
        );
        if (fDist < 50 && leftHand.thumb_tip.y < leftHand.index_finger_tip.y && rightHand.thumb_tip.y < rightHand.index_finger_tip.y) {
            detector.innerText = "uwu\n👉👈";
        } else {
            detector.innerText = "No uwu detected";
        }

    }
    // debug.innerText = `Hands detected: ${hands.length}\ndistance: ${hands.length == 2 ? fDist : "N/A"}`;
}

const clamp = (min, num, max) => Math.min(Math.max(num, min), max);