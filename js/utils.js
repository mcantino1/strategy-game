export function getCoordLabel(x, y) {
    return String.fromCharCode(65 + y) + (x + 1);
}

export function getTileLabel(x, y, tile) {
    let label = `Tile ${getCoordLabel(x, y)}: `;
    label += tile.elevation === 0 ? 'Ground Level' : `Elevation ${tile.elevation}`;
    if (tile.unit) {
        label += `, ${tile.unit.type === 'enemy' ? 'Enemy' : 'Ally'}: ${tile.unit.getClassDisplay()}`;
    }
    return label;
}
