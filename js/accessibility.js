export class AccessibilityManager {
    constructor() {
        this.statusEl = document.getElementById('gameStatus');
    }

    announce(msg) {
        this.statusEl.textContent = msg;
    }
}
