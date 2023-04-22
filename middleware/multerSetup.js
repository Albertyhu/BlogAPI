const path = require('path')
const multer = require('multer');

const storage = multer.memoryStorage()

const faceFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|png|svg)$/)) {
        return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
}

exports.upload = multer({
    limits: { fileSize: 1024 * 1024 * 10 },
    storage: storage,
    fileFilter: faceFilter, 
}); 