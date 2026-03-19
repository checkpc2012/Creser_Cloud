const fs = require('fs');

const clientes = fs.readFileSync('./data/clientes.csv', 'utf8').split('\n').slice(0, 2);
console.log("CLIENTES:", clientes);

const prestamos = fs.readFileSync('./data/prestamos.csv', 'utf8').split('\n').slice(0, 2);
console.log("PRESTAMOS:", prestamos);
