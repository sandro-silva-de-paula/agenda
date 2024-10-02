const { log, Console } = require("console");
const express = require("express");
const server = express();
const fs = require("fs");
const dotenv = require("dotenv");
var https = require('https');
var privateKey  = fs.readFileSync('cert.key', 'utf8');
var certificate = fs.readFileSync('cert.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

dotenv.config();

//// postgresql
const pg = require("pg");
const { isDate } = require("util/types");
const { Client } = pg


/// servindo aquivos estaticos nas pasta
server.use(express.static('../public'));


server.use(
  express.json({
    verify: (request, response, buffer, encoding) => {
      try {
        JSON.parse(buffer);
      } catch (e) {
        console.log("Deu merda!!!");
        response.status(400).send("Invalid JSON");
      }
    },
  })
);




server.all("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", req.headers.origin);
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Accept,X-Access-Token,X-Key,Authorization,X-Requested-With,Origin,Access-Control-Allow-Origin,Access-Control-Allow-Credentials"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
  } else {
    next();
  }
});

server.get("/agenda", async (request, response) => {

  const dateIni = new Date(request.query.start);
  const dateEnd = new Date(request.query.end);
  
  
  try{ 
    ///validar datas
    checkDate(dateIni);
    checkDate(dateEnd);

    const client = new Client();
    
    await client.connect();
    const querySql = "select * from agenda where appointment_time >= $1 and appointment_time <= $2";
    
    const res = await client.query(querySql,[dateIni,dateEnd]);
    
    response.json(res.rows);
    await client.end(); 

} catch(e) {
  console.log('Dados invalidos!',e);
  response.status(400).send();

}

});



//// daqui pra baixo somente autenticado
server.use((req, res, next) => {
 // authentication middleware

  const auth = {login: process.env.WEBLOGIN, password: process.env.WEBPASSWORD} // change this

  // parse login and password from headers
  const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

  // Verify login and password are set and correct
  if (!login || !password || login !== auth.login || password !== auth.password) {
    // Access denied...
    res.set('WWW-Authenticate', 'Basic realm="401"') // change this
    res.status(401).send('Authentication required.') // custom message

  } else{ 
  // // Access granted...
  next()
  }

})


server.post("/agenda", async (request, response) => {
  //connect banco de dados
  const client = new Client();

  await client.connect();
  
  //descontruindo body em duas variaveis
  const { timestamp, first_name, obs_,service, phone } = request.body; 
  
    try {
      const res1 = await client.query(`INSERT INTO agenda ("appointment_time", "first_name", "obs_", "service","phone")
                                    VALUES ($1,$2,$3,$4,$5) returning * `, [timestamp, first_name, obs_ ,service,phone]);
      console.log('Appointment Saved : ',res1.rows[0]);
      await client.end();
      response.status(200).json(res1.rows[0]);
    } catch(e) {
      if(e.code ==='23505'){ 
        //  console.log(e.code)
         console.log(timestamp +' Ja reservado ....')

        }
      await client.end();
      response.status(500).send(e);
      }
});


/// pra rodar com python3 -m http.server 00000/////
// server.listen(3001, () => {
//   console.log("Server is running on port 3001");
// });

const httpsServer = https.createServer(credentials, server);
httpsServer.listen(8443,() => {
    console.log("Server is running on port 8443")
});

/////////////////////////////
/////////////////////////////

function checkDate(date){
  if(isNaN(date.getTime())){
    throw new TypeError("Invalid Date.");
  }
};
