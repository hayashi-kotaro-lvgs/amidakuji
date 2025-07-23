class AmidaGame {
    constructor() {
        this.participants = [];
        this.maxParticipants = 50;
        this.winnerCount = 8;
        this.canvas = null;
        this.ctx = null;
        this.amidaStructure = null;
        this.isAnimating = false;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.participantNameInput = document.getElementById('participant-name');
        this.addParticipantBtn = document.getElementById('add-participant');
        this.participantsDisplay = document.getElementById('participants-display');
        this.participantCount = document.getElementById('participant-count');
        this.clearAllBtn = document.getElementById('clear-all');
        this.startAmidaBtn = document.getElementById('start-amida');
        this.resetAmidaBtn = document.getElementById('reset-amida');
        this.canvas = document.getElementById('amida-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.participantTokens = document.getElementById('participant-tokens');
        this.results = document.getElementById('results');
        this.winnersList = document.getElementById('winners-list');
        this.losersList = document.getElementById('losers-list');
    }

    attachEventListeners() {
        this.addParticipantBtn.addEventListener('click', () => this.addParticipant());
        this.participantNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addParticipant();
        });
        this.clearAllBtn.addEventListener('click', () => this.clearAllParticipants());
        this.startAmidaBtn.addEventListener('click', () => this.startAmida());
        this.resetAmidaBtn.addEventListener('click', () => this.resetAmida());
    }

    addParticipant() {
        const name = this.participantNameInput.value.trim();
        
        if (!name) {
            alert('参加者の名前を入力してください。');
            return;
        }

        if (this.participants.includes(name)) {
            alert('その名前は既に登録されています。');
            return;
        }

        if (this.participants.length >= this.maxParticipants) {
            alert(`参加者は最大${this.maxParticipants}人までです。`);
            return;
        }

        this.participants.push(name);
        this.participantNameInput.value = '';
        this.updateParticipantsDisplay();
        this.updateControls();
    }

    removeParticipant(name) {
        this.participants = this.participants.filter(p => p !== name);
        this.updateParticipantsDisplay();
        this.updateControls();
    }

    clearAllParticipants() {
        if (this.participants.length === 0) return;
        
        if (confirm('全ての参加者を削除しますか？')) {
            this.participants = [];
            this.updateParticipantsDisplay();
            this.updateControls();
        }
    }

    updateParticipantsDisplay() {
        this.participantCount.textContent = this.participants.length;
        
        if (this.participants.length === 0) {
            this.participantsDisplay.innerHTML = '<div class="empty-message">参加者が登録されていません</div>';
        } else {
            this.participantsDisplay.innerHTML = this.participants
                .map(name => `
                    <div class="participant-tag">
                        ${name}
                        <button class="remove-participant" onclick="game.removeParticipant('${name}')">×</button>
                    </div>
                `).join('');
        }

        // 最大人数に達したら追加ボタンを無効化
        this.addParticipantBtn.disabled = this.participants.length >= this.maxParticipants;
    }

    updateControls() {
        // 最低2人必要
        this.startAmidaBtn.disabled = this.participants.length < 2 || this.isAnimating;
    }

    generateAmidaStructure() {
        const participantCount = this.participants.length;
        if (participantCount < 2) return null;

        const structure = {
            participants: [...this.participants],
            lines: [],
            horizontalLines: [],
            winnerPositions: []
        };

        // ランダムに当選位置を決定
        const actualWinnerCount = Math.min(this.winnerCount, participantCount);
        const allPositions = Array.from({length: participantCount}, (_, i) => i);
        
        // Fisher-Yates シャッフルアルゴリズムでランダムに当選位置を選択
        for (let i = allPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPositions[i], allPositions[j]] = [allPositions[j], allPositions[i]];
        }
        
        structure.winnerPositions = allPositions.slice(0, actualWinnerCount).sort((a, b) => a - b);

        // 縦線の本数は参加者数
        const verticalLines = participantCount;
        
        // 横線をランダムに生成（各縦線間に0-3本の横線）
        const levels = 8; // 横線のレベル数
        
        for (let level = 0; level < levels; level++) {
            for (let i = 0; i < verticalLines - 1; i++) {
                // 30%の確率で横線を追加
                if (Math.random() < 0.3) {
                    structure.horizontalLines.push({
                        level: level,
                        fromLine: i,
                        toLine: i + 1
                    });
                }
            }
        }

        return structure;
    }

    drawAmida() {
        const structure = this.amidaStructure;
        if (!structure) return;

        const participantCount = structure.participants.length;
        const canvasWidth = Math.max(600, participantCount * 80);
        const canvasHeight = 500;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';

        const ctx = this.ctx;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const marginX = 50;
        const marginY = 80;
        const lineSpacing = (canvasWidth - 2 * marginX) / (participantCount - 1);
        const verticalLineHeight = canvasHeight - 2 * marginY;
        const levelHeight = verticalLineHeight / 8;

        // 縦線を描画
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        
        for (let i = 0; i < participantCount; i++) {
            const x = marginX + i * lineSpacing;
            ctx.beginPath();
            ctx.moveTo(x, marginY);
            ctx.lineTo(x, marginY + verticalLineHeight);
            ctx.stroke();

            // 参加者名を上部に表示
            ctx.fillStyle = '#333';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(structure.participants[i], x, marginY - 20);

            // 結果エリア（下部）
            const isWinnerPosition = structure.winnerPositions.includes(i);
            ctx.fillStyle = isWinnerPosition ? '#ffd700' : '#ccc';
            ctx.fillRect(x - 20, marginY + verticalLineHeight + 10, 40, 30);
            ctx.fillStyle = '#333';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(isWinnerPosition ? '当選' : '残念', x, marginY + verticalLineHeight + 30);
        }

        // 横線を描画
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 4;
        
        structure.horizontalLines.forEach(hLine => {
            const fromX = marginX + hLine.fromLine * lineSpacing;
            const toX = marginX + hLine.toLine * lineSpacing;
            const y = marginY + (hLine.level + 1) * levelHeight;
            
            ctx.beginPath();
            ctx.moveTo(fromX, y);
            ctx.lineTo(toX, y);
            ctx.stroke();
        });

        // トークンを初期位置に配置
        this.createParticipantTokens();
    }

    createParticipantTokens() {
        this.participantTokens.innerHTML = '';
        const participantCount = this.participants.length;
        const canvasWidth = this.canvas.width;
        const marginX = 50;
        const lineSpacing = (canvasWidth - 2 * marginX) / (participantCount - 1);

        this.participants.forEach((name, index) => {
            const token = document.createElement('div');
            token.className = 'participant-token';
            token.textContent = name;
            token.style.left = (marginX + index * lineSpacing) + 'px';
            token.style.top = '50px';
            token.dataset.currentLine = index;
            this.participantTokens.appendChild(token);
        });
    }

    async startAmida() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.startAmidaBtn.disabled = true;
        this.results.style.display = 'none';

        // あみだくじ構造を生成
        this.amidaStructure = this.generateAmidaStructure();
        
        if (!this.amidaStructure) {
            alert('参加者が不足しています。');
            this.isAnimating = false;
            this.updateControls();
            return;
        }

        // あみだくじを描画
        this.drawAmida();

        // アニメーション開始
        await this.animateTokens();
        
        this.isAnimating = false;
        this.updateControls();
        this.showResults();
    }

    async animateTokens() {
        const tokens = this.participantTokens.querySelectorAll('.participant-token');
        const participantCount = this.participants.length;
        const canvasWidth = this.canvas.width;
        const marginX = 50;
        const marginY = 80;
        const lineSpacing = (canvasWidth - 2 * marginX) / (participantCount - 1);
        const verticalLineHeight = this.canvas.height - 2 * marginY;
        const levelHeight = verticalLineHeight / 8;

        // 各トークンの現在位置を追跡
        const tokenPositions = this.participants.map((_, index) => ({
            line: index,
            level: 0
        }));

        // レベルごとにアニメーション
        for (let level = 0; level < 8; level++) {
            // 現在のレベルの横線をチェック
            const currentLevelLines = this.amidaStructure.horizontalLines.filter(hLine => hLine.level === level);
            
            // トークンを下に移動
            await this.moveTokensDown(tokens, tokenPositions, level, marginX, marginY, lineSpacing, levelHeight);
            
            // 横線があれば横移動
            if (currentLevelLines.length > 0) {
                await this.moveTokensHorizontally(tokens, tokenPositions, currentLevelLines, marginX, marginY, lineSpacing, levelHeight, level);
            }
            
            await this.delay(300);
        }

        // 最終位置まで移動
        await this.moveTokensToFinal(tokens, tokenPositions, marginX, marginY, lineSpacing, verticalLineHeight);
    }

    async moveTokensDown(tokens, positions, level, marginX, marginY, lineSpacing, levelHeight) {
        const targetY = marginY + (level + 1) * levelHeight;
        
        tokens.forEach((token, index) => {
            token.style.top = targetY + 'px';
        });
        
        await this.delay(500);
    }

    async moveTokensHorizontally(tokens, positions, horizontalLines, marginX, marginY, lineSpacing, levelHeight, level) {
        // どのトークンが移動するかを決定
        const moves = new Map();
        
        horizontalLines.forEach(hLine => {
            // fromLine にいるトークンを探す
            const fromTokenIndex = positions.findIndex(pos => pos.line === hLine.fromLine);
            // toLine にいるトークンを探す
            const toTokenIndex = positions.findIndex(pos => pos.line === hLine.toLine);
            
            if (fromTokenIndex !== -1 && toTokenIndex !== -1) {
                // トークンの位置を交換
                moves.set(fromTokenIndex, hLine.toLine);
                moves.set(toTokenIndex, hLine.fromLine);
                positions[fromTokenIndex].line = hLine.toLine;
                positions[toTokenIndex].line = hLine.fromLine;
            }
        });

        // アニメーション実行
        moves.forEach((newLine, tokenIndex) => {
            const token = tokens[tokenIndex];
            const newX = marginX + newLine * lineSpacing;
            token.style.left = newX + 'px';
        });

        await this.delay(800);
    }

    async moveTokensToFinal(tokens, positions, marginX, marginY, lineSpacing, verticalLineHeight) {
        const finalY = marginY + verticalLineHeight + 50;
        
        tokens.forEach((token, index) => {
            const finalX = marginX + positions[index].line * lineSpacing;
            token.style.left = finalX + 'px';
            token.style.top = finalY + 'px';
            
            // ランダムな当選位置に基づいて色を変更
            const isWinner = this.amidaStructure.winnerPositions.includes(positions[index].line);
            if (isWinner) {
                token.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
                token.style.color = '#333';
            }
        });

        await this.delay(1000);
    }

    showResults() {
        const tokens = this.participantTokens.querySelectorAll('.participant-token');
        const winners = [];
        const losers = [];

        tokens.forEach(token => {
            const currentLeft = parseInt(token.style.left);
            const participantCount = this.participants.length;
            const canvasWidth = this.canvas.width;
            const marginX = 50;
            const lineSpacing = (canvasWidth - 2 * marginX) / (participantCount - 1);
            
            // 現在の位置から最終的なライン番号を計算
            const finalLine = Math.round((currentLeft - marginX) / lineSpacing);
            
            // ランダムな当選位置に基づいて判定
            if (this.amidaStructure.winnerPositions.includes(finalLine)) {
                winners.push(token.textContent);
            } else {
                losers.push(token.textContent);
            }
        });

        // 結果を表示
        this.winnersList.innerHTML = winners.map(name => 
            `<div class="winner-tag">${name}</div>`
        ).join('');

        this.losersList.innerHTML = losers.map(name => 
            `<div class="loser-tag">${name}</div>`
        ).join('');

        this.results.style.display = 'block';
    }

    resetAmida() {
        this.isAnimating = false;
        this.participantTokens.innerHTML = '';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.results.style.display = 'none';
        this.amidaStructure = null;
        this.updateControls();
        
        // キャンバスサイズをリセット
        this.canvas.width = 600;
        this.canvas.height = 400;
        this.canvas.style.width = '600px';
        this.canvas.style.height = '400px';
        
        // 初期メッセージを表示
        this.ctx.fillStyle = '#999';
        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('参加者を登録してスタートボタンを押してください', this.canvas.width / 2, this.canvas.height / 2);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ゲームを初期化
const game = new AmidaGame();

// 初期状態でキャンバスにメッセージを表示
game.resetAmida();
