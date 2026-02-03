const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.static('public'));
app.use(express.json());

// Conexión a la base de datos (se crea el archivo si no existe)
const db = new sqlite3.Database('./laboratorio.db', (err) => {
    if (err) console.error("Error al abrir DB:", err.message);
    else console.log("🛠️ Base de Datos SQLite conectada.");
});

// Creación de la tabla de historial
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

// API de Análisis y Registro
app.get('/api/analizar', (req, res) => {
    const { cliente, imei, modelo, consumo } = req.query;
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const python = spawn(pythonCmd, ['diagnostico.py', modelo, consumo]);
    
    python.stdout.on('data', (data) => {
        try {
            const resultado = JSON.parse(data.toString());
            
            // Insertar registro en el historial
            const query = `INSERT INTO reparaciones (cliente, imei, modelo, consumo, diagnostico) VALUES (?, ?, ?, ?, ?)`;
            db.run(query, [cliente, imei, modelo, consumo, resultado.diagnostico], function(err) {
                if (err) {
                    console.log("Aviso: El equipo ya estaba registrado o hubo un error duplicado.");
                }
                res.json({ ...resultado, db_id: this ? this.lastID : null });
            });
        } catch (e) {
            res.status(500).json({ error: "Fallo en la comunicación con el motor técnico" });
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 SharkUnlock LabTech Pro v1.3 listo en http://localhost:${PORT}`);
});