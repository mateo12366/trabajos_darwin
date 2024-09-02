const express = require('express');
const rutas = express.Router();

const blogs = require('../controladores/controladores.js');

rutas.get('/blog', blogs.obtenerBlogs);
rutas.get('/blog/:id', blogs.obtenerBlogsIndividual);
rutas.post('/blog', blogs.insertarblogs);
rutas.put('/blog/:id', blogs.modificarBlogs);
rutas.delete('/blog/:id', blogs.eliminarblogs);

module.exports = rutas;