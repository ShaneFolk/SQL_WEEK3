// ============================================================
// ERROR HANDLER MIDDLEWARE — start
// ============================================================

// A "catch-all" for errors. Express treats any middleware with FOUR
// parameters (err, req, res, next) as an error handler, so all four must
// stay in the list, even though next isn't used here.
// It runs when a route calls next(err) or throws an error.
// It must be added with app.use() AFTER all the routes in server.js,
// or the errors won't reach it.
function errorHandler(err, req, res, next) {
    // Print the full error (where it happened, line by line) to the
    // terminal so we can debug it. The user never sees this part.
    console.error(err.stack);

    // Send a JSON error response back to the client:
    //   err.status || 500 -> use the error's own status code if it has one,
    //                        otherwise 500 (Internal Server Error)
    //   err.message || ... -> use the error's message, or a generic fallback
    res.status(err.status || 500).json({message: err.message || "internal server error"});
}

// Export it so server.js can require() it and plug it in with app.use()
module.exports = errorHandler;

// ============================================================
// ERROR HANDLER MIDDLEWARE — end
// ============================================================
