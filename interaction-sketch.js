let questions = [
  "What part of you stays behind in a place?",
  "What do you carry that no one else sees?",
  "What trace would you want to leave here?"
];

let inputBox, stapleBtn, clearBtn;
let canvas;

let placedStaples = [];

let draggedStaple = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dragMode = "spring";

let mouseVX = 0;
let mouseVY = 0;
let prevMouseX = 0;
let prevMouseY = 0;

let startTime;
let questionDuration = 20000;
let totalDuration = 60000;
let currentQuestionIndex = 0;

let phase = "questions";
// questions -> fallingTransition -> transitionMessage

let fallingStartTime = 0;
let transitionStartTime = 0;

let nextGroupId = 0;

function setup() {
  const holder = document.getElementById("sketch-holder");
  const holderWidth = holder.clientWidth;
  const holderHeight = holder.clientHeight;

  canvas = createCanvas(holderWidth, holderHeight);
  canvas.parent("sketch-holder");

  startTime = millis();

  inputBox = createInput("");
  inputBox.parent("sketch-holder");
  inputBox.attribute("placeholder", "type your answer...");

  stapleBtn = createButton("staple");
  stapleBtn.parent("sketch-holder");
  stapleBtn.mousePressed(() => {
    if (phase === "questions") {
      generateText();
    }
  });

  clearBtn = createButton("clear");
  clearBtn.parent("sketch-holder");
  clearBtn.mousePressed(resetExperience);

  layoutUI();

  prevMouseX = mouseX;
  prevMouseY = mouseY;
}

function draw() {
  background(255);

  mouseVX = mouseX - prevMouseX;
  mouseVY = mouseY - prevMouseY;
  prevMouseX = mouseX;
  prevMouseY = mouseY;

  layoutUI();

  if (phase === "questions") {
    updateQuestionPhase();
    autoFallExpiredAnswers();
    updateStaples();
    drawStaples();
    drawCenteredQuestionUI();
  } else if (phase === "fallingTransition") {
    updateStaples();
    drawStaples();
    updateTransitionAfterFall();
  } else if (phase === "transitionMessage") {
    drawTransitionMessage();
  }
}

function layoutUI() {
  let centerX = width / 2;
  let inputY = height * 0.26; // 再往上提

  let inputW = min(420, width * 0.34);
  inputBox.size(inputW);
  inputBox.position(centerX - inputW / 2, inputY);

  let buttonY = inputY + 54;
  let gap = 18;
  let stapleW = 82;
  let clearW = 72;
  let totalW = stapleW + gap + clearW;

  stapleBtn.position(centerX - totalW / 2, buttonY);
  clearBtn.position(centerX - totalW / 2 + stapleW + gap, buttonY);
}

function updateQuestionPhase() {
  let elapsed = millis() - startTime;

  currentQuestionIndex = floor(elapsed / questionDuration);
  currentQuestionIndex = constrain(currentQuestionIndex, 0, questions.length - 1);

  if (elapsed >= totalDuration) {
    beginFallingTransition();
  }
}

function beginFallingTransition() {
  phase = "fallingTransition";
  fallingStartTime = millis();

  makeAllStaplesFall();

  inputBox.hide();
  stapleBtn.hide();
  clearBtn.hide();
  draggedStaple = null;
}

function updateTransitionAfterFall() {
  let t = millis() - fallingStartTime;

  if (t > 1600) {
    phase = "transitionMessage";
    transitionStartTime = millis();
    placedStaples = [];
    draggedStaple = null;
  }
}

function drawTransitionMessage() {
  let t = millis() - transitionStartTime;
  let alpha = 255;

  if (t < 1600) {
    alpha = map(t, 0, 1600, 0, 255);
  }

  fill(0, alpha);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);

  text(
    "Thank you for leaving a trace.\nPlease look at the traces I found in New Haven.",
    width / 2,
    height / 2
  );

  if (t > 4200) {
    window.location.href = "directory.html";
  }
}

function drawCenteredQuestionUI() {
  let centerX = width / 2;

  let timerY = height * 0.10;
  let metaY = height * 0.14;
  let questionY = height * 0.18;

  let elapsed = millis() - startTime;
  let localTime = elapsed % questionDuration;

  let alpha = 255;

  if (localTime < 3000) {
    alpha = map(localTime, 0, 3000, 0, 255);
  } else if (localTime > 17000) {
    alpha = map(localTime, 17000, 20000, 255, 0);
  }

  let totalRemaining = max(0, ceil((totalDuration - elapsed) / 1000));
  let localRemaining = max(0, ceil((questionDuration - (elapsed % questionDuration)) / 1000));

  noStroke();
  textAlign(CENTER, TOP);

  fill(0);
  textSize(18);
  text(totalRemaining + "s", centerX, timerY);

  textSize(13);
  text("question " + (currentQuestionIndex + 1) + " / 3", centerX, metaY);
  text(localRemaining + "s for this question", centerX, metaY + 22);

  fill(0, alpha);
  textSize(30);
  text(questions[currentQuestionIndex], centerX, questionY);

  fill(0, 180);
  textSize(13);
  text(
    "Answer the question. Press staple. Drag a staple slightly. Double-click to make all staples fall.",
    width / 2,
    height - 34
  );
}

function generateText() {
  let txt = inputBox.value().toUpperCase().trim();
  if (txt === "") return;

  let groupId = nextGroupId;
  nextGroupId++;

  inputBox.value("");

  let lines = wrapText(txt, 14);

  let letterW = 78;
  let letterH = 120;
  let spacing = 22;
  let lineSpacing = 70;

  let totalH = lines.length * letterH + (lines.length - 1) * lineSpacing;
  let startY = height * 0.52 - totalH / 2; // 更靠下，避免挡住 UI

  for (let row = 0; row < lines.length; row++) {
    let lineText = lines[row];
    let totalW = lineText.length * letterW + (lineText.length - 1) * spacing;
    let startX = width / 2 - totalW / 2 + letterW / 2;

    for (let i = 0; i < lineText.length; i++) {
      let ch = lineText[i];
      let x = startX + i * (letterW + spacing);
      let y = startY + row * (letterH + lineSpacing);

      placeLetter(ch, x, y, letterW, letterH, groupId);
    }
  }
}

function autoFallExpiredAnswers() {
  let elapsed = millis() - startTime;

  for (let s of placedStaples) {
    if (!s.isFalling) {
      let answerAge = elapsed - s.createdAt;
      if (answerAge >= questionDuration) {
        startStapleFalling(s);
      }
    }
  }
}

function updateStaples() {
  for (let s of placedStaples) {
    if (s.isFalling) {
      updateFallingStaple(s);
    } else if (s !== draggedStaple) {
      s.x = lerp(s.x, s.homeX, 0.08);
      s.y = lerp(s.y, s.homeY, 0.08);
      s.angle = lerpAngle(s.angle, s.homeAngle, 0.08);
    }
  }
}

function updateFallingStaple(s) {
  s.vy += s.gravity;
  s.y += s.vy;
  s.x += s.vx;
  s.angle += s.spin;

  // 真正掉到整个画面最底部
  let floorY = height + 4;

  if (s.y >= floorY) {
    s.y = floorY;
    s.vy *= -0.16;
    s.vx *= 0.86;
    s.spin *= 0.82;

    if (abs(s.vy) < 0.3) s.vy = 0;
    if (abs(s.vx) < 0.04) s.vx = 0;
    if (abs(s.spin) < 0.002) s.spin = 0;
  }
}

function drawStaples() {
  for (let s of placedStaples) {
    if (s !== draggedStaple) {
      drawStaple(s);
    }
  }

  if (draggedStaple) {
    drawStaple(draggedStaple);
  }
}

function drawStaple(s) {
  push();
  translate(s.x, s.y);
  rotate(s.angle);

  stroke(0);
  strokeWeight(s.thickness);
  noFill();

  line(-s.len / 2, 0, s.len / 2, 0);
  line(-s.len / 2, 0, -s.len / 2, s.leg);
  line(s.len / 2, 0, s.len / 2, s.leg);

  pop();
}

function wrapText(str, maxChars) {
  let words = str.split(" ");
  let lines = [];
  let current = "";

  for (let w of words) {
    if ((current + " " + w).trim().length <= maxChars) {
      current = (current + " " + w).trim();
    } else {
      if (current.length > 0) lines.push(current);
      current = w;
    }
  }

  if (current.length > 0) lines.push(current);
  return lines;
}

function placeLetter(ch, cx, cy, w, h, groupId) {
  if (ch === " ") return;

  let strokes = getLetter(ch);

  for (let st of strokes) {
    let x1 = map(st[0], 0, 1, cx - w / 2, cx + w / 2);
    let y1 = map(st[1], 0, 1, cy - h / 2, cy + h / 2);
    let x2 = map(st[2], 0, 1, cx - w / 2, cx + w / 2);
    let y2 = map(st[3], 0, 1, cy - h / 2, cy + h / 2);

    segmentToStaples(x1, y1, x2, y2, groupId);
  }
}

function segmentToStaples(x1, y1, x2, y2, groupId) {
  let d = dist(x1, y1, x2, y2);
  let stepSize = random(18, 28);
  let steps = max(1, floor(d / stepSize));

  for (let i = 0; i <= steps; i++) {
    let t = i / steps;

    let x = lerp(x1, x2, t) + random(-2, 2);
    let y = lerp(y1, y2, t) + random(-2, 2);
    let ang = atan2(y2 - y1, x2 - x1) + random(-0.2, 0.2);

    let s = {
      x: x,
      y: y,
      homeX: x,
      homeY: y,
      len: random(34, 52),
      leg: random(14, 24),
      angle: ang,
      homeAngle: ang,
      thickness: random(3, 6),

      vx: 0,
      vy: 0,
      gravity: random(0.45, 0.8),
      spin: 0,

      groupId: groupId,
      createdAt: millis() - startTime,
      isFalling: false
    };

    placedStaples.push(s);
  }
}

function startStapleFalling(s) {
  s.isFalling = true;
  s.vx = random(-1.2, 1.2);
  s.vy = random(-2.5, -0.5);
  s.spin = random(-0.08, 0.08);
}

function makeAllStaplesFall() {
  for (let s of placedStaples) {
    if (!s.isFalling) {
      startStapleFalling(s);
    }
  }
}

function isMouseOnStaple(mx, my, s) {
  let d = dist(mx, my, s.x, s.y);
  return d < s.len * 0.6;
}

function mousePressed() {
  draggedStaple = null;

  for (let i = placedStaples.length - 1; i >= 0; i--) {
    let s = placedStaples[i];
    if (isMouseOnStaple(mouseX, mouseY, s)) {
      draggedStaple = s;
      dragOffsetX = mouseX - s.x;
      dragOffsetY = mouseY - s.y;
      dragMode = s.isFalling ? "fall" : "spring";
      s.isFalling = false;
      s.vx = 0;
      s.vy = 0;
      s.spin = 0;
      break;
    }
  }
}

function mouseDragged() {
  if (!draggedStaple) return;

  let targetX = mouseX - dragOffsetX;
  let targetY = mouseY - dragOffsetY;

  draggedStaple.x = lerp(draggedStaple.x, targetX, 0.2);
  draggedStaple.y = lerp(draggedStaple.y, targetY, 0.2);

  let dragAng = atan2(
    draggedStaple.y - draggedStaple.homeY,
    draggedStaple.x - draggedStaple.homeX
  );

  let moveDist = dist(
    draggedStaple.x,
    draggedStaple.y,
    draggedStaple.homeX,
    draggedStaple.homeY
  );

  let twistAmount = constrain(map(moveDist, 0, 80, 0, 0.6), 0, 0.6);

  draggedStaple.angle = lerpAngle(
    draggedStaple.angle,
    draggedStaple.homeAngle + twistAmount * sin(dragAng),
    0.15
  );
}

function mouseReleased() {
  if (!draggedStaple) return;

  if (dragMode === "fall") {
    draggedStaple.isFalling = true;
    draggedStaple.vx = mouseVX * 0.35;
    draggedStaple.vy = mouseVY * 0.35;
    draggedStaple.spin = random(-0.08, 0.08);
  }

  draggedStaple = null;
}

function doubleClicked() {
  if (placedStaples.length === 0) return false;

  if (phase === "questions") {
    makeAllStaplesFall();
  }

  return false;
}

function lerpAngle(a, b, amt) {
  let diff = atan2(sin(b - a), cos(b - a));
  return a + diff * amt;
}

function resetExperience() {
  placedStaples = [];
  draggedStaple = null;
  nextGroupId = 0;
  currentQuestionIndex = 0;
  startTime = millis();
  phase = "questions";

  inputBox.value("");
  inputBox.show();
  stapleBtn.show();
  clearBtn.show();
}

function getLetter(ch) {
  const letters = {
    A: [[0.1,1,0.5,0],[0.9,1,0.5,0],[0.2,0.6,0.8,0.6]],
    B: [[0.2,0,0.2,1],[0.2,0,0.72,0.12],[0.72,0.12,0.72,0.45],[0.72,0.45,0.2,0.5],[0.2,0.5,0.72,0.58],[0.72,0.58,0.68,0.92],[0.68,0.92,0.2,1]],
    C: [[0.8,0.1,0.3,0.1],[0.3,0.1,0.2,0.5],[0.2,0.5,0.3,0.9],[0.3,0.9,0.8,0.9]],
    D: [[0.2,0,0.2,1],[0.2,0,0.7,0.1],[0.7,0.1,0.7,0.9],[0.7,0.9,0.2,1]],
    E: [[0.2,0,0.2,1],[0.2,0,0.8,0],[0.2,0.5,0.7,0.5],[0.2,1,0.8,1]],
    F: [[0.2,0,0.2,1],[0.2,0,0.8,0],[0.2,0.5,0.7,0.5]],
    G: [[0.8,0.15,0.3,0.1],[0.3,0.1,0.2,0.5],[0.2,0.5,0.3,0.9],[0.3,0.9,0.8,0.85],[0.8,0.85,0.8,0.6],[0.8,0.6,0.55,0.6]],
    H: [[0.2,0,0.2,1],[0.8,0,0.8,1],[0.2,0.5,0.8,0.5]],
    I: [[0.5,0,0.5,1]],
    J: [[0.8,0,0.8,0.82],[0.8,0.82,0.5,1],[0.5,1,0.2,0.84]],
    K: [[0.2,0,0.2,1],[0.8,0,0.2,0.5],[0.2,0.5,0.82,1]],
    L: [[0.2,0,0.2,1],[0.2,1,0.8,1]],
    M: [[0.2,1,0.2,0],[0.2,0,0.5,0.45],[0.5,0.45,0.8,0],[0.8,0,0.8,1]],
    N: [[0.2,1,0.2,0],[0.2,0,0.8,1],[0.8,1,0.8,0]],
    O: [[0.2,0.1,0.8,0.1],[0.8,0.1,0.8,0.9],[0.8,0.9,0.2,0.9],[0.2,0.9,0.2,0.1]],
    P: [[0.2,1,0.2,0],[0.2,0,0.75,0.1],[0.75,0.1,0.75,0.45],[0.75,0.45,0.2,0.5]],
    Q: [[0.2,0.1,0.8,0.1],[0.8,0.1,0.8,0.9],[0.8,0.9,0.2,0.9],[0.2,0.9,0.2,0.1],[0.55,0.6,0.9,1]],
    R: [[0.2,1,0.2,0],[0.2,0,0.7,0.1],[0.7,0.1,0.7,0.5],[0.7,0.5,0.2,0.5],[0.2,0.5,0.8,1]],
    S: [[0.8,0.1,0.3,0],[0.3,0,0.2,0.5],[0.2,0.5,0.8,0.6],[0.8,0.6,0.7,1],[0.7,1,0.2,1]],
    T: [[0.1,0,0.9,0],[0.5,0,0.5,1]],
    U: [[0.2,0,0.2,0.8],[0.2,0.8,0.5,1],[0.5,1,0.8,0.8],[0.8,0.8,0.8,0]],
    V: [[0.1,0,0.5,1],[0.5,1,0.9,0]],
    W: [[0.1,0,0.3,1],[0.3,1,0.5,0.4],[0.5,0.4,0.7,1],[0.7,1,0.9,0]],
    X: [[0.16,0,0.84,1],[0.84,0,0.16,1]],
    Y: [[0.14,0,0.5,0.48],[0.86,0,0.5,0.48],[0.5,0.48,0.5,1]],
    Z: [[0.16,0,0.84,0],[0.84,0,0.16,1],[0.16,1,0.84,1]]
  };

  return letters[ch] || [[0.2, 0, 0.8, 1]];
}

function windowResized() {
  const holder = document.getElementById("sketch-holder");
  resizeCanvas(holder.clientWidth, holder.clientHeight);
  layoutUI();
}