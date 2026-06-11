import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

function App() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const res = await axios.get(`${API}/api/files`);
      setFiles(res.data);
      addLog(`Loaded ${res.data.length} files`);
    } catch (err) {
      addLog('Error loading files');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      addLog(`Uploading ${file.name}...`);
      await axios.post(`${API}/api/upload`, formData);
      addLog(`Uploaded ${file.name}`);
      setFile(null);
      loadFiles();
    } catch (err) {
      addLog('Upload failed');
    }
  };

  const handleDownload = async (filename) => {
    try {
      addLog(`Downloading ${filename}...`);
      const res = await axios.get(`${API}/api/download/${filename}`, {
        responseType: 'blob'
      });
      
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      
      addLog(`Downloaded ${filename}`);
    } catch (err) {
      addLog('Download failed');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '20px auto', padding: 20 }}>
      <h1>FTP File Manager</h1>
      
      {/* Upload Section */}
      <div style={{ margin: '20px 0', padding: 20, border: '1px solid #ddd' }}>
        <h2>Upload File</h2>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleUpload} disabled={!file} style={{ marginLeft: 10 }}>
          Upload to FTP
        </button>
      </div>

      {/* Files List */}
      <div style={{ margin: '20px 0', padding: 20, border: '1px solid #ddd' }}>
        <h2>Files on FTP Server</h2>
        <button onClick={loadFiles}>Refresh</button>
        {files.map((f, i) => (
          <div key={i} style={{ margin: 5, padding: 5, borderBottom: '1px solid #eee' }}>
            <span>{f.name}</span>
            <span style={{ marginLeft: 20 }}>{(f.size / 1024).toFixed(1)} KB</span>
            <button onClick={() => handleDownload(f.name)} style={{ marginLeft: 20 }}>Download</button>
          </div>
        ))}
      </div>

      {/* Activity Log */}
      <div style={{ margin: '20px 0', padding: 20, border: '1px solid #ddd' }}>
        <h2>Activity Log</h2>
        <div style={{ background: '#1e1e1e', color: '#0f0', padding: 10, fontFamily: 'monospace', maxHeight: 200, overflow: 'auto' }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;