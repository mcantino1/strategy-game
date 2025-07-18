// UTILS
function getCoordLabel(x, y) {
    return String.fromCharCode(65 + y) + (x + 1);
}
function getTileLabel(x, y, tile) {
    let label = `Tile ${getCoordLabel(x, y)}: `;
    label += tile.elevation === 0 ? 'Ground Level' : `Elevation ${tile.elevation}`;
    if (tile.unit) {
        label += `, ${tile.unit.type === 'enemy' ? 'Enemy' : 'Ally'}: ${tile.unit.getClassDisplay()}`;
    }
    return label;
}

// UNIT
class Unit {
    constructor(name, type, hp, moveRange, attackRange) {
        this.name = name;
        this.type = type;
        this.hp = hp;
        this.maxHp = hp;
        this.moveRange = moveRange;
        this.attackRange = attackRange;
        this.x = null;
        this.y = null;
        this.hasActed = false;
    }
    isAlive() { return this.hp > 0; }
    getAttackType() {
        if (this.type === 'warrior') return 'melee';
        if (this.type === 'archer') return 'ranged';
        if (this.type === 'mage') return 'magic';
        return 'melee';
    }
    getClassDisplay() {
        if (this.type === 'warrior') return 'Warrior';
        if (this.type === 'archer') return 'Archer';
        if (this.type === 'mage') return 'Mage';
        if (this.type === 'enemy') return this.name;
        return this.type;
    }
}

// GRID
class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.initTiles();
    }
    initTiles() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                let elevation = 0;
                if (Math.random() < 0.1) elevation = 2;
                else if (Math.random() < 0.2) elevation = 1;
                this.tiles[y][x] = { elevation, unit: null };
            }
        }
    }
    placeUnit(unit, x, y) {
        if (unit.x !== null && unit.y !== null) {
            this.tiles[unit.y][unit.x].unit = null;
        }
        this.tiles[y][x].unit = unit;
        unit.x = x;
        unit.y = y;
    }
    moveUnit(unit, newX, newY) {
        if (this.isWithinBounds(newX, newY) && !this.tiles[newY][newX].unit) {
            this.placeUnit(unit, newX, newY);
            return true;
        }
        return false;
    }
    isWithinBounds(x, y) {
        return x >= 0 && y >= 0 && x < this.width && y < this.height;
    }
    getTile(x, y) {
        if (!this.isWithinBounds(x, y)) return null;
        return this.tiles[y][x];
    }
}

// ACCESSIBILITY
class AccessibilityManager {
    constructor() {
        this.statusEl = document.getElementById('gameStatus');
    }
    announce(msg) {
        this.statusEl.textContent = msg;
    }
}

// UI
class UI {
    constructor() {
        this.gridEl = document.getElementById('gameGrid');
        this.unitDetailsEl = document.getElementById('unitDetails');
        this.helpPanel = document.getElementById('helpPanel');
        this.helpButton = document.getElementById('helpButton');
        this.isHelpOpen = false;
    }
    renderGrid(grid, selectedX = null, selectedY = null) {
        this.gridEl.innerHTML = '';
        for (let y = 0; y < grid.height; y++) {
            const row = document.createElement('div');
            row.setAttribute('role', 'row');
            row.style.display = 'contents';
            for (let x = 0; x < grid.width; x++) {
                const tile = grid.getTile(x, y);
                const cell = document.createElement('div');
                cell.setAttribute('role', 'gridcell');
                cell.className = 'grid-cell';
                cell.tabIndex = (selectedX === x && selectedY === y) ? 0 : -1;
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.dataset.elevation = tile.elevation;
                cell.setAttribute('aria-label', getTileLabel(x, y, tile));
                if (selectedX === x && selectedY === y) {
                    cell.classList.add('selected');
                }
                cell.innerText = getCoordLabel(x, y) + '\n' + (tile.elevation > 0 ? `Elev ${tile.elevation}` : '');
                if (tile.unit) {
                    const unitDiv = document.createElement('div');
                    unitDiv.className = 'unit ' + (tile.unit.type === 'enemy' ? 'enemy-unit' : 'player-unit');
                    unitDiv.title = tile.unit.getClassDisplay();
                    unitDiv.setAttribute('aria-label', tile.unit.getClassDisplay());
                    unitDiv.innerText = tile.unit.getClassDisplay()[0];
                    cell.appendChild(unitDiv);
                }
                row.appendChild(cell);
            }
            this.gridEl.appendChild(row);
        }
    }
    renderUnitDetails(unit) {
        if (!unit) {
            this.unitDetailsEl.innerHTML = '';
            return;
        }
        let rangeText = '';
        if (unit.getAttackType() === 'melee') rangeText = 'adjacent (1 tile)';
        else if (unit.getAttackType() === 'ranged') rangeText = 'up to 3 tiles (straight lines)';
        else if (unit.getAttackType() === 'magic') rangeText = 'any enemy within 2 tiles';
        this.unitDetailsEl.innerHTML = `
            <strong>${unit.getClassDisplay()}</strong><br>
            HP: ${unit.hp}/${unit.maxHp}<br>
            Move: ${unit.moveRange}, Attack: ${unit.attackRange} (${unit.getAttackType()}, ${rangeText})
        `;
    }
    toggleHelp() {
        this.isHelpOpen = !this.isHelpOpen;
        this.helpPanel.classList.toggle('hidden', !this.isHelpOpen);
        this.helpButton.setAttribute('aria-expanded', this.isHelpOpen ? 'true' : 'false');
        if (this.isHelpOpen) {
            this.helpPanel.focus();
        }
    }
    renderHelp() {
        this.helpPanel.innerHTML = `
            <h2>Game Guide</h2>
            <ul>
                <li><strong>Arrow keys</strong>: Move the selection cursor around the grid</li>
                <li><strong>Tab</strong>: Cycle between your available units</li>
                <li><strong>D</strong>: Deploy (move) the selected unit to the currently selected tile (if in range and unoccupied)</li>
                <li><strong>A</strong>: Attack an enemy at the selected tile (if in range)</li>
                <li><strong>W</strong>: Wait (skip this unit's turn)</li>
                <li><strong>Space</strong>: End your turn</li>
                <li><strong>H</strong>: Toggle this help</li>
                <li><strong>S</strong>: Status (announce info about the current square and any unit there)</li>
                <li><strong>E</strong>: Cycle through enemy units and announce their location and health</li>
            </ul>
            <p>
                <strong>How to move:</strong> Use the arrow keys to move the blue selection box to your desired destination, then press <strong>D</strong> to deploy your active unit there (if within movement range and the tile is empty).<br>
                <strong>Attack ranges:</strong><br>
                Warrior: adjacent (1 tile).<br>
                Archer: up to 3 tiles away (straight lines).<br>
                Mage: any enemy within 2 tiles.<br>
                <strong>Elevation:</strong> Higher ground gives bonus damage and defense.<br>
                <strong>Elevation effect:</strong> Each elevation level above your target gives you +5 damage, and each elevation level below gives you -5 damage. For example, attacking from a hill (+2 elevation) to a valley (0 elevation) gives +10 damage. Attacking uphill (from 0 to 2) gives -10 damage.<br>
            </p>
            <button id="closeHelp">Close (Esc)</button>
        `;
        document.getElementById('closeHelp').onclick = () => this.toggleHelp();
    }
}

// GAME
class Game {
    constructor() {
        this.grid = new Grid(10, 10);
        this.ui = new UI();
        this.a11y = new AccessibilityManager();
        this.playerUnits = [];
        this.enemyUnits = [];
        this.currentTurn = 'player';
        this.selectedUnit = null;
        this.selectedX = 0;
        this.selectedY = 0;
        this.selectedUnitIndex = 0;
        this.awaitingAction = false;
        this.gameOver = false;
        this.hasMoved = false; // Track if the selected unit has moved this turn
        this.hasAttacked = false; // Track if the selected unit has attacked this turn
        this.enemyStatusIndex = 0; // For cycling through enemies with E
    }
    init() {
        this.createInitialUnits();
        this.setupEventListeners();
        this.ui.renderGrid(this.grid);
        this.a11y.announce('Game started. Player turn.');
        this.ui.renderHelp();
        this.selectUnit(0);
    }
    createInitialUnits() {
        this.playerUnits = [
            new Unit('Warrior', 'warrior', 100, 4, 1),
            new Unit('Archer', 'archer', 80, 3, 1),
            new Unit('Mage', 'mage', 60, 2, 2)
        ];
        this.grid.placeUnit(this.playerUnits[0], 0, 0);
        this.grid.placeUnit(this.playerUnits[1], 0, 1);
        this.grid.placeUnit(this.playerUnits[2], 0, 2);
        this.enemyUnits = [
            new Unit('Goblin', 'enemy', 50, 2, 1),
            new Unit('Orc', 'enemy', 70, 2, 1),
            new Unit('Troll', 'enemy', 90, 2, 1),
            new Unit('Imp', 'enemy', 40, 2, 1)
        ];
        this.grid.placeUnit(this.enemyUnits[0], 9, 9);
        this.grid.placeUnit(this.enemyUnits[1], 9, 8);
        this.grid.placeUnit(this.enemyUnits[2], 8, 9);
        this.grid.placeUnit(this.enemyUnits[3], 8, 8);
    }
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        document.getElementById('helpButton').addEventListener('click', () => this.ui.toggleHelp());
        document.getElementById('endTurn').addEventListener('click', () => this.endTurn());
        // Add status command listener (S key)
    }
    selectUnit(index) {
        if (this.gameOver) return;
        const aliveUnits = this.playerUnits.filter(u => u.isAlive() && !u.hasActed);
        if (aliveUnits.length === 0) {
            this.endTurn();
            return;
        }
        this.selectedUnitIndex = index % aliveUnits.length;
        this.selectedUnit = aliveUnits[this.selectedUnitIndex];
        this.selectedX = this.selectedUnit.x;
        this.selectedY = this.selectedUnit.y;
        this.awaitingAction = true;
        this.hasMoved = false;
        this.hasAttacked = false;
        this.ui.renderGrid(this.grid, this.selectedX, this.selectedY);
        this.ui.renderUnitDetails(this.selectedUnit);
        this.a11y.announce(
            `Selected ${this.selectedUnit.getClassDisplay()} at ${getCoordLabel(this.selectedX, this.selectedY)}. HP: ${this.selectedUnit.hp}`
        );
        setTimeout(() => {
            const cell = this.ui.gridEl.querySelector(`[data-x="${this.selectedX}"][data-y="${this.selectedY}"]`);
            if (cell) cell.focus();
        }, 10);
    }
    handleKeyboard(e) {
        if (this.gameOver) return;
        if (this.ui.isHelpOpen) {
            if (e.key === 'Escape' || e.key.toLowerCase() === 'h') {
                this.ui.toggleHelp();
                e.preventDefault();
            }
            return;
        }
        if (e.key.toLowerCase() === 'h') {
            this.ui.toggleHelp();
            e.preventDefault();
            return;
        }
        if (e.key.toLowerCase() === 's') {
            this.statusCommand();
            e.preventDefault();
            return;
        }
        if (e.key.toLowerCase() === 'e') {
            this.cycleEnemyStatus();
            e.preventDefault();
            return;
        }
        if (e.key.toLowerCase() === 'n' && this.gameOver) {
            this.restartGame();
            e.preventDefault();
            return;
        }
        if (!this.awaitingAction) return;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -1;
        if (e.key === 'ArrowDown') dy = 1;
        if (e.key === 'ArrowLeft') dx = -1;
        if (e.key === 'ArrowRight') dx = 1;
        if (dx !== 0 || dy !== 0) {
            let nx = this.selectedX + dx;
            let ny = this.selectedY + dy;
            if (this.grid.isWithinBounds(nx, ny)) {
                this.selectedX = nx;
                this.selectedY = ny;
                this.ui.renderGrid(this.grid, this.selectedX, this.selectedY);
                const tile = this.grid.getTile(nx, ny);
                this.a11y.announce(this.ui.gridEl.querySelector(`[data-x="${nx}"][data-y="${ny}"]`).getAttribute('aria-label'));
                setTimeout(() => {
                    const cell = this.ui.gridEl.querySelector(`[data-x="${nx}"][data-y="${ny}"]`);
                    if (cell) cell.focus();
                }, 10);
            }
            e.preventDefault();
            return;
        }
        if (e.key === 'Tab') {
            this.selectUnit(this.selectedUnitIndex + 1);
            e.preventDefault();
            return;
        }
        if (e.key.toLowerCase() === 'a') {
            this.tryAttack();
            e.preventDefault();
            return;
        }
        if (e.key.toLowerCase() === 'w') {
            this.wait();
            e.preventDefault();
            return;
        }
        if (e.key === ' ' || e.key === 'Enter') {
            this.endTurn();
            e.preventDefault();
            return;
        }
        if (e.key.toLowerCase() === 'd') {
            this.tryMove();
            e.preventDefault();
            return;
        }
    }
    statusCommand() {
        // Announce info about the current square and any unit there (with HP if present)
        const tile = this.grid.getTile(this.selectedX, this.selectedY);
        let msg = `Status for ${getCoordLabel(this.selectedX, this.selectedY)}: `;
        msg += tile.elevation === 0 ? 'Ground Level' : `Elevation ${tile.elevation}`;
        if (tile.unit) {
            msg += `, Occupied by ${tile.unit.getClassDisplay()} (HP: ${tile.unit.hp})`;
            // --- Additional info ---
            const unit = tile.unit;
            let elev1 = [], elev2 = [];
            let reachableEnemies = [];
            // Find all reachable tiles within move range
            for (let y = 0; y < this.grid.height; y++) {
                for (let x = 0; x < this.grid.width; x++) {
                    const t = this.grid.getTile(x, y);
                    if (!t.unit) {
                        const dist = Math.abs(x - unit.x) + Math.abs(y - unit.y);
                        if (dist > 0 && dist <= unit.moveRange) {
                            if (t.elevation === 1) elev1.push(getCoordLabel(x, y));
                            if (t.elevation === 2) elev2.push(getCoordLabel(x, y));
                            // Check if after moving here, can attack an enemy
                            if (unit.getAttackType() === 'melee') {
                                [[0,1],[1,0],[0,-1],[-1,0]].forEach(([dx,dy]) => {
                                    let tx = x + dx, ty = y + dy;
                                    let tt = this.grid.getTile(tx, ty);
                                    if (tt && tt.unit && tt.unit.type === 'enemy') {
                                        reachableEnemies.push({name: tt.unit.getClassDisplay(), loc: getCoordLabel(tx, ty)});
                                    }
                                });
                            } else if (unit.getAttackType() === 'ranged') {
                                for (let d = 1; d <= 3; d++) {
                                    [[d,0],[-d,0],[0,d],[0,-d]].forEach(([dx,dy]) => {
                                        let tx = x + dx, ty = y + dy;
                                        let tt = this.grid.getTile(tx, ty);
                                        if (tt && tt.unit && tt.unit.type === 'enemy') {
                                            reachableEnemies.push({name: tt.unit.getClassDisplay(), loc: getCoordLabel(tx, ty)});
                                        }
                                    });
                                }
                            } else if (unit.getAttackType() === 'magic') {
                                for (let dx = -2; dx <= 2; dx++) {
                                    for (let dy = -2; dy <= 2; dy++) {
                                        let tx = x + dx, ty = y + dy;
                                        let tt = this.grid.getTile(tx, ty);
                                        if (tt && tt.unit && tt.unit.type === 'enemy') {
                                            reachableEnemies.push({name: tt.unit.getClassDisplay(), loc: getCoordLabel(tx, ty)});
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            let elevMsg = [];
            if (elev1.length > 0) elevMsg.push(`elevation 1: ${elev1.join(', ')}`);
            if (elev2.length > 0) elevMsg.push(`elevation 2: ${elev2.join(', ')}`);
            if (elevMsg.length > 0) {
                msg += `. Reachable elevated tiles (${elev1.length + elev2.length}): ${elevMsg.join('. ')}`;
            } else {
                msg += '. No reachable elevated tiles.';
            }
            // Remove duplicate enemy locations
            const uniqueEnemies = [];
            const seen = new Set();
            for (const e of reachableEnemies) {
                const key = e.name + '@' + e.loc;
                if (!seen.has(key)) {
                    uniqueEnemies.push(e);
                    seen.add(key);
                }
            }
            if (uniqueEnemies.length > 0) {
                msg += ` You can move and attack: ` + uniqueEnemies.map(e => `${e.name} at ${e.loc}`).join(', ') + '.';
            } else {
                msg += ' No enemies are reachable for attack this turn.';
            }
        } else {
            msg += ', Unoccupied';
        }
        this.a11y.announce(msg);
    }
    cycleEnemyStatus() {
        // Cycle through alive enemies and announce their info
        const aliveEnemies = this.enemyUnits.filter(e => e.isAlive());
        if (aliveEnemies.length === 0) {
            this.a11y.announce('No enemies remain.');
            return;
        }
        if (this.enemyStatusIndex >= aliveEnemies.length) this.enemyStatusIndex = 0;
        const enemy = aliveEnemies[this.enemyStatusIndex];
        this.a11y.announce(`${enemy.getClassDisplay()} at ${getCoordLabel(enemy.x, enemy.y)}. HP: ${enemy.hp}`);
        this.enemyStatusIndex++;
    }
    tryMove() {
        if (this.gameOver) return;
        const unit = this.selectedUnit;
        if (this.hasMoved) {
            this.a11y.announce('You have already moved this turn.');
            return;
        }
        const dist = Math.abs(this.selectedX - unit.x) + Math.abs(this.selectedY - unit.y);
        if (dist > unit.moveRange) {
            this.a11y.announce('Out of movement range.');
            return;
        }
        const tile = this.grid.getTile(this.selectedX, this.selectedY);
        if (tile.unit) {
            this.a11y.announce('Tile occupied.');
            return;
        }
        this.grid.moveUnit(unit, this.selectedX, this.selectedY);
        this.ui.renderGrid(this.grid, this.selectedX, this.selectedY);
        this.a11y.announce(`${unit.getClassDisplay()} moved to ${getCoordLabel(this.selectedX, this.selectedY)}. You may now attack or wait.`);
        this.hasMoved = true;
        // Do not end the unit's turn yet; allow attack or wait
    }
    tryAttack() {
        if (this.gameOver) return;
        if (this.hasAttacked) {
            this.a11y.announce('You have already attacked this turn.');
            return;
        }
        const unit = this.selectedUnit;
        const targets = this.getAttackTargets(unit);
        const target = targets.find(u => u.x === this.selectedX && u.y === this.selectedY);
        let rangeText = '';
        if (unit.getAttackType() === 'melee') rangeText = 'adjacent (1 tile)';
        else if (unit.getAttackType() === 'ranged') rangeText = 'up to 3 tiles (straight lines)';
        else if (unit.getAttackType() === 'magic') rangeText = 'any enemy within 2 tiles';
        if (!target) {
            this.a11y.announce(`No valid target at this tile. Your attack range is: ${rangeText}.`);
            return;
        }
        const damage = this.calculateDamage(unit, target);
        target.hp -= damage;
        this.a11y.announce(`${unit.getClassDisplay()} attacked ${target.getClassDisplay()} for ${damage} damage. ${target.getClassDisplay()} has ${Math.max(0, target.hp)} HP left. (Range: ${rangeText})`);
        if (target.hp <= 0) {
            this.grid.getTile(target.x, target.y).unit = null;
            this.a11y.announce(`${target.getClassDisplay()} defeated!`);
        }
        this.hasAttacked = true;
        this.ui.renderGrid(this.grid, this.selectedX, this.selectedY);
        this.checkVictory();
        // Player must press W (wait) or Space/Enter (end turn) to finish this unit's turn.
    }
    getAttackTargets(unit) {
        let targets = [];
        if (unit.getAttackType() === 'melee') {
            [[0,1],[1,0],[0,-1],[-1,0]].forEach(([dx,dy]) => {
                let tx = unit.x + dx, ty = unit.y + dy;
                let tile = this.grid.getTile(tx, ty);
                if (tile && tile.unit && tile.unit.type === 'enemy') targets.push(tile.unit);
            });
        } else if (unit.getAttackType() === 'ranged') {
            for (let d = 1; d <= 3; d++) {
                [[d,0],[-d,0],[0,d],[0,-d]].forEach(([dx,dy]) => {
                    let tx = unit.x + dx, ty = unit.y + dy;
                    let tile = this.grid.getTile(tx, ty);
                    if (tile && tile.unit && tile.unit.type === 'enemy') targets.push(tile.unit);
                });
            }
        } else if (unit.getAttackType() === 'magic') {
            for (let dx = -2; dx <= 2; dx++) {
                for (let dy = -2; dy <= 2; dy++) {
                    let tx = unit.x + dx, ty = unit.y + dy;
                    let tile = this.grid.getTile(tx, ty);
                    if (tile && tile.unit && tile.unit.type === 'enemy') targets.push(tile.unit);
                }
            }
        }
        return targets;
    }
    calculateDamage(attacker, defender) {
        let base = 20;
        if (attacker.getAttackType() === 'melee') base = 25;
        if (attacker.getAttackType() === 'ranged') base = 18;
        if (attacker.getAttackType() === 'magic') base = 15;
        const attElev = this.grid.getTile(attacker.x, attacker.y).elevation;
        const defElev = this.grid.getTile(defender.x, defender.y).elevation;
        let bonus = (attElev - defElev) * 5;
        return Math.max(1, base + bonus);
    }
    wait() {
        if (this.gameOver) return;
        this.selectedUnit.hasActed = true;
        this.hasMoved = false;
        this.hasAttacked = false;
        this.a11y.announce(`${this.selectedUnit.getClassDisplay()} waits.`);
        this.selectUnit(this.selectedUnitIndex + 1);
    }
    endTurn() {
        if (this.gameOver) return;
        this.playerUnits.forEach(u => u.hasActed = false);
        this.a11y.announce('Enemy turn.');
        this.awaitingAction = false;
        setTimeout(() => this.enemyTurn(), 800);
    }
    enemyTurn() {
        if (this.gameOver) return;
        const aliveEnemies = this.enemyUnits.filter(e => e.isAlive());
        let moveMessages = [];
        let movedEnemies = new Set();
        // Move all enemies up to their moveRange (minimum 2 tiles)
        for (let enemy of aliveEnemies) {
            let target = this.findNearestPlayer(enemy);
            if (!target) continue;
            let steps = Math.max(2, enemy.moveRange);
            let ex = enemy.x, ey = enemy.y;
            for (let s = 0; s < steps; s++) {
                // If already adjacent to a player, stop moving to attack
                if (Math.abs(target.x - ex) + Math.abs(target.y - ey) === 1) break;
                let dx = Math.sign(target.x - ex);
                let dy = Math.sign(target.y - ey);
                let nx = ex + dx, ny = ey + dy;
                // Prefer moving closer to the player, not away
                if (this.grid.isWithinBounds(nx, ny) && !this.grid.getTile(nx, ny).unit) {
                    ex = nx; ey = ny;
                } else {
                    // Try alternate directions if blocked, but only if it doesn't increase distance
                    let moved = false;
                    let options = [[dx,0],[0,dy],[-dx,0],[0,-dy]];
                    for (let [adx, ady] of options) {
                        let ax = ex + adx, ay = ey + ady;
                        let newDist = Math.abs(target.x - ax) + Math.abs(target.y - ay);
                        if (this.grid.isWithinBounds(ax, ay) && !this.grid.getTile(ax, ay).unit && newDist < Math.abs(target.x - ex) + Math.abs(target.y - ey)) {
                            ex = ax; ey = ay;
                            moved = true;
                            break;
                        }
                    }
                    if (!moved) break;
                }
            }
            if (ex !== enemy.x || ey !== enemy.y) {
                this.grid.moveUnit(enemy, ex, ey);
                moveMessages.push(`${enemy.getClassDisplay()} moved to ${getCoordLabel(ex, ey)}.`);
                movedEnemies.add(enemy);
            }
        }
        // Update the board visually after all moves
        this.ui.renderGrid(this.grid, this.selectedX, this.selectedY);
        // Now, process attacks and announce moves/attacks
        let messages = [];
        for (let enemy of aliveEnemies) {
            if (movedEnemies.has(enemy)) {
                messages.push(`${enemy.getClassDisplay()} moved to ${getCoordLabel(enemy.x, enemy.y)}.`);
            }
            let target = this.findNearestPlayer(enemy);
            if (target && Math.abs(target.x - enemy.x) + Math.abs(target.y - enemy.y) === 1) {
                target.hp -= 12;
                messages.push(`${enemy.getClassDisplay()} attacks ${target.getClassDisplay()} for 12 damage. ${target.getClassDisplay()} has ${Math.max(0, target.hp)} HP left.`);
                if (target.hp <= 0) {
                    this.grid.getTile(target.x, target.y).unit = null;
                    messages.push(`${target.getClassDisplay()} defeated!`);
                }
            }
        }
        if (messages.length > 0) {
            let i = 0;
            const announceNext = () => {
                if (i < messages.length) {
                    this.a11y.announce(messages[i]);
                    i++;
                    setTimeout(announceNext, 900);
                } else {
                    this.checkVictory();
                    if (this.gameOver) return;
                    setTimeout(() => {
                        this.a11y.announce('Player turn.');
                        this.selectUnit(0);
                        this.awaitingAction = true;
                    }, 800);
                }
            };
            announceNext();
        } else {
            this.checkVictory();
            if (this.gameOver) return;
            setTimeout(() => {
                this.a11y.announce('Player turn.');
                this.selectUnit(0);
                this.awaitingAction = true;
            }, 800);
        }
    }
    findNearestPlayer(enemy) {
        let minDist = Infinity, nearest = null;
        for (let unit of this.playerUnits.filter(u => u.isAlive())) {
            let dist = Math.abs(unit.x - enemy.x) + Math.abs(unit.y - enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = unit;
            } else if (dist === minDist && nearest) {
                // If two units are equally close, pick the one with the lowest HP
                if (unit.hp < nearest.hp) {
                    nearest = unit;
                }
            }
        }
        return nearest;
    }
    checkVictory() {
        const allEnemiesDefeated = this.enemyUnits.every(e => !e.isAlive());
        const allPlayersDefeated = this.playerUnits.every(u => !u.isAlive());
        if (allEnemiesDefeated) {
            this.gameOver = true;
            this.a11y.announce('Victory! All enemies defeated. Press Enter to start a new game.');
            setTimeout(() => {
                if (confirm('Victory! All enemies defeated.\n\nPress OK or Enter to start a new game.')) {
                    this.restartGame();
                }
            }, 100);
        } else if (allPlayersDefeated) {
            this.gameOver = true;
            this.a11y.announce('Defeat! All your units have fallen. Press Enter to start a new game.');
            setTimeout(() => {
                if (confirm('Defeat! All your units have fallen.\n\nPress OK or Enter to start a new game.')) {
                    this.restartGame();
                }
            }, 100);
        }
    }
    restartGame() {
        // Reset all game state and start a new game
        this.grid = new Grid(10, 10);
        this.playerUnits = [];
        this.enemyUnits = [];
        this.currentTurn = 'player';
        this.selectedUnit = null;
        this.selectedX = 0;
        this.selectedY = 0;
        this.selectedUnitIndex = 0;
        this.awaitingAction = false;
        this.gameOver = false;
        this.hasMoved = false;
        this.hasAttacked = false;
        this.enemyStatusIndex = 0;
        this.ui.renderGrid(this.grid);
        this.ui.renderUnitDetails(null);
        this.ui.renderHelp();
        this.init();
    }
}

window.onload = function() {
    window.game = new Game();
    game.init();
};
