const path = require('path')
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads")
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, filename)
    },
}); 

const faceFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|svg)$/)) {
        return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
}

exports.upload = multer({
    limits: { fileSize: 1024 * 1024 * 10 },
    storage: storage,
    fileFilter: faceFilter, 
}); 