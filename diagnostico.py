const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.static('public'));
app.use(express.json());

// Conexión y creación de Tablas (Login y Reparaciones)
const db = new sqlite3.Database('./laboratorio.db', (err) => {
    if (err) console.error("Error DB:", err.message);
    else console.log("🛠️ Base de Datos SharkUnlock Conectada.");
});

db.serialize(() => {
    // Tabla de Usuarios para el Login
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY, user TEXT, pass TEXT, role TEXT)`);
    // Tabla de Reparaciones
    db.run(`CREATE TABLE IF NOT EXISTS reparaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cliente TEXT, imei TEXT UNIQUE, modelo TEXT, consumo INTEGER, diagnostico TEXT, fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    // Usuario por defecto: admin / 1234
    db.run(`INSERT OR IGNORE INTO usuarios (id, user, pass, role) VALUES (1, 'admin', '1234', 'admin')`);
});

// --- RUTAS API ---

// Login de Usuario
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    db.get("SELECT * FROM usuarios WHERE user = ? AND pass = ?", [user, pass], (err, row) => {
        if (row) res.json({ success: true, user: row.user, role: row.role });
        else res.json({ success: false });
    });
});

// Análisis y Registro
app.get('/api/analizar', (req, res) => {
    const { cliente, imei, modelo, consumo } = req.query;
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const python = spawn(pythonCmd, ['diagnostico.py', modelo, consumo]);
    
    python.stdout.on('data', (data) => {
        try {
            const resultado = JSON.parse(data.toString());
            db.run(`INSERT INTO reparaciones (cliente, imei, modelo, consumo, diagnostico) VALUES (?,?,?,?,?)`,
                [cliente, imei, modelo, consumo, resultado.diagnostico], function(err) {
                res.json({ ...resultado, db_id: this ? this.lastID : null });
            });
        } catch (e) { res.status(500).json({ error: "Fallo en motor Python" }); }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 SharkUnlock LabTech Pro v1.5 en http://localhost:${PORT}`);
});