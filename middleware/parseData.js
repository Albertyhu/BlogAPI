const ParseData = (req, res, next) => {
    console.log("Parsing Data")
    try {
        req.body = JSON.parse(req.body);
        next();
    } catch (e) {
        console.log("There is an error in trying to parse req.body: ", e)
        console.log("req.body: ", req.body)
        next(); 
    }
}

module.exports = ParseData; 