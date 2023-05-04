const sharp = require('sharp')

const SIZE = 800; 
const QUALITY = { quality: 75 }

//This function formats the image into of buffer type and compresses it. 
const BufferImage = async (File) => {
    try {
        const compressedImage = await sharp(File.buffer)
            .resize(SIZE) // Resize the image to a maximum width of 800 pixels
            .jpeg(QUALITY) // Compress the image using JPEG format with a quality of 80%
            .toBuffer();
        return {
            data: compressedImage,
            contentType: File.mimetype,
        }
    } catch (e) {
        console.log("BufferImage  error: ", e)
    }

}

//This function takes an array of image, converts to type buffer and compresses them. 
const BufferArrayOfImages = async (Files) => {
    try {
        const formatted = await Promise.all(Files.map(async file => {
                //const compressedImg = await sharp(file.buffer)
                //    .resize(SIZE) // Resize the image to a maximum width of 800 pixels
                //    .jpeg(QUALITY) // Compress the image using JPEG format with a quality of 80%
                //    .toBuffer();

                //return {
                //    data: compressedImg,
                //    contentType: file.mimetype,
                //} 
            const formattedImg = await BufferImage(file)
            return formattedImg;
        }))
        return formatted; 
    } catch (e) {
        console.log("BufferArrayOfImages error: ", e)
    }
}

module.exports = {
    BufferImage,
    BufferArrayOfImages,
}