console.log("A");

setTimeout(() => console.log("D"), 0);

Promise.resolve().then(() => console.log("C"));

console.log("B");

// Дополнительный эксперимент (как требует методичка)
Promise.resolve().then(() => console.log("E"));

setTimeout(() => console.log("F"), 0);
