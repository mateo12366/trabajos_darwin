const express = require('express');
const app = express();

app.listen(3000);

app.use(express.json());

app.use(require("./rutas/rutas.js"));