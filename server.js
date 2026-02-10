const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon',
};

function readData() {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 4), 'utf-8');
}

function sendJSON(res, statusCode, body) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(e); }
        });
        req.on('error', reject);
    });
}

function serveStaticFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mime });
        res.end(data);
    });
}

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const method = req.method;

    // --- API Routes ---

    // GET /api/words — list all words
    if (method === 'GET' && url.pathname === '/api/words') {
        try {
            const data = readData();
            sendJSON(res, 200, data);
        } catch (e) {
            sendJSON(res, 500, { error: 'Error al leer datos' });
        }
        return;
    }

    // GET /api/words/:id — get one word
    if (method === 'GET' && url.pathname.match(/^\/api\/words\/\d+$/)) {
        const id = parseInt(url.pathname.split('/').pop());
        try {
            const data = readData();
            const word = data.find(w => w.id === id);
            if (!word) return sendJSON(res, 404, { error: 'Palabra no encontrada' });
            sendJSON(res, 200, word);
        } catch (e) {
            sendJSON(res, 500, { error: 'Error al leer datos' });
        }
        return;
    }

    // POST /api/words — create a new word
    if (method === 'POST' && url.pathname === '/api/words') {
        try {
            const body = await parseBody(req);
            const data = readData();
            const maxId = data.length > 0 ? Math.max(...data.map(w => w.id)) : 0;
            const newWord = {
                id: maxId + 1,
                Palabra: body.Palabra || '',
                Word1: body.Word1 || '',
                Word2: body.Word2 || '',
                Pronunciacion: body.Pronunciacion || '',
                Tipo: Array.isArray(body.Tipo) ? body.Tipo : (body.Tipo ? [body.Tipo] : []),
                Formalidad: body.Formalidad || 'Formal',
                Etimologia: body.Etimologia || '',
                Region: body.Region || '',
                Descripciones: Array.isArray(body.Descripciones) ? body.Descripciones : [],
                Ejemplo: body.Ejemplo || '',
                Sinonimos: Array.isArray(body.Sinonimos) ? body.Sinonimos : [],
            };
            data.push(newWord);
            writeData(data);
            sendJSON(res, 201, newWord);
        } catch (e) {
            sendJSON(res, 400, { error: 'Datos inválidos' });
        }
        return;
    }

    // PUT /api/words/:id — update a word
    if (method === 'PUT' && url.pathname.match(/^\/api\/words\/\d+$/)) {
        const id = parseInt(url.pathname.split('/').pop());
        try {
            const body = await parseBody(req);
            const data = readData();
            const index = data.findIndex(w => w.id === id);
            if (index === -1) return sendJSON(res, 404, { error: 'Palabra no encontrada' });

            const existing = data[index];
            data[index] = {
                id: existing.id,
                Palabra: body.Palabra !== undefined ? body.Palabra : existing.Palabra,
                Word1: body.Word1 !== undefined ? body.Word1 : existing.Word1,
                Word2: body.Word2 !== undefined ? body.Word2 : existing.Word2,
                Pronunciacion: body.Pronunciacion !== undefined ? body.Pronunciacion : existing.Pronunciacion,
                Tipo: body.Tipo !== undefined ? (Array.isArray(body.Tipo) ? body.Tipo : [body.Tipo]) : existing.Tipo,
                Formalidad: body.Formalidad !== undefined ? body.Formalidad : existing.Formalidad,
                Etimologia: body.Etimologia !== undefined ? body.Etimologia : existing.Etimologia,
                Region: body.Region !== undefined ? body.Region : existing.Region,
                Descripciones: body.Descripciones !== undefined ? body.Descripciones : existing.Descripciones,
                Ejemplo: body.Ejemplo !== undefined ? body.Ejemplo : existing.Ejemplo,
                Sinonimos: body.Sinonimos !== undefined ? body.Sinonimos : existing.Sinonimos,
            };
            writeData(data);
            sendJSON(res, 200, data[index]);
        } catch (e) {
            sendJSON(res, 400, { error: 'Datos inválidos' });
        }
        return;
    }

    // DELETE /api/words/:id — delete a word
    if (method === 'DELETE' && url.pathname.match(/^\/api\/words\/\d+$/)) {
        const id = parseInt(url.pathname.split('/').pop());
        try {
            const data = readData();
            const index = data.findIndex(w => w.id === id);
            if (index === -1) return sendJSON(res, 404, { error: 'Palabra no encontrada' });
            const removed = data.splice(index, 1)[0];
            writeData(data);
            sendJSON(res, 200, { message: 'Palabra eliminada', word: removed });
        } catch (e) {
            sendJSON(res, 500, { error: 'Error al eliminar' });
        }
        return;
    }

    // GET /api/stats — dictionary stats
    if (method === 'GET' && url.pathname === '/api/stats') {
        try {
            const data = readData();
            const tipos = {};
            const formalidades = {};
            let totalDescripciones = 0;
            let totalSinonimos = 0;
            let conRegion = 0;

            data.forEach(w => {
                w.Tipo.forEach(t => { tipos[t] = (tipos[t] || 0) + 1; });
                formalidades[w.Formalidad] = (formalidades[w.Formalidad] || 0) + 1;
                totalDescripciones += w.Descripciones.length;
                totalSinonimos += w.Sinonimos.length;
                if (w.Region) conRegion++;
            });

            sendJSON(res, 200, {
                totalPalabras: data.length,
                tipos,
                formalidades,
                promedioDescripciones: data.length > 0 ? (totalDescripciones / data.length).toFixed(1) : 0,
                promedioSinonimos: data.length > 0 ? (totalSinonimos / data.length).toFixed(1) : 0,
                palabrasConRegion: conRegion,
            });
        } catch (e) {
            sendJSON(res, 500, { error: 'Error al calcular estadísticas' });
        }
        return;
    }

    // --- Static files ---

    if (method === 'GET') {
        let filePath;
        if (url.pathname === '/' || url.pathname === '/index.html') {
            filePath = path.join(__dirname, 'index.html');
        } else if (url.pathname === '/admin' || url.pathname === '/admin.html') {
            filePath = path.join(__dirname, 'admin.html');
        } else {
            filePath = path.join(__dirname, url.pathname);
        }

        // Prevent directory traversal
        if (!filePath.startsWith(__dirname)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        serveStaticFile(res, filePath);
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, () => {
    console.log(`\n  TermoTech Server corriendo en:`);
    console.log(`  - Diccionario:  http://localhost:${PORT}/`);
    console.log(`  - Admin Panel:  http://localhost:${PORT}/admin`);
    console.log(`  - API:          http://localhost:${PORT}/api/words`);
    console.log(`  - Stats:        http://localhost:${PORT}/api/stats\n`);
});
