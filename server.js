const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const HOST = '192.168.6.85'
const PORT = 3000;

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

// Serve the upload form 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});

app.listen(PORT, HOST, () => console.log(`Server started on http://${HOST}:${PORT}`));