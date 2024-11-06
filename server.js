const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();
const HOST = '0.0.0.0'
const PORT = process.env.PORT || 3000;

// Configure multer storage with a unique filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify your upload directory
  },
  filename: (req, file, cb) => {
    // Generate a unique ID for the filename
    const uniqueId = crypto.randomUUID(); // Or use `crypto.randomBytes(16).toString('hex')` for shorter ID
    const fileExtension = path.extname(file.originalname);
    cb(null, `${uniqueId}${fileExtension}`);
  }
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
        res.send({
          message: 'File uploaded successfully',
          file: {
            originalName: req.file.originalname,
            uniqueName: req.file.filename,
            path: req.file.path
          }
        });
      }
    }
  });
});

// Endpoint to retrieve the list of uploaded files
app.get('/list-files', (req, res) => {
  fs.readdir(dir, (err, files) => {
    if (err) {
      return res.status(500).send({ message: 'Error reading upload directory' });
    }

    // Map the files to an array with filename and unique ID
    const fileList = files.map(file => {
      const uniqueId = path.basename(file, path.extname(file)); // Extract UUID from filename
      return {
        uniqueId: uniqueId,
        filename: file
      };
    });

    res.send({ files: fileList });
  });
});


// Endpoint to download a specific file by UUID
app.get('/download/:uuid', (req, res) => {
  const uuid = req.params.uuid; // Get the UUID from the request
  let fileFound = false;

  // Read the directory to find the file with the matching UUID
  fs.readdir(dir, (err, files) => {
    if (err) {
      return res.status(500).send({ message: 'Error reading upload directory' });
    }

    // Find the file that matches the UUID (considering the file extension)
    const file = files.find(file => path.basename(file, path.extname(file)) === uuid);

    if (file) {
      fileFound = true;
      const filePath = path.join(dir, file);

      // Send the file to the client
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error('Error occurred while sending the file:', err);
          return res.status(404).send('File not found');
        }
      });
    }

    // If no file is found, return an error response
    if (!fileFound) {
      return res.status(404).send('File not found for the provided UUID');
    }
  });
});

// Serve the upload form 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'index.html'));
});

app.listen(PORT, HOST, () => console.log(`Server started on http://${HOST}:${PORT}`));