const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Frontend (React) → Backend (Node.js + basic-ftp client) → FTP Server (stilliard/pure-ftpd Docker image) # So stilliard/pure-ftpd is like installing FileZilla Server

// File upload setup
const upload = multer({ dest: 'temp/' }); // Temporary storage for uploads before FTP transfer

// FTP Configuration
const ftpConfig = {
  host: 'ftp-server', // It's the service name from docker-compose.yml # Docker DNS resolves 'ftp-server' to the container's IP automatically
  user: 'ftpuser', // Matches FTP_USER_NAME in yaml
  password: 'ftppass', // Matches FTP_USER_PASS in yaml
  secure: false // No SSL for local development
};

// FTP Helper Functions
async function connectFTP() {
  const client = new ftp.Client(); // Create new FTP client instance
  await client.access(ftpConfig); // Connect to FTP server using config
  return client;
}

// Upload file to FTP
async function uploadToFTP(localPath, remoteName) {
  const client = await connectFTP();
  try {
    logger.info(`Uploading file to FTP: ${remoteName}`);
    await client.uploadFrom(localPath, remoteName);
    logger.info(`File uploaded successfully: ${remoteName}`);
    return true;
  } catch (error) {
    logger.error(`FTP upload failed: ${error.message}`);
    throw error;
  } finally {
    client.close();
  }
}

// List FTP files
async function listFTPFiles() {
  const client = await connectFTP();
  try {
    logger.info('Listing FTP files');
    const files = await client.list();
    logger.info(`Found ${files.length} files`);
    return files.map(f => ({
      name: f.name,
      size: f.size,
      date: f.modifiedAt
    }));
  } catch (error) {
    logger.error(`FTP list failed: ${error.message}`);
    throw error;
  } finally {
    client.close();
  }
}

// Download from FTP
async function downloadFromFTP(remoteName, localPath) {
  const client = await connectFTP();
  try {
    logger.info(`Downloading from FTP: ${remoteName}`);
    await client.downloadTo(localPath, remoteName);
    logger.info(`Downloaded: ${remoteName}`);
    return true;
  } catch (error) {
    logger.error(`FTP download failed: ${error.message}`);
    throw error;
  } finally {
    client.close();
  }
}

// API Routes
app.get('/api/files', async (req, res) => {
  try {
    const files = await listFTPFiles();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    await uploadToFTP(req.file.path, req.file.originalname);
    
    // Clean temp file
    fs.unlinkSync(req.file.path);
    
    res.json({ message: 'File uploaded', filename: req.file.originalname });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/download/:filename', async (req, res) => {
  try {
    const localPath = path.join(__dirname, 'temp', req.params.filename);
    await downloadFromFTP(req.params.filename, localPath);
    
    res.download(localPath, req.params.filename, () => {
      fs.unlinkSync(localPath); // Clean after download
    });
  } catch (error) {
    res.status(500).json({ error: 'Download failed' });
  }
});

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
});