const LocalStrategy = require('passport-local').Strategy; 
const bcrypt = require('bcrypt'); 
const User = require('./model/user'); 
const passport = require('passport'); 


const initialize = passport => {
    passport.use(new LocalStrategy({ email, password }),
        function (email, password) {
            return User.findOne({ email, password }, async (err, user, cb) => {
                if (err) {
                    return cb(err)
                }
                if (!user) {
                    return cb(null, false, { message: "This email is not found within our databse." })
                }
                if (await !bcrypt.compare(password, user.password)) {
                    return cb(null, false, { message: "The password is incorrect." })
                }
                return cb(null, user, { message: "User is successfully logged in." })
            })
        }
    )

    //Declare library 
    const passportJWT = require('passport-jwt');
    const JWTStrategy = passportJWT.Strategy;
    const ExtractJWT = passportJWT.ExtractJWT;

    //Create a new passport strategy
    passport.use(new JWTStrategy({
        //Extract token from authorization header using the bearer scheme
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
    }, function (jwtPayload, cb) {
        return UserModel.findById(jwtPayload.id)
            .then(user => {
                return cb(null, user)
            })
            .catch(err => {
                return cb(err)
            })
    }))

}

module.exports = initialize; 