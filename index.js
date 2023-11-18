const userRoutes = require('./routes/userRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const recipeRoutes = require('./routes/recipeRoutes');

const express = require("express");
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000
const allowedOrigins = ['http://localhost:3000', 'https://example.com'];

app.use(express.json())
app.use(userRoutes);
app.use(ingredientRoutes);
app.use(recipeRoutes);

app.use(cors({
  origin: function(origin, callback){
    // Check if origin is in allowedOrigins
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      const msg = 'The CORS policy for this site does not ' +
                  'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

app.listen(PORT, ()=>
    console.log(`Server running on  http://localhost:${PORT}`)
)

app.get("/", async(req, res)=>{
    res.send("Hello World")
})




