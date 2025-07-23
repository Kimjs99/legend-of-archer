// 전역 변수 설정
let bow, arrow, target;
let score = 0;
let arrowsLeft = 10;
let wind;
let power = 0;
let aiming = false;
let hitInfo = null;
let gameState = 'home';
let gameJustStarted = false;
const GRAVITY = 0.15;

// 추가된 기능 관련 변수
let timer = 10;
let shotHistory = [];

// 게임 설정 관련 변수
let playerName = '';
let gameSettings = {};

// HTML DOM 요소
let nameInput, easyButton, mediumButton, hardButton;

// p5.js 설정 함수
function setup() {
    const canvas = createCanvas(800, 600);
    createHomeScreenDOM(canvas);
}

// 홈 화면의 DOM 요소 생성 함수
function createHomeScreenDOM(canvas) {
    const centerX = width / 2;
    const centerY = height / 2;
    const canvasX = canvas.position().x;
    const canvasY = canvas.position().y;

    nameInput = createInput('');
    nameInput.position(canvasX + centerX - 110, canvasY + centerY - 30);
    nameInput.attribute('placeholder', '선수 이름을 입력해주세요');
    nameInput.addClass('input-style');

    const buttonY = canvasY + centerY + 80;
    easyButton = createButton('쉬움');
    easyButton.position(canvasX + centerX - 180, buttonY);
    easyButton.addClass('button-style easy');
    easyButton.mousePressed(() => startGame('easy'));

    mediumButton = createButton('보통');
    mediumButton.position(canvasX + centerX - 60, buttonY);
    mediumButton.addClass('button-style medium');
    mediumButton.mousePressed(() => startGame('medium'));

    hardButton = createButton('어려움');
    hardButton.position(canvasX + centerX + 60, buttonY);
    hardButton.addClass('button-style hard');
    hardButton.mousePressed(() => startGame('hard'));
}

// 게임 시작 함수
function startGame(difficulty) {
    playerName = nameInput.value();
    if (playerName.trim() === '') {
        playerName = '궁수';
    }

    switch (difficulty) {
        case 'easy':
            gameSettings = { targetSize: 200, windScale: 0.03, powerSpeed: 1.2 };
            break;
        case 'hard':
            gameSettings = { targetSize: 160, windScale: 0.08, powerSpeed: 1.8 };
            break;
        case 'medium':
        default:
            gameSettings = { targetSize: 180, windScale: 0.05, powerSpeed: 1.5 };
            break;
    }
    
    nameInput.hide();
    easyButton.hide();
    mediumButton.hide();
    hardButton.hide();

    resetGame();
    gameJustStarted = true;
}

// 게임 초기화/재시작 함수
function resetGame() {
    score = 0;
    arrowsLeft = 10;
    shotHistory = []; // 샷 기록 초기화
    bow = { x: 100, y: height - 200, width: 20, height: 120 };
    target = { x: width - 150, y: height - 200, rings: 10, size: gameSettings.targetSize };
    resetArrow();
    gameState = 'playing';
}

// 화살 초기화 함수
function resetArrow() {
    if (arrowsLeft > 0) {
        arrow = { x: bow.x, y: bow.y, vx: 0, vy: 0, rotation: 0, isFlying: false, size: 60 };
        wind = createVector(0, random(-gameSettings.windScale, gameSettings.windScale));
        power = 0;
        aiming = false;
        hitInfo = null;
        timer = 10; // 타이머 초기화
        gameState = 'playing';
    } else {
        gameState = 'end';
    }
}

// p5.js 그리기 함수
function draw() {
    background(220, 237, 245);
    noStroke();
    fill(147, 196, 125);
    rect(0, height - 100, width, 100);

    switch (gameState) {
        case 'home':
            showHomeScreen();
            break;
        case 'playing': case 'fired':
            drawGameElements();
            updateArrow();
            if (gameState === 'playing') updateTimer();
            break;
        case 'showHit':
            drawGameElements();
            drawHitReplay();
            break;
        case 'end':
            showEndScreen();
            break;
    }
}

// 게임 요소 그리기
function drawGameElements() {
    drawTarget();
    drawBow();
    drawArrow();
    drawUI();
    if (aiming) drawPowerBar();
}

// 마우스 이벤트
function mousePressed() {
    if (gameJustStarted) return;
    if (gameState === 'playing' && arrowsLeft > 0) {
        aiming = true;
        power = 0;
    } else if (gameState === 'end') {
        nameInput.show();
        easyButton.show();
        mediumButton.show();
        hardButton.show();
        gameState = 'home';
    }
}

function mouseReleased() {
    if (gameJustStarted) {
        gameJustStarted = false;
        return;
    }
    if (gameState === 'playing' && aiming) {
        fireArrow();
    }
}

// 화살 발사 함수
function fireArrow() {
    aiming = false;
    gameState = 'fired';
    arrowsLeft--;
    let angle = atan2(mouseY - bow.y, mouseX - bow.x);
    let force = power / 6;
    arrow.vx = force * cos(angle);
    arrow.vy = force * sin(angle);
    arrow.isFlying = true;
}

// 타이머 업데이트
function updateTimer() {
    timer -= deltaTime / 1000;
    if (timer <= 0) {
        shotHistory.push({ hit: false, points: 0 }); // 시간 초과 기록
        fireArrow(); // 시간이 다 되면 자동으로 발사 (0점 처리)
    }
}

// 화살 상태 업데이트
function updateArrow() {
    if (arrow.isFlying) {
        arrow.vy += GRAVITY;
        arrow.vy += wind.y;
        arrow.x += arrow.vx;
        arrow.y += arrow.vy;
        arrow.rotation = atan2(arrow.vy, arrow.vx);
        let d = dist(arrow.x, arrow.y, target.x, target.y);
        if (d < target.size / 2 && arrow.x > target.x - 20) {
            arrow.isFlying = false;
            let points = calculateScore(d);
            score += points;
            let relX = arrow.x - target.x;
            let relY = arrow.y - target.y;
            shotHistory.push({ hit: true, points: points, x: relX, y: relY });
            hitInfo = { x: arrow.x, y: arrow.y, points: points, relX: relX, relY: relY };
            gameState = 'showHit';
            setTimeout(resetArrow, 2500);
        }
        if (arrow.isFlying && (arrow.y > height - 100 || arrow.x > width || arrow.x < 0)) {
            arrow.isFlying = false;
            shotHistory.push({ hit: false, points: 0 });
            setTimeout(resetArrow, 1500);
        }
    }
}

// 명중 결과 중계
function drawHitReplay() {
    if (!hitInfo) return;
    const boxX = width - 320, boxY = 50, boxW = 300, boxH = 450;
    push();
    fill(0, 0, 0, 180);
    stroke(255);
    strokeWeight(2);
    rect(boxX, boxY, boxW, boxH, 10);
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textFont('Noto Sans KR');
    textSize(24);
    text("명중 결과", boxX + boxW / 2, boxY + 30);
    
    // 점수
    push();
    fill('#FFD700');
    textSize(60);
    textStyle(BOLD);
    text(hitInfo.points, boxX + boxW / 2, boxY + 80);
    textSize(24);
    textStyle(NORMAL);
    fill(255);
    text("점", boxX + boxW / 2 + (hitInfo.points === 10 ? 45 : 30), boxY + 80);
    pop();

    // 오차 안내
    textAlign(LEFT, CENTER);
    textSize(16);
    let yOffsetText = hitInfo.relY > 0 ? `아래 ${abs(hitInfo.relY).toFixed(1)}` : `위 ${abs(hitInfo.relY).toFixed(1)}`;
    let xOffsetText = hitInfo.relX > 0 ? `오른쪽 ${abs(hitInfo.relX).toFixed(1)}` : `왼쪽 ${abs(hitInfo.relX).toFixed(1)}`;
    text(`상하 오차: ${yOffsetText}`, boxX + 30, boxY + 140);
    text(`좌우 오차: ${xOffsetText}`, boxX + 30, boxY + 170);

    // 확대 과녁
    const magTargetX = boxX + boxW / 2;
    const magTargetY = boxY + 300;
    const magTargetSize = 220;
    drawTarget(magTargetX, magTargetY, magTargetSize, true, true);
    let scaleFactor = magTargetSize / target.size;
    let scaledHitX = hitInfo.relX * scaleFactor;
    let scaledHitY = hitInfo.relY * scaleFactor;
    stroke(255, 0, 0);
    strokeWeight(3);
    fill(255, 0, 0, 150);
    ellipse(magTargetX + scaledHitX, magTargetY + scaledHitY, 15, 15);
    line(magTargetX + scaledHitX - 10, magTargetY + scaledHitY, magTargetX + scaledHitX + 10, magTargetY + scaledHitY);
    line(magTargetX + scaledHitX, magTargetY + scaledHitY - 10, magTargetX + scaledHitX, magTargetY + scaledHitY + 10);
    pop();
}

// 과녁 그리기
function drawTarget(x = target.x, y = target.y, size = target.size, isReplay = false, showScoreNumbers = false) {
    push();
    translate(x, y);
    fill(139, 69, 19, 200);
    noStroke();
    if (!isReplay) triangle(-20, size/2 + 100-y, 0, size/2, 20, size/2 + 100-y);
    fill(240);
    stroke(150);
    strokeWeight(1);
    ellipse(0, 0, size * 0.95, size);
    let colors = ['#FFD700', '#FFD700', '#FF4136', '#FF4136', '#0074D9', '#0074D9', '#000000', '#000000', '#FFFFFF', '#FFFFFF'];
    noStroke();
    for (let i = 0; i < target.rings; i++) {
        fill(colors[target.rings - 1 - i]);
        ellipse(0, 0, (size - i * (size / target.rings)) * 0.9, size - i * (size / target.rings));
    }
    if (showScoreNumbers) {
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(isReplay ? 14 : 10);
        let ringRadiusX = (size / 2) * 0.9 / target.rings;
        for (let i = 0; i < 5; i++) {
            let score = 10 - i * 2;
            let rX = ringRadiusX * (i * 2 + 1.5);
            if (score >= 7) fill(0); else fill(255);
            text(score, rX, 0);
        }
    }
    pop();
}

// 활 그리기
function drawBow() {
    push();
    translate(bow.x, bow.y);
    if (!arrow.isFlying) {
        let angle = atan2(mouseY - bow.y, mouseX - bow.x);
        rotate(angle);
    }
    noFill();
    stroke(101, 67, 33);
    strokeWeight(10);
    strokeJoin(ROUND);
    beginShape();
    curveVertex(0, -bow.height / 2 - 15);
    curveVertex(0, -bow.height / 2);
    curveVertex(10, -bow.height / 4);
    curveVertex(5, -10);
    curveVertex(5, 10);
    curveVertex(10, bow.height / 4);
    curveVertex(0, bow.height / 2);
    curveVertex(0, bow.height / 2 + 15);
    endShape();
    fill(139, 69, 19);
    noStroke();
    beginShape();
    vertex(0, -15);
    vertex(8, -10);
    vertex(8, 10);
    vertex(0, 15);
    endShape(CLOSE);
    stroke(245, 245, 245);
    strokeWeight(2);
    let stringX = 0;
    if (aiming) {
        stringX = -power / 2.5;
    }
    line(stringX, 0, 0, -bow.height / 2);
    line(stringX, 0, 0, bow.height / 2);
    if (aiming) {
        fill(255);
        noStroke();
        ellipse(stringX, 0, 5, 5);
    }
    pop();
}

// 화살 그리기
function drawArrow() {
    push();
    translate(arrow.x, arrow.y);
    if (!arrow.isFlying) {
        let angle = atan2(mouseY - bow.y, mouseX - bow.x);
        rotate(angle);
        let arrowOffset = aiming ? -power/2.5 : 0;
        translate(arrowOffset, 0);
    } else {
        rotate(arrow.rotation);
    }
    stroke(139, 69, 19);
    strokeWeight(2);
    fill(255);
    line(-arrow.size / 2, 0, arrow.size / 2, 0);
    fill(200);
    triangle(arrow.size / 2, 0, arrow.size / 2 - 10, -5, arrow.size / 2 - 10, 5);
    fill(255, 255, 255, 150);
    quad(-arrow.size/2, 0, -arrow.size/2 - 10, -5, -arrow.size/2-15, 0, -arrow.size/2 -10, 5);
    pop();
}

// 파워 게이지
function drawPowerBar() {
    if (power < 100) {
        power += gameSettings.powerSpeed;
    }
    push();
    translate(bow.x, bow.y + bow.height / 2 + 45);
    textFont('Poppins');
    textSize(14);
    fill(0, 0, 0, 100);
    text("POWER", 51, -9);
    fill(255);
    text("POWER", 50, -10);
    fill(0, 0, 0, 80);
    noStroke();
    rect(0, 0, 102, 12, 6);
    fill(255, 204, 0);
    rect(1, 1, power, 10, 5);
    pop();
}

// UI
function drawUI() {
    // --- Player Info Panel (Top-Left) ---
    push();
    fill(0, 0, 0, 50);
    noStroke();
    rect(10, 10, 280, 90, 10);

    textFont('Noto Sans KR');
    textSize(18);
    fill(255);
    textAlign(LEFT, CENTER);
    
    // Text Shadow
    drawingContext.shadowOffsetX = 2;
    drawingContext.shadowOffsetY = 2;
    drawingContext.shadowBlur = 3;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';

    text(`선수: ${playerName}`, 30, 35);
    text(`점수: ${score}`, 30, 65);
    text(`남은 화살: ${arrowsLeft}`, 160, 65);
    pop();

    // --- Wind Indicator (Top-Right) ---
    push();
    translate(width - 80, 50);

    // Panel
    fill(0, 0, 0, 50);
    noStroke();
    rect(-50, -30, 100, 60, 10);
    
    // Text Shadow
    drawingContext.shadowOffsetX = 2;
    drawingContext.shadowOffsetY = 2;
    drawingContext.shadowBlur = 3;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';

    // Title
    fill(255);
    textAlign(CENTER, CENTER);
    textFont('Poppins');
    textSize(16);
    text("WIND", 0, -12);

    // Gauge
    stroke(255, 150);
    strokeWeight(4);
    line(0, 0, 0, 20);

    // Arrow
    let windStrength = map(abs(wind.y), 0, gameSettings.windScale, 0, 10);
    let windDir = wind.y > 0 ? 1 : -1;

    if (abs(wind.y) > 0.001) { // 바람이 있을 때만 표시
        stroke(255, 0, 0);
        strokeWeight(3);
        line(0, 10, 0, 10 + windStrength * windDir);

        // Arrowhead
        fill(255, 0, 0);
        noStroke();
        let arrowY = 10 + windStrength * windDir;
        if (windDir > 0) { // Down
            triangle(0, arrowY, -4, arrowY - 4, 4, arrowY - 4);
        } else { // Up
            triangle(0, arrowY, -4, arrowY + 4, 4, arrowY + 4);
        }
    } else { // 바람이 없을 때
        fill(255);
        noStroke();
        circle(0, 10, 6);
    }
    pop();
    
    // 타이머
    push();
    translate(width/2, 40);
    noFill();
    strokeWeight(4);
    stroke(0,0,0,50);
    arc(0,0, 40, 40, -HALF_PI, TWO_PI-HALF_PI);
    stroke(255);
    let angle = map(timer, 0, 10, -HALF_PI, TWO_PI-HALF_PI);
    arc(0,0, 40, 40, -HALF_PI, angle);
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(floor(timer), 0, 0);
    pop();
}

// 홈 화면
function showHomeScreen() {
    fill(0, 0, 0, 100);
    rect(0, 0, width, height);
    
    fill(255, 255, 255, 240);
    stroke(200);
    strokeWeight(2);
    rectMode(CENTER);
    rect(width/2, height/2, 500, 350, 20);
    rectMode(CORNER);

    // 제목
    textAlign(CENTER, CENTER);
    noStroke();
    fill(50);
    textFont('Cinzel');
    textSize(50); // 폰트 크기 축소
    text("Legend of Archer", width / 2, height / 2 - 100);
    
    // 제목 옆 아이콘
    push();
    translate(width/2 + 175, height/2 - 100); // 위치 조정
    rotate(QUARTER_PI / 2);
    stroke(160, 82, 45);
    strokeWeight(4);
    noFill();
    arc(0, 0, 30, 60, -HALF_PI, HALF_PI);
    stroke(139, 69, 19);
    line(-25, 0, 12, 0);
    fill(200);
    noStroke();
    triangle(12, 0, 3, -3, 3, 3);
    pop();

    // 안내 문구
    textFont('Noto Sans KR');
    textSize(18);
    fill(100);
    text("난이도를 선택해주세요", width / 2, height/2 + 40);
}

// 종료 화면
function showEndScreen() {
    background(0, 0, 0, 150);
    
    // 결과 분석 패널
    fill(255, 255, 255, 240);
    stroke(200);
    strokeWeight(2);
    rectMode(CENTER);
    rect(width/2, height/2, 700, 450, 20);
    rectMode(CORNER);
    
    textAlign(CENTER, CENTER);
    textFont('Noto Sans KR');
    textSize(40);
    fill(50);
    noStroke();
    text("최종 결과", width/2, height/2 - 180);
    
    // 전체 표적
    const resultTargetX = width/2 - 150;
    const resultTargetY = height/2 + 20;
    const resultTargetSize = 300;
    drawTarget(resultTargetX, resultTargetY, resultTargetSize, true, true);
    
    // 샷 히스토리 표시
    let totalX = 0, totalY = 0, hitCount = 0;
    for(let i = 0; i < shotHistory.length; i++) {
        const shot = shotHistory[i];
        if(shot.hit) {
            hitCount++;
            totalX += shot.x;
            totalY += shot.y;
            let scaleFactor = resultTargetSize / gameSettings.targetSize;
            let x = resultTargetX + shot.x * scaleFactor;
            let y = resultTargetY + shot.y * scaleFactor;
            fill(255,0,0,150);
            noStroke();
            ellipse(x, y, 10, 10);
            fill(255);
            textSize(10);
            text(i+1, x, y);
        }
    }
    
    // 정확도 분석
    textAlign(LEFT, CENTER);
    fill(50);
    textSize(18);
    text(`${playerName}님의 최종 점수: ${score}점`, width/2 + 50, height/2 - 100);
    
    if(hitCount > 0) {
        let avgX = totalX / hitCount;
        let avgY = totalY / hitCount;
        let xDir = avgX > 0 ? "오른쪽" : "왼쪽";
        let yDir = avgY > 0 ? "아래" : "위";
        
        text(`명중률: ${((hitCount/10)*100).toFixed(0)}% (${hitCount}/10)`, width/2 + 50, height/2 - 60);
        text(`평균 상하 오차: ${yDir} ${abs(avgY).toFixed(1)}`, width/2 + 50, height/2 - 20);
        text(`평균 좌우 오차: ${xDir} ${abs(avgX).toFixed(1)}`, width/2 + 50, height/2 + 20);
    } else {
        text("명중률: 0%", width/2 + 50, height/2 - 60);
        text("기록된 명중 정보가 없습니다.", width/2 + 50, height/2 - 20);
    }
    
    textSize(16);
    fill(100);
    text("클릭하여 홈으로 돌아가기", width/2, height/2 + 200);
}

// 점수 계산
function calculateScore(distance) {
    let ringSize = (target.size / 2) / target.rings;
    for (let i = 0; i < target.rings; i++) {
        if (distance < ringSize * (i + 1)) {
            return target.rings - i;
        }
    }
    return 0;
}
