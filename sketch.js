let seaImg, bigFishImg, smallFishImg,starImg, shanhuImg, breadImg, weedsImg, bugImg, winImg,shrimpImg, bagImg, glassImg, webImg, poisonImg, lightningImg, snowImg, gogofishImg;
let bigFishX = 0, bigFishY = 0;
let bigFishSpeed = 3;  
let bigFishBaseSpeed = 3;
let bigFishDirection = 1;
let bigFishRotation = 0;
let smallFishX = 0, smallFishY = 0;
let smallFishAngle = 0;
let smallFishSpeed = 2;
let energy = 10;
let items = [];
let gamestart = false; // 游戏开始状态，初始为 false
let gameOver = false;
let gameWon = false; // 游戏胜利状态
let startImg, restartImg, gameoverImg;
let freezeTimer = 0;
let speedBoostTimer = 0;
let gogoFishSound,backgroundMusic,bubblesSound,badSound,goodSound,loseSound,winSound;
let loseSoundPlayed = false;
let winSoundPlayed = false;
let showGuide = false;
let helpBtn = { x: 0, y: 0, w: 0, h: 0 };
let startBtn = { x: 0, y: 0, w: 0, h: 0 };
let closeGuideBtn = { x: 0, y: 0, w: 0, h: 0 };
let restartBtn = { x: 0, y: 0, w: 0, h: 0 };

const GOOD_GUIDE = [
  ['bread', 'Bread', '+1'],
  ['weeds', 'Seaweed', '+1'],
  ['bug', 'Bug', '+2'],
  ['shrimp', 'Shrimp', '+3'],
  ['lightning', 'Lightning', 'Speed']
];
const BAD_GUIDE = [
  ['bag', 'Bag', '-2'],
  ['glass', 'Glass', '-2'],
  ['web', 'Net', '-3'],
  ['poison', 'Poison', '-3'],
  ['snow', 'Snow', 'Freeze']
];

const MOUTH_OPEN_AT = 0.34;
const MOUTH_CLOSE_AT = 0.2;
let camVideo = null;
let faceLandmarker = null;
let cameraReady = false;
let cameraError = '';
let visionLoading = false;
let modelLoading = false;
let mouthPhase = 'unknown';
let mouthSeen = false;
let lastDetectAt = 0;

function preload() {
  seaImg = loadImage('images/sea.png');
  bigFishImg = loadImage('images/bigfish.png');
  smallFishImg = loadImage('images/smallfish.png');
  breadImg = loadImage('images/bread.png');
  weedsImg = loadImage('images/weeds.png');
  bugImg = loadImage('images/bug.png');
  shrimpImg = loadImage('images/shrimp.png');
  bagImg = loadImage('images/bag.png');
  glassImg = loadImage('images/glass.png');
  webImg = loadImage('images/web.png');
  poisonImg = loadImage('images/poison.png');
  lightningImg = loadImage('images/lightning.png');
  snowImg = loadImage('images/snow.png');
  gogofishImg = loadImage('images/Go Go Fish.png');
  startImg = loadImage('images/starto.png');
  restartImg = loadImage('images/restarto.png');
  gameoverImg = loadImage('images/Game Over.png')
  gogoFishSound = loadSound('audio/gogo fish.mp3')
  backgroundMusic = loadSound('audio/music.mp3')
  bubblesSound = loadSound('audio/bubbles.mp3')
  badSound = loadSound('audio/bad.mp3')
  goodSound = loadSound('audio/good.mp3')
  loseSound = loadSound('audio/lose.mp3')
  winSound = loadSound('audio/win.mp3');
  winImg= loadImage('images/win.png')
  starImg= loadImage('images/star.png')
  shanhuImg= loadImage('images/shanhu.png')
}

function setup() {
  createCanvas(800, 600);
  textFont('PingFang SC');
  bigFishX = 0;
  bigFishY = random(height - 150);
  smallFishX = random(width);
  smallFishY = height * 3 / 4;
  generateItems();
  backgroundMusic.loop();
  loadFaceLandmarker();
}

function draw() {
  updateMouth();
  if (!gamestart) {
    drawStartScreen();
  } else if (gameOver) {
    drawGameOverScreen();
  } else if (gameWon) {
    drawWonScreen(); // 叠加显示胜利画面
  } else if (showGuide) {
    drawPlayfield(false);
    drawGuideOverlay();
  } else {
    drawPlayfield(true);
  }
}


function drawStartScreen() {
  image(seaImg, 0, 0, width, height);
  bigFishX += 2;
  if (bigFishX > width + 150) {
    bigFishX = -300;
  }
  push();
  translate(bigFishX + 150, bigFishY + 75);
  scale(-bigFishDirection, 1);
  imageMode(CENTER);
  image(bigFishImg, 0, -50, 300, 150);
  pop();
  image(gogofishImg, bigFishX - 300, bigFishY - 20, 257, 50);
  fill(8, 32, 58, 45);
  noStroke();
  rect(0, 0, width, height);
  drawHowToPanel('start');
}

function drawPlayfield(simulate) {
  imageMode(CORNER);
  image(seaImg, 0, 0, width, height);
  if (simulate) {
    if (freezeTimer > 0) {
      freezeTimer--;
      bigFishSpeed = 0;
    } else {
      bigFishSpeed = bigFishBaseSpeed;
    }
    if (speedBoostTimer > 0) {
      speedBoostTimer--;
      bigFishSpeed = bigFishBaseSpeed * 1.5;
    }
    bigFishX -= bigFishSpeed * bigFishDirection;
    if (bigFishX > width) {
      bigFishX = -300;
      bigFishY = random(height - 150);
    } else if (bigFishX < -300) {
      bigFishX = width;
      bigFishY = random(height - 150);
    }
  }
  push();
  translate(bigFishX + 150, bigFishY + 75);
  scale(bigFishDirection, 1);
  imageMode(CENTER);
  image(bigFishImg, 0, 0, 300, 150);
  pop();
  if (simulate) {
    moveSmallFish();
  }
  push();
  translate(smallFishX, smallFishY);
  rotate(radians(smallFishAngle));
  imageMode(CENTER);
  image(smallFishImg, 0, 0, 80, 40);
  pop();
  drawItemsAndCheckCollisions(simulate);
  drawHud();
  if (simulate) {
    if (energy >= 20) {
      gameWon = true;
    }
    if (energy <= 0) {
      gameOver = true;
    }
  }
}

function drawGameOverScreen() {
  image(seaImg, 0, 0, width, height);
  fill(255);
  image(gameoverImg, width / 2 - 155, height / 2 - 100, 310, 60);
  image(restartImg, width / 2 - 75, height / 2 + 50, 150, 60);
  restartBtn = { x: width / 2 - 75, y: height / 2 + 50, w: 150, h: 60 };
  
  if (!loseSoundPlayed) { // 确保音效只播放一次
    loseSound.play();
    loseSoundPlayed = true;
  }
 // <-- 应该加上一个闭合大括号

  bigFishY -= 1;
  bigFishRotation += 0.05;
  push();
  translate(bigFishX + 150, bigFishY + 75);
  rotate(bigFishRotation);
  imageMode(CENTER);
  scale(bigFishDirection, 1);
  image(bigFishImg, 0, 0, 300, 150);
  pop();
}

function drawWonScreen() {
  image(seaImg, 0, 0, width, height);
  fill(255);
  image(winImg, width / 2 - 155, height / 2 - 100, 310, 60);
  //大鱼旋转效果
  {push();
  translate(width / 2 - 200, height / 2); // 将大鱼移动到中心左侧
  rotate(HALF_PI);
  rotate(frameCount * 0.02); // 持续旋转
  imageMode(CENTER);
  image(bigFishImg, 0, 0, 300, 150); // 竖起展示
  pop();
  }
  // 小鱼旋转效果
  {push();
  translate(width / 2 + 200, height / 2); // 将小鱼移动到中心右侧
  rotate(HALF_PI);
  rotate(-frameCount * 0.05); // 反方向旋转
  imageMode(CENTER);
  image(smallFishImg, 0, 0, 80, 40); // 竖起展示
  pop();
  }
  // 海星海草旋转效果
  {push();
    translate(width /2, height/2-150); 
    image(starImg, 0, 0, 80, 80); // 竖起展示
    pop();
    }
    {push();
      translate(width - 250, height -200); 
      image(shanhuImg, 0, 0, 280, 250); // 竖起展示
      pop();}
  // 确保胜利音效只播放一次
  if (!winSoundPlayed) {
    winSound.play();
    winSoundPlayed = true;
  }
  fill(255);
  image(winImg, width / 2 - 155, height / 2 - 100, 310, 60);
  // 显示重新开始按钮
  image(restartImg, width / 2 - 75, height / 2 + 50, 150, 60);
  restartBtn = { x: width / 2 - 75, y: height / 2 + 50, w: 150, h: 60 };
}


function mousePressed() {
  if (!gamestart) {
    if (hitBtn(startBtn)) startGame();
    return;
  }
  if (gameOver || gameWon) {
    if (hitBtn(restartBtn)) restartGame();
    return;
  }
  if (showGuide) {
    if (hitBtn(closeGuideBtn)) showGuide = false;
    return;
  }
  if (hitBtn(helpBtn)) showGuide = true;
}

function startGame() {
  gamestart = true;
  showGuide = false;
  setupCamera();
  if (gogoFishSound.isPlaying()) {
    gogoFishSound.stop(); // 防止重复播放
  }
  gogoFishSound.play(); // 开始播放音频
}


function restartGame() {
  energy = 10;
  gameOver = false;
  gameWon = false; // 重置胜利状态
  showGuide = false;
  bigFishRotation = 0;
  items = [];
  freezeTimer = 0;
  speedBoostTimer = 0;
  loseSoundPlayed = false; // 重置 loseSound 播放标志
  winSoundPlayed = false; // 重置 winSound 播放标志
  generateItems();
}



function moveSmallFish() {
  smallFishX -= smallFishSpeed * cos(radians(smallFishAngle));
  smallFishY -= smallFishSpeed * sin(radians(smallFishAngle));
  if (smallFishX > width) {
    smallFishX = 0;
    smallFishY = random(height);
  }
  if (smallFishX < 0) {
    smallFishX = width;
    smallFishY = random(height);
  }
}

function keyPressed() {
  if (!gamestart && keyCode === RIGHT_ARROW) {
    startGame();
    return;
  }
  if ((gameOver || gameWon) && keyCode === RIGHT_ARROW) {
    restartGame();
    return;
  }
  if (key === 'h' || key === 'H' || key === '?') {
    showGuide = !showGuide;
    return;
  }
  if (showGuide && (keyCode === RIGHT_ARROW || keyCode === ESCAPE)) {
    showGuide = false;
    return;
  }
  if (keyCode === RIGHT_ARROW) {
    turnFish();
  }
}


function generateItem() {
  let itemType = random(['bread', 'weeds', 'bug', 'shrimp', 'bag', 'glass', 'web', 'poison', 'lightning', 'snow']);
  let itemImg;
  if (itemType === 'bread') itemImg = breadImg;
  else if (itemType === 'weeds') itemImg = weedsImg;
  else if (itemType === 'bug') itemImg = bugImg;
  else if (itemType === 'shrimp') itemImg = shrimpImg;
  else if (itemType === 'bag') itemImg = bagImg;
  else if (itemType === 'glass') itemImg = glassImg;
  else if (itemType === 'web') itemImg = webImg;
  else if (itemType === 'poison') itemImg = poisonImg;
  else if (itemType === 'lightning') itemImg = lightningImg;
  else if (itemType === 'snow') itemImg = snowImg;
  let item = {
    x: random(width),
    y: 0,
    speed: random(0.5, 2),
    type: itemType,
    img: itemImg,
    timer: 300
  };
  items.push(item);
}

function generateItems() {
  for (let i = 0; i < 5; i++) {
    generateItem();
  }
}

function drawItemsAndCheckCollisions(simulate) {
  imageMode(CORNER);
  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    image(item.img, item.x, item.y, 60, 60);
    if (!simulate) continue;
    item.y += item.speed;
    if (dist(bigFishX + 150, bigFishY + 75, item.x, item.y) < 100) {
      if (item.type === 'bread') {energy += 1;goodSound.play(); }
      else if (item.type === 'weeds') {energy += 1;goodSound.play(); }
      else if (item.type === 'bug') {energy += 2;goodSound.play(); }
      else if (item.type === 'shrimp') {energy += 3;goodSound.play(); }
      else if (item.type === 'bag') {energy -= 2;badSound.play()}
      else if (item.type === 'glass') {energy -= 2;badSound.play()}
      else if (item.type === 'web') {energy -= 3;badSound.play()}
      else if (item.type === 'poison') {energy -= 3;badSound.play()}
      else if (item.type === 'lightning') {speedBoostTimer = 180;goodSound.play(); }
      else if (item.type === 'snow') {freezeTimer = 180;badSound.play();}
      items.splice(i, 1);
      generateItem();
    }
    item.timer--;
    if (item.timer <= 0 || item.y > height) {
      items.splice(i, 1);
      generateItem();
    }
  }
}

function hitBtn(btn) {
  return mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h;
}

function guideImage(type) {
  if (type === 'bread') return breadImg;
  if (type === 'weeds') return weedsImg;
  if (type === 'bug') return bugImg;
  if (type === 'shrimp') return shrimpImg;
  if (type === 'bag') return bagImg;
  if (type === 'glass') return glassImg;
  if (type === 'web') return webImg;
  if (type === 'poison') return poisonImg;
  if (type === 'lightning') return lightningImg;
  return snowImg;
}

function drawCreamPanel(x, y, w, h) {
  push();
  drawingContext.shadowColor = 'rgba(20, 60, 90, 0.22)';
  drawingContext.shadowBlur = 18;
  drawingContext.shadowOffsetY = 8;
  noStroke();
  fill(255, 248, 232, 244);
  rect(x, y, w, h, 22);
  pop();
  drawingContext.shadowBlur = 0;
  drawingContext.shadowOffsetY = 0;
}

function drawItemLegend(entries, x, y, effectColor) {
  const slot = 136;
  imageMode(CORNER);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const cx = x + i * slot;
    image(guideImage(entry[0]), cx, y, 36, 36);
    fill(22, 58, 92);
    noStroke();
    textAlign(LEFT, CENTER);
    textSize(14);
    text(entry[1], cx + 42, y + 11);
    fill(effectColor);
    textSize(13);
    text(entry[2], cx + 42, y + 28);
  }
}

function drawHowToPanel(mode) {
  const panel = { x: 36, y: mode === 'start' ? 78 : 36, w: 728, h: 500 };
  drawCreamPanel(panel.x, panel.y, panel.w, panel.h);

  const left = panel.x + 32;
  const center = panel.x + panel.w / 2;
  let y = panel.y + 34;

  noStroke();
  fill(22, 58, 92);
  textAlign(CENTER, CENTER);
  textSize(28);
  text('How to play', center, y);

  y += 32;
  textSize(15);
  text('The big fish swims on its own. Catch the food that falls from above.', center, y);

  y += 16;
  drawControlGuide(center - 236, y);
  y += 96;

  textAlign(CENTER, CENTER);
  textSize(15);
  fill(22, 58, 92);
  text('Open your mouth and close it, or press the Right arrow, to turn the fish.', center, y);

  y += 30;
  textAlign(LEFT, CENTER);
  text('Goal: raise Energy from 10 to 20 to win. At 0, you lose.', left, y);

  y += 28;
  fill(31, 122, 69);
  textAlign(LEFT, CENTER);
  text('Good food', left, y);
  drawItemLegend(GOOD_GUIDE, left, y + 14, color(31, 122, 69));

  y += 76;
  fill(192, 57, 43);
  textAlign(LEFT, CENTER);
  text('Watch out', left, y);
  drawItemLegend(BAD_GUIDE, left, y + 14, color(192, 57, 43));

  const btnY = panel.y + panel.h - 86;
  imageMode(CORNER);
  if (mode === 'start') {
    startBtn = { x: center - 60, y: btnY, w: 120, h: 52 };
    image(startImg, startBtn.x, startBtn.y, startBtn.w, startBtn.h);
    fill(22, 58, 92);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(13);
    text('or press → to start', center, panel.y + panel.h - 18);
  } else {
    closeGuideBtn = { x: center - 60, y: btnY, w: 120, h: 44 };
    noStroke();
    fill(232, 140, 48);
    rect(closeGuideBtn.x, closeGuideBtn.y, closeGuideBtn.w, closeGuideBtn.h, 14);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(18);
    text('Resume', center, closeGuideBtn.y + closeGuideBtn.h / 2);
    fill(22, 58, 92);
    textSize(13);
    text('or press → to continue', center, panel.y + panel.h - 18);
  }
}

function drawGuideOverlay() {
  noStroke();
  fill(8, 32, 58, 100);
  rect(0, 0, width, height);
  drawHowToPanel('resume');
}

function drawHud() {
  textSize(15);
  const energyLabel = `Energy ${energy} / 20`;
  const energyColor = energy <= 5 ? color(192, 57, 43) : energy >= 15 ? color(31, 122, 69) : color(22, 58, 92);
  let x = 16;
  x += drawPill(x, 14, energyLabel, energyColor, color(255, 248, 232, 225)) + 8;

  if (speedBoostTimer > 0) {
    drawPill(x, 14, 'Speeding', color(180, 90, 20), color(255, 236, 180, 230));
  } else if (freezeTimer > 0) {
    drawPill(x, 14, 'Frozen', color(40, 90, 160), color(220, 238, 255, 230));
  }

  helpBtn = { x: width - 84, y: 14, w: 68, h: 34 };
  noStroke();
  fill(232, 140, 48);
  rect(helpBtn.x, helpBtn.y, helpBtn.w, helpBtn.h, 16);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(15);
  text('Help', helpBtn.x + helpBtn.w / 2, helpBtn.y + helpBtn.h / 2);
}

function drawPill(x, y, label, textFill, bg) {
  textSize(15);
  const w = textWidth(label) + 24;
  noStroke();
  fill(bg);
  rect(x, y, w, 34, 16);
  fill(textFill);
  textAlign(CENTER, CENTER);
  text(label, x + w / 2, y + 17);
  return w;
}

function turnFish() {
  bigFishDirection *= -1;
}

function drawMouthIcon(x, y, open) {
  noStroke();
  fill(255, 214, 176);
  circle(x, y, 46);
  fill(255, 232, 206);
  circle(x - 8, y - 8, 16);
  fill(48, 42, 46);
  circle(x - 9, y - 5, 5);
  circle(x + 9, y - 5, 5);
  if (open) {
    fill(92, 28, 40);
    ellipse(x, y + 11, 20, 18);
    fill(255, 160, 168);
    ellipse(x, y + 15, 12, 7);
  } else {
    stroke(168, 72, 84);
    strokeWeight(2.5);
    noFill();
    line(x - 8, y + 11, x + 8, y + 11);
    noStroke();
  }
}

function drawChevron(x, y) {
  stroke(224, 122, 61);
  strokeWeight(3);
  noFill();
  line(x, y, x + 16, y);
  line(x + 10, y - 6, x + 16, y);
  line(x + 10, y + 6, x + 16, y);
  noStroke();
}

function drawArrowKey(x, y) {
  const w = 46;
  const h = 36;
  noStroke();
  fill(186, 202, 214);
  rect(x, y + 4, w, h, 8);
  fill(255);
  stroke(22, 58, 92);
  strokeWeight(2);
  rect(x, y, w, h, 8);
  stroke(22, 58, 92);
  strokeWeight(2.5);
  const midY = y + h / 2;
  line(x + 13, midY, x + 31, midY);
  line(x + 25, midY - 6, x + 32, midY);
  line(x + 25, midY + 6, x + 32, midY);
  noStroke();
}

function drawControlGuide(x, y) {
  const cy = y + 26;
  const steps = [false, true, false];
  let cursor = x;
  for (let i = 0; i < steps.length; i++) {
    drawMouthIcon(cursor + 23, cy, steps[i]);
    if (i < steps.length - 1) drawChevron(cursor + 50, cy);
    cursor += 78;
  }

  fill(22, 58, 92);
  noStroke();
  textSize(14);
  textAlign(CENTER, CENTER);
  text('or', cursor + 16, cy);

  const keyX = cursor + 36;
  drawArrowKey(keyX, cy - 18);

  fill(22, 58, 92);
  noStroke();
  textSize(22);
  textAlign(CENTER, CENTER);
  text('=', cursor + 112, cy);

  const fishX = cursor + 178;
  imageMode(CENTER);
  image(bigFishImg, fishX, cy + 2, 86, 44);
  noFill();
  stroke(224, 122, 61);
  strokeWeight(2.5);
  arc(fishX, cy - 18, 36, 22, PI + 0.25, TWO_PI - 0.1);
  const ax = fishX + 17;
  const ay = cy - 18;
  line(ax, ay, ax - 8, ay - 4);
  line(ax, ay, ax - 2, ay + 6);
  noStroke();

  textSize(12);
  fill(70, 92, 112);
  textAlign(CENTER, CENTER);
  text('1  close', x + 23, y + 62);
  text('2  open', x + 101, y + 62);
  text('3  close', x + 179, y + 62);
  text('Right', keyX + 23, y + 62);
  text('turn', fishX, y + 62);
}

function canMouthTurn() {
  return gamestart && !gameOver && !gameWon && !showGuide;
}

function mouthRatio(landmarks) {
  const upper = landmarks[13];
  const lower = landmarks[14];
  const left = landmarks[78];
  const right = landmarks[308];
  const width = Math.hypot(right.x - left.x, right.y - left.y);
  const height = Math.hypot(lower.x - upper.x, lower.y - upper.y);
  if (width < 0.001) return 0;
  return height / width;
}

function applyMouthSample(ratio, faceFound) {
  mouthSeen = faceFound;
  if (!faceFound) return;
  if (mouthPhase === 'unknown') {
    if (ratio <= MOUTH_CLOSE_AT) mouthPhase = 'closed';
    return;
  }
  if (mouthPhase === 'closed' && ratio >= MOUTH_OPEN_AT) {
    mouthPhase = 'open';
    return;
  }
  if (mouthPhase === 'open' && ratio <= MOUTH_CLOSE_AT) {
    mouthPhase = 'closed';
    if (canMouthTurn()) turnFish();
  }
}

function updateMouth() {
  if (!faceLandmarker || !camVideo || camVideo.readyState < 2 || camVideo.videoWidth === 0) return;
  const now = performance.now();
  if (now - lastDetectAt < 70) return;
  lastDetectAt = now;
  let result;
  try {
    result = faceLandmarker.detectForVideo(camVideo, now);
  } catch (err) {
    return;
  }
  const faces = result && result.faceLandmarks;
  if (!faces || !faces.length) {
    mouthSeen = false;
    return;
  }
  applyMouthSample(mouthRatio(faces[0]), true);
}

async function loadFaceLandmarker() {
  if (faceLandmarker || modelLoading) return;
  modelLoading = true;
  try {
    const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17');
    const fileset = await vision.FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm'
    );
    const modelAssetPath = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
    try {
      faceLandmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numFaces: 1
      });
    } catch (gpuErr) {
      faceLandmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numFaces: 1
      });
    }
  } catch (err) {
    cameraError = 'Face tracker failed';
  }
  modelLoading = false;
}

function setupCamera() {
  if (camVideo || visionLoading || cameraError) return;
  visionLoading = true;
  navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
    audio: false
  }).then(async (stream) => {
    camVideo = document.createElement('video');
    camVideo.playsInline = true;
    camVideo.muted = true;
    camVideo.autoplay = true;
    camVideo.srcObject = stream;
    camVideo.style.position = 'fixed';
    camVideo.style.left = '-9999px';
    document.body.appendChild(camVideo);
    await camVideo.play();
    cameraReady = true;
    visionLoading = false;
  }).catch(() => {
    cameraError = 'Camera blocked';
    visionLoading = false;
  });
}


