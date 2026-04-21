let entries = [
  { text: "01 - The Unconscious City Archive", link: "assets/images/01.jpg" },
  { text: "02 - The city never sleeps", link: "assets/images/02.jpg" },
  { text: "03 - yet forgets without mercy", link: "assets/images/03.jpg" },
  { text: "04 - Each utility pole remembers", link: "assets/images/04.jpg" },
  { text: "05 - what we have allowed to fade", link: "assets/images/05.jpg" },
  { text: "06 - fragments stapled in passing", link: "assets/images/06.jpg" },
  { text: "07 - voices posted without permission", link: "assets/images/07.jpg" },
  { text: "08 - This is not an AD", link: "assets/images/08.jpg" },
  { text: "09 - Staple my words to time", link: "assets/images/09.jpg" },
  { text: "10 - Temporary forever", link: "assets/images/10.jpg" },
  { text: "11 - Signal lost", link: "assets/images/11.jpg" },
  { text: "12 - Poles remember what we forget", link: "assets/images/12.jpg" },
  { text: "13 - Rust is memory", link: "assets/images/13.jpg" },
  { text: "14 - POST NO BILLS someone wrote", link: "assets/images/14.jpg" },
  { text: "15 - But something was always posted anyway", link: "assets/images/15.jpg" },
  { text: "16 - Urgent! Call now!", link: "assets/images/16.jpg" },
  { text: "17 - Tonight only!", link: "assets/images/17.jpg" },
  { text: "18 - Paper insisted", link: "assets/images/18.jpg" },
  { text: "19 - Rain refused", link: "assets/images/19.jpg" },
  { text: "20 - Now only rust repeats the message", link: "assets/images/20.jpg" },
  { text: "21 - Every staple is a pulse", link: "assets/images/21.jpg" },
  { text: "22 - a small puncture in the surface of time", link: "assets/images/22.jpg" },
  { text: "23 - detach, hold, release", link: "assets/images/23.jpg" },
  { text: "24 - STAPLE MY WORDS TO TIME", link: "assets/images/24.jpg" },
  { text: "25 - Metal enters wood", link: "assets/images/25.jpg" },
  { text: "26 - Wood holds.", link: "assets/images/26.jpg" },
  { text: "27 - Once, this was a tree", link: "assets/images/27.jpg" },
  { text: "28 - Now it carries announcements", link: "assets/images/28.jpg" },
  { text: "29 - layer after layer", link: "assets/images/29.jpg" },
  { text: "30 - bark turned bulletin", link: "assets/images/30.jpg" },
  { text: "31 - grain turned archive", link: "assets/images/31.jpg" },
  { text: "32 - BARK CODE", link: "assets/images/32.jpg" },
  { text: "33 - I read without language", link: "assets/images/33.jpg" },
  { text: "34 - each nail a pause", link: "assets/images/34.jpg" },
  { text: "35 - each hole a breath", link: "assets/images/35.jpg" },
  { text: "36 - Messages arrive without sender", link: "assets/images/36.jpg" },
  { text: "37 - leave without witness", link: "assets/images/37.jpg" }
];

let rotationOffset = 0;
let rotationVelocity = 0;

let cylinder;
let clickableBands = [];
let hoveredBand = -1;
let canvas;

function setup() {
  const holder = document.getElementById("sketch-holder");
  canvas = createCanvas(holder.clientWidth, holder.clientHeight);
  canvas.parent("sketch-holder");

  textFont("Helvetica");
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  updateCylinder();
}

function draw() {
  background(235);

  rotationOffset += rotationVelocity;
  rotationVelocity *= 0.92;
  if (abs(rotationVelocity) < 0.00005) rotationVelocity = 0;

  clickableBands = [];
  hoveredBand = -1;

  drawCylinderBody();
  drawCylinderTop();
  drawInstruction();
}

function updateCylinder() {
  cylinder = {
    x: width / 2,
    y: height / 2 + 20,
    w: min(width * 0.36, 500),
    h: min(height * 0.72, 700),
    topH: min(height * 0.05, 70)
  };
}

function drawCylinderBody() {
  const cx = cylinder.x;
  const cy = cylinder.y;
  const rx = cylinder.w / 2;
  const bodyTop = cy - cylinder.h / 2;
  const bodyBottom = cy + cylinder.h / 2;
  const count = entries.length;

  let visible = [];
  const innerMargin = 20;
  const innerRx = rx - innerMargin;

  for (let i = 0; i < count; i++) {
    let angle = rotationOffset + (TWO_PI / count) * i;
    let a = atan2(sin(angle), cos(angle));

    if (cos(a) > 0) {
      let x = cx + sin(a) * innerRx;
      let depth = cos(a);

      visible.push({
        index: i,
        angle: a,
        x: x,
        depth: depth
      });
    }
  }

  visible.sort((a, b) => a.depth - b.depth);

  for (let band of visible) {
    drawBand(band, bodyTop, bodyBottom);
  }

  noFill();
  stroke(50, 30, 30);
  strokeWeight(3.5);
  line(cx - rx, bodyTop, cx - rx, bodyBottom);
  line(cx + rx, bodyTop, cx + rx, bodyBottom);
}

function drawBand(band, bodyTop, bodyBottom) {
  const h = bodyBottom - bodyTop;
  const baseW = cylinder.w / 14.5;
  const w = baseW * map(band.depth, 0, 1, 0.94, 1.03);

  const outerLeft = cylinder.x - cylinder.w / 2;
  const outerRight = cylinder.x + cylinder.w / 2;
  const safeGap = 8;

  const x = constrain(
    band.x,
    outerLeft + w / 2 + safeGap,
    outerRight - w / 2 - safeGap
  );

  const shade = map(band.depth, 0, 1, 245, 255);
  const alpha = map(band.depth, 0, 1, 70, 255);
  const scale = map(band.depth, 0, 1, 0.88, 1.06);

  const isHover =
    mouseX > x - w / 2 &&
    mouseX < x + w / 2 &&
    mouseY > bodyTop &&
    mouseY < bodyBottom;

  if (isHover && band.depth > 0.2) hoveredBand = band.index;

  fill(shade);
  stroke(55, 35, 35, 180);
  strokeWeight(1.2);
  rect(x, (bodyTop + bodyBottom) / 2, w, h);

  drawVerticalPoem(
    entries[band.index].text,
    x,
    bodyTop + 18,
    bodyBottom - 18,
    alpha,
    scale,
    isHover && band.depth > 0.2,
    w
  );

  clickableBands.push({
    index: band.index,
    x: x - w / 2,
    y: bodyTop,
    w: w,
    h: h,
    depth: band.depth
  });
}

function drawVerticalPoem(str, x, topY, bottomY, alpha, scale, isHover, bandW) {
  push();

  const chars = makeVerticalChars(str);

  let frontSize = 19;
  let backSize = 11;
  let textSizeNow = lerp(
    backSize,
    frontSize,
    constrain(scale - 0.88, 0, 0.18) / 0.18
  );

  if (isHover) textSizeNow += 1.2;

  const maxAllowedByWidth = bandW * 0.72;
  textSizeNow = min(textSizeNow, maxAllowedByWidth);

  textSize(textSizeNow);
  fill(20, alpha);
  noStroke();

  let step = textSizeNow * 0.92;
  let availableH = bottomY - topY;
  let maxChars = floor(availableH / step);

  let drawChars = chars.slice(0, maxChars);
  let totalH = (drawChars.length - 1) * step;
  let startY = topY + (availableH - totalH) / 2;

  for (let i = 0; i < drawChars.length; i++) {
    text(drawChars[i], x, startY + i * step);
  }

  pop();
}

function makeVerticalChars(str) {
  let chars = [];
  for (let ch of str) {
    chars.push(ch);
  }
  return chars;
}

function drawCylinderTop() {
  const cx = cylinder.x;
  const cy = cylinder.y - cylinder.h / 2;
  const rw = cylinder.w;
  const rh = cylinder.topH * 2;

  fill(246);
  stroke(50, 30, 30);
  strokeWeight(4);
  ellipse(cx, cy, rw, rh);
}

function drawInstruction() {
  fill(30);
  noStroke();
  textSize(16);
  text("Scroll to rotate · Click a poem to open its image", width / 2, height - 36);

  if (hoveredBand !== -1) {
    textSize(15);
    fill(30, 180);
    text(entries[hoveredBand].text, width / 2, 36);
  }
}

function mouseWheel(event) {
  rotationVelocity += event.delta * 0.00012;
  rotationVelocity = constrain(rotationVelocity, -0.08, 0.08);
  return false;
}

function mousePressed() {
  let sorted = clickableBands.slice().sort((a, b) => b.depth - a.depth);

  for (let band of sorted) {
    if (
      mouseX > band.x &&
      mouseX < band.x + band.w &&
      mouseY > band.y &&
      mouseY < band.y + band.h &&
      band.depth > 0.2
    ) {
      window.location.href = entries[band.index].link;
      return;
    }
  }
}

function windowResized() {
  const holder = document.getElementById("sketch-holder");
  resizeCanvas(holder.clientWidth, holder.clientHeight);
  updateCylinder();
}