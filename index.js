require('dotenv').config();
const EJS                     = require("ejs");
const APP                     = require("./app");
const TODO                    = require("./schema");
const PORT                    = 3000;
const PASSPORT                = require("passport");


APP.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
}); 