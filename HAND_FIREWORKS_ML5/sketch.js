let video, handPose, hands = [];
let lastDistances = [];
let fireworks = [];

function setup() {
  createCanvas(windowWidth, windowHeight); // 全屏画布
  colorMode(HSB, 360, 100, 100, 100);

  video = createCapture(VIDEO);
  video.size(640, 480); // ✅ 固定原始比例，防止扭曲
  video.hide();

  handPose = ml5.handpose(video, { flipHorizontal: true }, () => {
    console.log("✅ Handpose 模型加载完成");
  });

  handPose.on("predict", gotHands);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  background(255);

  // ✅ 将视频画面居中显示在全屏画布上
  let x = (width - video.width) / 2;
  let y = (height - video.height) / 2;
  image(video, x, y, video.width, video.height);

  let currentDistances = [];

  for (let i = 0; i < hands.length; i++) {
    let landmarks = hands[i].landmarks;
    let thumbTip = landmarks[4];
    let middleTip = landmarks[12];

    if (thumbTip && middleTip) {
      currentDistances[i] = dist(thumbTip[0], thumbTip[1], middleTip[0], middleTip[1]);
    } else {
      currentDistances[i] = Infinity;
    }
  }

  for (let i = 0; i < currentDistances.length; i++) {
    let currentD = currentDistances[i];
    let lastD = lastDistances[i] || Infinity;

    if (currentD > 40 && lastD <= 40) {
      let thumbTip = hands[i].landmarks[4];
      let middleTip = hands[i].landmarks[12];

      fireworks.push(new Firework(
        x + lerp(thumbTip[0], middleTip[0], 0.5), // ✅ 补上位移 x
        y + lerp(thumbTip[1], middleTip[1], 0.5)  // ✅ 补上位移 y
      ));
    }
  }

  lastDistances = currentDistances.slice();

  // 不绘制关键点

  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].update();
    fireworks[i].display();
    if (fireworks[i].isFinished()) fireworks.splice(i, 1);
  }
}

class Firework {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.particles = [];
    this.lifespan = 100;
    this.fadeSpeed = 2;

    const layerConfigs = [
      { circles: 8,  radius: 0,   size: 12 },
      { circles: 12, radius: 30,  size: 8 },
      { circles: 18, radius: 60,  size: 6 },
      { circles: 24, radius: 90,  size: 4 },
      { circles: 30, radius: 120, size: 2 }
    ];

    for (let config of layerConfigs) {
      const angleStep = TWO_PI / config.circles;
      for (let a = 0; a < TWO_PI; a += angleStep) {
        this.particles.push({
          pos: p5.Vector.fromAngle(a).mult(config.radius),
          size: config.size,
          hue: this.getRandomHue(),
          angle: random(TWO_PI),
          speed: random(0.5, 2),
          alpha: 100
        });
      }
    }
  }

  getRandomHue() {
    const rand = random();
    if (rand < 0.4) return random(0, 15);
    else if (rand < 0.7) return random(15, 60);
    else return random(180, 300);
  }

  update() {
    this.lifespan -= this.fadeSpeed;
    for (let p of this.particles) {
      p.pos.rotate(p.speed * 0.01);
      p.alpha = map(this.lifespan, 100, 0, 100, 0);
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    for (let p of this.particles) {
      fill(p.hue, 90, 90, p.alpha);
      noStroke();
      circle(p.pos.x, p.pos.y, p.size * map(this.lifespan, 0, 100, 0.5, 1.5));
    }
    pop();
  }

  isFinished() {
    return this.lifespan <= 0;
  }
}
