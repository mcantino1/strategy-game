export class Unit {
    constructor(name, type, hp, moveRange, attackRange) {
        this.name = name;
        this.type = type; // 'warrior', 'archer', 'wizard', or 'enemy'
        this.hp = hp;
        this.maxHp = hp;
        this.moveRange = moveRange;
        this.attackRange = attackRange;
        this.x = null;
        this.y = null;
        this.hasActed = false;
    }

    isAlive() {
        return this.hp > 0;
    }

    getAttackType() {
        if (this.type === 'warrior') return 'melee';
        if (this.type === 'archer') return 'ranged';
        if (this.type === 'wizard') return 'magic';
        return 'melee';
    }

    getClassDisplay() {
        if (this.type === 'warrior') return 'Warrior';
        if (this.type === 'archer') return 'Archer';
        if (this.type === 'wizard') return 'Wizard';
        if (this.type === 'enemy') return this.name;
        return this.type;
    }
}
