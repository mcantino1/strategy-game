import { getTileLabel, getCoordLabel } from './utils.js';

export class UI {
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
        this.unitDetailsEl.innerHTML = `
            <strong>${unit.getClassDisplay()}</strong><br>
            HP: ${unit.hp}/${unit.maxHp}<br>
            Move: ${unit.moveRange}, Attack: ${unit.attackRange} (${unit.getAttackType()})
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
                <li><strong>Arrow keys</strong>: Move selection or move unit</li>
                <li><strong>Tab</strong>: Cycle between units</li>
                <li><strong>A</strong>: Attack</li>
                <li><strong>W</strong>: Wait</li>
                <li><strong>Space</strong>: End turn</li>
                <li><strong>H</strong>: Toggle this help</li>
            </ul>
            <p>
                <strong>Elevation:</strong> Higher ground gives bonus damage and defense.<br>
                <strong>Warrior:</strong> Melee, high HP.<br>
                <strong>Archer:</strong> Ranged, moderate HP.<br>
                <strong>Wizard:</strong> Area magic, low HP.<br>
            </p>
            <button id="closeHelp">Close (Esc)</button>
        `;
        document.getElementById('closeHelp').onclick = () => this.toggleHelp();
    }
}
