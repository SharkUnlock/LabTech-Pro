const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Conexión Inteligente con Python
app.get('/api/analizar', (req, res) => {
    const { modelo, consumo } = req.query;
    // Detectamos si es Windows o Linux para el comando de python
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const python = spawn(pythonCmd, ['diagnostico.py', modelo, consumo]);
    
    python.stdout.on('data', (data) => {
        try {
            res.json(JSON.parse(data.toString()));
        } catch (e) {
            res.status(500).json({ error: "Error procesando datos" });
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 LabTech Pro ONLINE en puerto ${PORT}`);
});