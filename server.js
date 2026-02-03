const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.static('public'));

const db = new sqlite3.Database('./laboratorio.db');

db.run(`CREATE TABLE IF NOT EXISTS reparaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente TEXT,
    imei TEXT UNIQUE,
    modelo TEXT,
    consumo INTEGER,
    diagnostico TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

app.get('/api/analizar', (req, res) => {
    const { cliente, imei, modelo, consumo } = req.query;
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const python = spawn(pythonCmd, ['diagnostico.py', modelo, consumo]);
    
    python.stdout.on('data', (data) => {
        const resultado = JSON.parse(data.toString());
        const query = `INSERT INTO reparaciones (cliente, imei, modelo, consumo, diagnostico) VALUES (?, ?, ?, ?, ?)`;
        
        db.run(query, [cliente, imei, modelo, consumo, resultado.diagnostico], function(err) {
            res.json({ ...resultado, db_id: this ? this.lastID : null });
        });
    });
});

app.listen(3000, () => console.log("🚀 Server v1.3 listo en http://localhost:3000"));