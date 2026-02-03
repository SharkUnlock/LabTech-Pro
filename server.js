const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.static('public'));
app.use(express.json());

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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// NUEVO: Buscar por IMEI
app.get('/api/historial', (req, res) => {
    const { imei } = req.query;
    db.get("SELECT * FROM reparaciones WHERE imei = ?", [imei], (err, row) => {
        if (err) return res.status(500).json({ error: "Error en DB" });
        res.json(row || { error: "No encontrado" });
    });
});

app.get('/api/analizar', (req, res) => {
    const { cliente, imei, modelo, consumo } = req.query;
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const python = spawn(pythonCmd, ['diagnostico.py', modelo, consumo]);
    
    python.stdout.on('data', (data) => {
        try {
            const resultado = JSON.parse(data.toString());
            const query = `INSERT INTO reparaciones (cliente, imei, modelo, consumo, diagnostico) VALUES (?, ?, ?, ?, ?)`;
            db.run(query, [cliente, imei, modelo, consumo, resultado.diagnostico], function(err) {
                res.json({ ...resultado, db_id: this ? this.lastID : null });
            });
        } catch (e) { res.status(500).json({ error: "Error" }); }
    });
});

app.listen(3000, () => console.log("🚀 SharkUnlock v1.4 en puerto 3000"));