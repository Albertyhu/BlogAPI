const jwt = require("jsonwebtoken"); 

exports.checkAdmin = (res, req, next) => {
    const token = req.headers.authorization || req.query.token;

    if (!token) {
        return res.status(401).json({ error: [{ param: "authorization", msg: "User lacks authorization token" }] })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: [{ param: "authorization", msg: "User lacks authorization token." }] })
        }

        if (decoded.role == "admin") {
            next()
        }
        else {
            return res.status(403).json({ error: [{ param: "authorization", msg: 'You are not authorized to access this resource' }] });
        }
    })
}

exports.verifyToken = (req, res, next) => {
    const bearerHeader = req.headers.authorization; 
    if (typeof bearerHeader != 'undefined') {
        const bearer = bearerHeader.split(" ")
        const bearerToken = bearer[1]; 
        req.token = bearerToken; 
        next()
    } else {
        console.log("User is not authorized")
        res.status(403).json({ error: [{ param: "authorization", msg: "User is forbidden" }] })
    }
}