const input = document.querySelector('#input');
const form = document.querySelector('form');
const logs = document.querySelector('#logs');

// 전광판 요소들
const currentInning = document.getElementById('current-inning');
const currentScore = document.getElementById('current-score');
const attemptsLeft = document.getElementById('attempts-left');
const rulesDisplay = document.getElementById('rules-display');
const inputDisplay = document.getElementById('input-display');

// 정답 생성 - 4자리 중복되지 않는 숫자
const answer = new Set();
while (answer.size < 4) {
    const randomNum = Math.floor(Math.random() * 9) + 1;
    answer.add(randomNum);
}

const answerArray = Array.from(answer);
console.log(answerArray); // 개발용 정답 확인

// 게임 상태 관리 - 시도한 값들을 저장하는 배열
const tries = [];

// 전광판 업데이트 함수들
function updateScoreboard() {
    attemptsLeft.textContent = 10 - tries.length;
    currentScore.textContent = tries.length;
}

function updateInputDisplay(inputValue, strike = 0, ball = 0, out = 0) {
    const inputItem = document.createElement('div');
    inputItem.className = 'input-item';
    
    // 결과 정보를 포함한 텍스트 생성
    let resultText = `입력: ${inputValue}`;
    if (strike > 0 || ball > 0 || out > 0) {
        resultText += ` | S:${strike} B:${ball} O:${out}`;
    }
    
    inputItem.textContent = resultText;
    inputDisplay.appendChild(inputItem);

    // 스크롤을 맨 아래로
    inputDisplay.scrollTop = inputDisplay.scrollHeight;

    // 최대 10개까지만 표시
    const items = inputDisplay.querySelectorAll('.input-item');
    if (items.length > 10) {
        items[0].remove();
    }
}

function showRulesOnScoreboard() {
    // 좌측 전광판에 규칙이 고정적으로 표시되므로 별도 처리 불필요
    // HTML에서 이미 규칙이 표시됨
}

// 입력값 검증 함수
function checkInput(input) {
    // 4자리 숫자인지 확인
    if (input.length !== 4) {
        return alert('4자리 숫자를 입력하세요.');
    }
    // 중복된 숫자가 있는지 확인
    if (new Set(input).size !== 4) {
        return alert('중복된 숫자를 입력했습니다.');
    }
    // 이미 시도한 값인지 확인
    if (tries.includes(input)) {
        return alert('이미 시도한 값입니다.');
    }
    return true;
}

// 소리 효과 함수들
function playSound(type) {
    // Web Audio API를 사용한 소리 생성
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'strike') {
        // 스트라이크 소리 - 높은 톤
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
    } else if (type === 'ball') {
        // 볼 소리 - 중간 톤
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.15);
    } else if (type === 'out') {
        // 아웃 소리 - 낮은 톤
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.2);
    }
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
}

// 공 던지기 애니메이션 함수들
function createPitchBall(result, delay) {
    const ball = document.createElement('div');
    ball.className = 'pitch-ball';
    
    // 결과에 따른 랜덤 위치 설정
    let targetX, targetY;
    
    if (result === 'strike') {
        // 스트라이크존 내부 랜덤 위치
        targetX = Math.random() * 100 + 10; // 10-110px 범위
        targetY = Math.random() * 150 + 15; // 15-165px 범위
        ball.style.background = 'radial-gradient(circle, #ffffff, #f0f0f0)';
    } else if (result === 'ball') {
        // 스트라이크존 주변 랜덤 위치 (볼)
        const side = Math.floor(Math.random() * 4); // 0: 위, 1: 오른쪽, 2: 아래, 3: 왼쪽
        if (side === 0) {
            targetX = Math.random() * 100 + 10;
            targetY = Math.random() * 20 - 10; // -10~10px
        } else if (side === 1) {
            targetX = Math.random() * 20 + 120; // 120-140px
            targetY = Math.random() * 150 + 15;
        } else if (side === 2) {
            targetX = Math.random() * 100 + 10;
            targetY = Math.random() * 20 + 180; // 180-200px
        } else {
            targetX = Math.random() * 20 - 10; // -10~10px
            targetY = Math.random() * 150 + 15;
        }
        ball.style.background = 'radial-gradient(circle, #ff6b6b, #ee5a24)';
    } else { // out
        // 스트라이크존에서 더 멀리 랜덤 위치
        targetX = Math.random() * 200 - 50; // -50~150px
        targetY = Math.random() * 300 - 50; // -50~250px
        ball.style.background = 'radial-gradient(circle, #666666, #444444)';
    }
    
    ball.style.left = targetX + 'px';
    ball.style.top = targetY + 'px';
    ball.style.animationDelay = delay + 's';
    
    return ball;
}

function showResult(text, isSpecial = false) {
    // 한 줄 전광판에 결과 표시
    logs.textContent = text;
    if (isSpecial) {
        logs.style.animation = 'resultPop 0.6s ease-out';
        setTimeout(() => {
            logs.style.animation = 'statusBoardGlow 2s ease-in-out infinite alternate';
        }, 600);
    }
}

function showHomerun() {
    logs.textContent = '🏟️ 홈런! 🏟️';
    logs.style.animation = 'homerun 2s ease-in-out infinite';
}

function showGameOver() {
    logs.textContent = `💀 패배! 정답은 ${answerArray.join('')} 💀`;
    logs.style.animation = 'gameOver 1s ease-in-out';
}

// 메인 게임 로직 - 폼 제출 이벤트 처리
form.addEventListener('submit', (event) => {
    event.preventDefault(); // 폼 기본 제출 동작 방지

    const value = input.value;
    input.value = ''; // 입력창 초기화

    // 입력값 검증
    const valid = checkInput(value);
    if (!valid) {
        return;
    }
    
    // 정답 확인
    if (answerArray.join('') === value) {
        showHomerun();
        return; // 게임 종료
    }

    // 게임 오버 조건 확인 (10번째 시도에서 게임 오버)
    if (tries.length >= 9) {
        showGameOver();
        return; // 게임 종료
    }

    // 스트라이크와 볼 계산
    let strike = 0;
    let ball = 0;
    let out = 0;

    for (let i = 0; i < answerArray.length; i++) {
        const index = value.indexOf(answerArray[i]);

        if (index > -1) {
            if (index === i) {
                strike += 1; // 같은 위치에 같은 숫자 = 스트라이크
            } else {
                ball += 1; // 다른 위치에 같은 숫자 = 볼
            }
        } else {
            out += 1; // 정답에 없는 숫자 = 아웃
        }
    }

    // 입력한 숫자와 결과를 전광판에 표시
    updateInputDisplay(value, strike, ball, out);

    // 각 숫자별 결과 배열 생성
    const results = [];
    for (let i = 0; i < 4; i++) {
        const inputDigit = value[i];
        const answerDigit = answerArray[i];
        
        if (inputDigit === answerDigit) {
            results.push('strike');
        } else if (answerArray.includes(inputDigit)) {
            results.push('ball');
        } else {
            results.push('out');
        }
    }

    // 결과 순서를 랜덤하게 섞기
    for (let i = results.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [results[i], results[j]] = [results[j], results[i]];
    }

    // 랜덤 순서로 공 던지기
    const strikeZone = document.querySelector('.strike-zone');
    results.forEach((result, index) => {
        setTimeout(() => {
            const ball = createPitchBall(result, 0);
            strikeZone.appendChild(ball);
            // 공 소리 (비프)
            playSound(result);
            
            // 공 제거
            setTimeout(() => {
                if (ball.parentNode) {
                    ball.remove();
                }
            }, 2000);
        }, index * 800); // 각 공 사이에 0.8초 간격
    });

    // 시도한 값 저장
    tries.push(value);

    // 전광판 업데이트
    updateScoreboard();
});

// 게임 시작 시 전광판 초기화
updateScoreboard();
showRulesOnScoreboard();
