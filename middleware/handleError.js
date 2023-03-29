
function handleError(middleware, req, res, next) {
    middleware(req, res, (err) => {
        if (err) {
            console.error(err);
            return res.sendStatus(400); // Bad request
        }

        next();
    });
}

module.exports = handleError;

  