let canvas;

function setup() {
  canvas = createCanvas(windowWidth - 48, windowHeight - 180);
  canvas.parent("sketch-holder");

  function windowResized() {
  resizeCanvas(windowWidth - 48, windowHeight - 180);
  generateText();
  lastRefreshTime = millis();
}