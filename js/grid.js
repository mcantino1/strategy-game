export class Grid {
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
                this.tiles[y][x] = {
                    elevation,
                    unit: null
                };
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
