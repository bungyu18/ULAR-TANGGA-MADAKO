import { Dice, rollQuick } from './dice.js';

// Dadu standar 6 sisi
const d6 = new Dice(6);
console.log(d6.roll());

// Dadu 8 sisi
const d8 = new Dice(8);
console.log(d8.roll());

// Dadu custom (misal wajahnya [1,2,3,4,5,8])
const customDice = new Dice([1, 2, 3, 4, 5, 8]);
console.log(customDice.roll());

// Roll cepat sekali pakai
console.log(rollQuick(6));
