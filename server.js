const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const HOST = '0.0.0.0'
const PORT = process.env.PORT || 3000;

//setup a storage engine
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(
      null,
      file.filename + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

//initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, //limit the file size to 10 MB
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
}).single("file");

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|pdf|txt/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = filetypes.test(file.mimetype);
  console.log(file.mimetype);
  console.log(file.originalname);
  console.log(extname);
  console.log(mimeType);

  if (mimeType && extname) {
    return cb(null, true);
  } else {
    cb("Error: Files of this type are not allowed");
  }
}

//create Uploads folder if it does'nt exist
const fs = require("fs");
const dir = "./uploads";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}
// Middleware to serve static files from the 'uploads' folder
app.use('/files', express.static(path.join(__dirname, 'uploads')));

// Handle file upload
app.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.status(400).send({ message: err });
    } else {
      if (req.file === undefined) {
        res.status(400).send({ message: "No file selected" });
      } else {
        res.send({ message: 'File Uploaded successfully' ,file: req.file});
      }
    }
  });
});

// Endpoint to fetch all file paths
app.get('/list-files', (req, res) => {
  const directoryPath = path.join(__dirname, 'uploads');

  fs.readdir(directoryPath, (err, files) => {
      if (err) {
          return res.status(500).send('Unable to scan directory: ' + err);
      }

      // Map the file names to objects containing the file path
      const filePaths = files.map(file => ({ filePath: `/files/${file}` }));

      res.json(filePaths);
  });
});

// Endpoint to download a specific file
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDirectory, filename);

  // Check if the file exists before attempting to send it
  res.sendFile(filePath, (err) => {
      if (err) {
          console.error('Error occurred while sending the file:', err);
          return res.status(404).send('File not found');
      }
  });
});

// Serve the upload form 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});

app.listen(PORT, HOST, () => console.log(`Server started on http://${HOST}:${PORT}`));