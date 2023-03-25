const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

exports.protect = () => {
    passport.use(new JWTStrategy({
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(), 
        secretOrKey: process.env.JWT_SECRET,
    }), function (jwtPayload, cb) {
        
    })
}

