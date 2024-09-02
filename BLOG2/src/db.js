const mysql = require('mysql');

const mysqlconexion = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password: '',
    database : "blog"
});

mysqlconexion.connect(function (err) {
    if (err) {
        console.log(err);
        return;
    }else{
        console.log('La BD esta conectada');
    }
});

module.exports = mysqlconexion;