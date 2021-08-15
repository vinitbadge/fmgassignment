const config = require("config");
const usersRoute = require("./routes/api_routes");
const express = require("express");
const app = express();


//use config module to get the privatekey, if no private key set, end the application
if (!config.get("myprivatekey")) {
    console.error("FATAL ERROR: myprivatekey is not defined.");
    process.exit(1);
}

app.use(express.json());
//use users route for api/users
app.use("/api", usersRoute);

app.use(function (req, res, next) {
    return res.status(404).send(JSON.stringify({ success: false, errorcode: 1000, message: "not found" }));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    console.log(err);
    res.locals.error = err;
    return res.status(500).send(JSON.stringify({ success: false, errorcode: 999, message: "went wrong" }));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));
