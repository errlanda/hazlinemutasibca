const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const { exec } = require("child_process");
const { WebSocketServer, WebSocket } = require("ws");
const treeKill = require("tree-kill");
const http = require("http");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

let scraperProcess = null;
let unlimitedMode = false;
let logBuffer = []; // Buffer untuk menyimpan log sementara

// Middleware untuk mengirim file statis di folder public
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// Middleware untuk mengurai body permintaan HTTP
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware untuk memeriksa status login
function checkLoggedIn(req, res, next) {
  if (scraperProcess) {
    res.redirect("/check-mutasi");
  } else {
    next();
  }
}

// Halaman login
app.get("/", checkLoggedIn, (req, res) => {
  res.sendFile(path.join(publicPath, "login.html"));
});

// Endpoint untuk pengecekan login dan memulai proses scraping
app.post("/start-scraping", (req, res) => {
  const { username, password, accountNumber, unlimited, phoneNumber } =
    req.body;
  unlimitedMode = unlimited === "true";

  console.log(`Received phoneNumber: ${phoneNumber}`); // Log the phoneNumber

  if (!scraperProcess) {
    const command = unlimitedMode
      ? `node bca.js ${username} ${password} ${accountNumber} ${phoneNumber} unlimited`
      : `node bca.js ${username} ${password} ${accountNumber} ${phoneNumber}`;
    scraperProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });

    scraperProcess.stdout.on("data", (data) => {
      logBuffer.push(data.toString());
      broadcast(data.toString());
    });

    scraperProcess.stderr.on("data", (data) => {
      logBuffer.push(`ERROR: ${data.toString()}`);
      broadcast(`ERROR: ${data.toString()}`);
    });

    scraperProcess.on("close", (code) => {
      broadcast(
        `Proses diberhentikan dengan code ${code} silahkan log out dan login kembali ..`,
      );
      scraperProcess = null;
      logBuffer = [];
    });

    res.redirect("/check-mutasi");
  } else {
    res.redirect("/check-mutasi");
  }
});

// Endpoint untuk halaman cek mutasi rekening
app.get("/check-mutasi", (req, res) => {
  res.sendFile(path.join(publicPath, "log.html"));
});

// Endpoint untuk menghentikan proses scraping
app.post("/stop", (req, res) => {
  if (scraperProcess) {
    treeKill(scraperProcess.pid, "SIGTERM", (err) => {
      if (err) {
        console.error(`Error killing process: ${err.message}`);
      }
      scraperProcess = null;
      unlimitedMode = false;
      logBuffer = [];
      res.redirect("/");
    });
  } else {
    res.redirect("/");
  }
});

// Endpoint untuk logout
app.post("/logout", (req, res) => {
  if (scraperProcess) {
    treeKill(scraperProcess.pid, "SIGTERM", (err) => {
      if (err) {
        console.error(`Error killing process: ${err.message}`);
      }
      scraperProcess = null;
    });
  }
  unlimitedMode = false;
  logBuffer = [];
  res.redirect("/");
});

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Kirim log buffer ke klien yang baru terhubung
  logBuffer.forEach((log) => {
    ws.send(log);
  });

  ws.on("message", (message) => {
    if (message === "/stop" || message === "/logout") {
      if (scraperProcess) {
        treeKill(scraperProcess.pid, "SIGTERM", (err) => {
          if (err) {
            console.error(`Error killing process: ${err.message}`);
          }
          scraperProcess = null;
          unlimitedMode = false;
        });
      }
    }
  });

  if (!scraperProcess) {
    ws.send("Tidak ada proses scraping yang berjalan.");
    ws.close();
  }
});

// Broadcast log data to all connected clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

server.listen(PORT, () => {
  console.log(`Server berjalan pada http://localhost:${PORT}`);
});
