const fs = require('fs'); 
const path = require('path'); 

const dataHooks = () => {
    const BufferImage = (File) => {
        return {
            data: fs.readFileSync(path.join(__dirname, '../public/uploads/', File.filename)),
            contentType: File.mimetype,
        }
    }

    const TestFunction = () => {
        console.log("This works")
        return "This works"; 
    }

    return {BufferImage, TestFunction }
}

module.exports = dataHooks; 