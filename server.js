import connectDB from "./src/config/mongodb.js";
import app from "./src/app.js";

// configure server
const port = process.env.PORT || 3000;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`server is listening on port ${port}`);
        });
    })
    .catch(err => {
        console.log("Database Connected failed! Error is:",err);
    });
