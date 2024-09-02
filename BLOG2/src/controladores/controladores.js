const {query} = require('express');
const conexion = require('../db.js');


const obtenerBlogs = (req, res) => {
    conexion.query(`
        SELECT
        blogs.id,
        blogs.titulo,
        blogs.contenido,
        blogs.categoria,
        blogs.fecha_creacion,
        blogs.fecha_actualizacion,
        GROUP_CONCAT(etiqueta.nombre) AS etiquetas
        FROM blogs
        LEFT JOIN etiqueta ON blogs.id = etiqueta.blog_id
        GROUP BY blogs.id
        `, (err, resultado) => {
            if (err) {
                console.error("Error al obtener los blogs:", err);
                return res.status(500).send('Error al obtener los blogs');
            }

            if (resultado.length === 0) {
                return res.status(400).send('No se encontraron blogs');
            }

            const blogsEtiquetas =resultado.map((blog) => ({
                id: blog.id,
                titulo: blog.titulo,
                contenido: blog.contenido,
                categoria: blog.categoria,
                etiquetas: blog.etiquetas ? blog.etiquetas.split(",") : [],
                fecha_creacion: blog.fecha_creacion,
                fecha_actualizacion: blog.fecha_actualizacion,
            }));

        res.json(blogsEtiquetas);
    });
};

const obtenerBlogsIndividual = (req,res) =>{
    const {id} = req.params;
    conexion.query('SELECT * FROM etiqueta WHERE blog_id = ?', [id], (err, resultado) => {
        const etiquetasRes = resultado.map((etiqueta) => etiqueta.nombre);
        conexion.query('SELECT * FROM blogs WHERE id = ?', [id], (err, resultado) => {
            if (resultado.length === 0) {
                return res.status(400).send('Blog no encontrado');
            }

            const blog = resultado [0];
            res.status(200).json({
                id: blog.id,
                titulo: blog.titulo,
                contenido: blog.contenido,
                categoria: blog.categoria,
                etiquetas: etiquetasRes,
                fecha_creacion: blog.fecha_creacion,
                fecha_actualizacion: blog.fecha_actualizacion,
            });
        });
    });
};

const insertarblogs = (req, res) => {
    const {titulo, contenido, categoria, etiquetas} = req.body;
    conexion.query('INSERT INTO blogs(titulo, contenido, categoria) VALUES (?, ?, ?)', [titulo, contenido, categoria], (err, resultado) => {
        const blogId = resultado.insertId;
        if (!err) {
            if (etiquetas && etiquetas.length > 0) {
                const insertarEtiquetas = etiquetas.map((etiquetas) => [etiquetas, resultado.insertId]);
                conexion.query('INSERT INTO etiqueta(nombre, blog_id) VALUES ?', [insertarEtiquetas], (err, resultado) => {
                    if (err) {
                        return res.status(500).send('Error al insertar etiqueta');
                    }else{
                        res.status(201).json({
                            id: blogId,
                            titulo,
                            contenido,
                            categoria,
                            etiquetas,
                            fecha_creacion: new Date().toISOString(),
                            fecha_actualizacion: new Date().toISOString(),
                        });
                    }
                });
            }else{
                res.status(201).json({
                    id: blogId,
                    titulo,
                    contenido,
                    categoria,
                    fecha_creacion: new Date().toISOString(),
                    fecha_actualizacion: new Date().toISOString(),
                });
            }
        }else{
            res.status(400).send('Todos los campos son requeridos');
        }
    });
};

const modificarBlogs = (req, res) => {
    const { id } = req.params;
    const { titulo, contenido, categoria, etiquetas } = req.body;
  
    let actualizar = [];
    let campos = [];
  
    if (titulo) {
      actualizar.push("titulo = ?");
      campos.push(titulo);
    }
  
    if (contenido) {
      actualizar.push("contenido = ?");
      campos.push(contenido);
    }
  
    if (categoria) {
      actualizar.push("categoria = ?");
      campos.push(categoria);
    }
  
    if (actualizar.length > 0) {
      const query = `UPDATE blogs SET ${actualizar.join(", ")} WHERE id = ?`;
      campos.push(id);
  
      conexion.query(query, campos, (err, resultado) => {
        if (err) {
          return res.status(400).send(`Error en la actualización del blog: ${err.message}`);
        }
        if (resultado.affectedRows === 0) {
          return res.status(404).send("Blog no encontrado");
        }
  
        if (etiquetas && etiquetas.length > 0) {
          conexion.query("DELETE FROM etiqueta WHERE blog_id = ?", [id], (err) => {
            if (err) {
              return res.status(400).send(`Error al eliminar etiquetas: ${err.message}`); 
            }
            const etiquetasArray = etiquetas.map((etiqueta) => [etiqueta, id]); 
            conexion.query("INSERT INTO etiqueta (nombre, blog_id) VALUES ?", [etiquetasArray], (err) => {
              if (err) {
                return res.status(400).send(`Error al insertar etiquetas: ${err.message}`);
              }
              finalizarActualizacionBlog(id, res);
            });
          });
        } else {
          finalizarActualizacionBlog(id, res);
        }
      });
    } else {
      if (etiquetas && etiquetas.length > 0) {
        conexion.query("DELETE FROM etiqueta WHERE blog_id = ?", [id], (err) => {
          if (err) {
            return res.status(400).send(`Error al eliminar etiquetas: ${err.message}`);
          }
          const etiquetasArray = etiquetas.map((etiqueta) => [etiqueta, id]);
          conexion.query("INSERT INTO etiqueta (nombre, blog_id) VALUES ?", [etiquetasArray], (err) => {
            if (err) {
              return res.status(400).send(`Error al insertar etiquetas: ${err.message}`);
            }
            finalizarActualizacionBlog(id, res);
          });
        });
      } else {
        res.status(400).send("No se proporcionó ninguna información para actualizar.");
      }
    }
  };

const finalizarActualizacionBlog = (id, res) => {
    conexion.query("SELECT * FROM etiqueta WHERE blog_id = ?",[id],(err, resultado) => {
        const etiquetares = resultado.map((etiqueta) => etiqueta.nombre);
        conexion.query("SELECT * FROM blogs WHERE id = ?",[id],(err, rows, fields) => {
            if (rows.length === 0) {
              return res.status(404).json({ error: "Blog no encontrado" });
            }
            const blog = rows[0];
            res.status(200).json({
              id: blog.id,
              titulo: blog.titulo,
              contenido: blog.contenido,
              categoria: blog.categoria,
              etiquetas: etiquetares,
              fecha_creacion: blog.fecha_creacion,
              fecha_actualizacion: blog.fecha_actualizacion,
            });
        });
    });
};

const eliminarblogs = (req, res) => {
    const { id } = req.params;
    conexion.query("DELETE  FROM blogs WHERE id = ?",[id],(err, fila, fields) => {
        if (fila.affectedRows === 0) {
          res.status(404).send("Blog no encontrado");
        } else {
          if (!err) {
            console.log('blog eliminado');
            res.sendStatus(204);
          } else {
            res.status(400).send(err);
          }
        }
    });
  };
  


module.exports = {
    obtenerBlogs,
    obtenerBlogsIndividual,
    insertarblogs,
    modificarBlogs,
    eliminarblogs
};