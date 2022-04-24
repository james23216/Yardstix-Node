"use strict";

const SENDGRID_API_KEY = "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";
//elastic-email
//DFE2CE12979891BC10986C8C96A3EE931F89EF2C9AEA8A220239CE7B5216E0B5E658D834118B49D1D81BE760BB99F2D8

var express = require("express");
var router = express.Router();
var User = require("../models/user");
var mysql = require('../config/database.js');
var jwt = require('jsonwebtoken');
var config = require('../config/configuration.js');
var jsonwebtoken = require('jsonwebtoken');

const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail');
var _ = require('lodash.filter');

sgMail.setApiKey(SENDGRID_API_KEY);
let transporter = nodemailer.createTransport({
  host: "mail.njeek-sa.com",
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'do-not-reply@njeek-sa.com', // generated ethereal user
    pass: 'malikawan' // generated ethereal password
  }
});

var moment = require('moment');
var cloudinary = require("../config/cloudinary");
var multer = require("multer");
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function(req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter });

/* GET users listing. */
router.get("/register", function(req, res) {
  res.render("signup", {});
});

/* GET users listing. */
router.get("/forgot", function(req, res) {
  // res.type('html')
  res.contentType('html')
  res.render("forgetPasswordMain");
});



router.get("/test",async function(req, res) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  let info = await transporter.sendMail({
    from: 'server@yardstix.com', // sender address
    to: 'makalen@yopmail.com', // list of receivers
    bcc : `atayyab@yopmail.com, malik@yopmail.com`,
    subject: "Welcome to YardStix", // Subject line
    text: "Hello world, test email", // plain text body
  });
  
  res.json({message : info});
});


router.post("/testApi", function(req, res, next) {
  req.checkBody("email", "Enter a valid user email").notEmpty();
  req.checkBody("name", "Enter a valid user name").notEmpty();
  req.checkBody("password", "Enter a valid password").notEmpty();
  req.checkBody("username", "Enter a valid user name").notEmpty();
  console.log(req.body);
  var error = req.validationErrors(true);
  var errorValues = Object.keys(error);
  // console.log("error length " + errorValues.length);
  if (errorValues.length > 0) {
    console.log("inside if");
    return res.json({
      status: 422,
      message: "Validation errors",
      errors: error
    });
  } else {
    return res.json({
      status: 200,
      message: "All Good",
      payload: req.body
    });
  }
});



router.post("/register", function(req, res) {
  
  var user = new User(); 
  
  req.checkBody('name').notEmpty();
  req.checkBody('email').notEmpty().isEmail();
  req.checkBody('password').notEmpty();
  
  req.getValidationResult().then(error => {
      if (!error.isEmpty()) {
        console.log(error.array())
        return res.status(406).send({message: "Some parameters are missing", reason : error.array()});
      } else {
  
          let data = {
              name: req.body.name,
              email: req.body.email,
              password: user.generatePasswordHash(req.body.password),
              created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
              status: "live",
              code : ""
          };
          
              const selectQry = 'select id from users' + ' where email = "' + req.body.email + '"';
              const insertQry = `insert into users set ?`;
              
              data.link = Math.random().toString(36).substr(2, 10);
              
      mysql.query(selectQry ,function (err, rows) {
        if(err) {return res.status(501).send({message: "Database query error", error : err})}
        console.log(rows.length)
                      if (rows.length > 0) { 
                        return res.status(201).send({message: "Email already exists"});
                      }
                      mysql.query(insertQry, data , async function (err, rs) {
                        if(err) {return res.status(501).send({message: "Database query error..!", error : err})}
                          
                            console.log(rs)

                              let claims = {
                                  id: rs.insertId,
                                  username: req.body.name,
                                  link : data.link || ""
                              };
                              let token = jwt.sign(claims, config.secret);
                             
                              
                              data.password = "*******";
                              data.id = rs.insertId;
                              data.jwt = token;
                            var txt = "Welcome to iFollow \n\nThanks " +data.name + " for signing up with iFollow. We hope you enjoy using it and make the best out of it!\n\nThanks,\niFollow Inc., Staff"
                            const msg = {
                              to: req.body.email,
                              from: 'do-not-reply@ifollowinc.com',
                              subject: 'Welcome to iFollow',
                              text: txt
                            };
                            // sgMail.send(msg);
                            return res.status(200).send({message: "User registered successfully", access_key: token, user : data});

                          
                      })

                  })
      }
    });
});


router.post('/login', (req, res) => {
  req.checkBody('email').notEmpty();
  req.checkBody('password').notEmpty();
  var users = new User();
  let selectQry = ' select id, name, password, email, status, link from users' +
      ' where email = "' + req.body.email + '" && status = "live" ';
  console.log(selectQry);
  mysql.getConnection(function (err, connection) {
    if(err) {res.status(501).send({message: "database connection error"})
  console.log(err)}
    connection.query(selectQry ,async function (err, user) {
      if(err) return res.status(501).send({message: "database connection error"})
          if (user[0] == undefined) {
              // res.json({ status: 401, message: 'Invalid credentials' });
              // return res.status(401).send({message: "Invalid credentials"});         will be switched to invalid and blocked separately
              
              connection.release();
              return res.status(201).send({message: "Invalid credentials"});
            } else if(user[0].status == "blocked"){
              connection.release();
              return res.status(201).send({message: "Blocked by admin"});
            } else {
                  if(users.validPassword(req.body.password, user[0].password)){
                    
                          let claims = {
                            id: user[0].id,
                            username: user[0].name,
                            link : user[0].link || ""
                        };
                  
                  let token = jwt.sign(claims, config.secret);
                  user[0].jwt = token;
                  
                  
                          // setTimeout(function(){
                          //geoCity(req, qryData);
                          // }, 3000);
                          connection.release();
                          res.status(200).send({message: 'user logged in', access_key : user[0].jwt ,user : user[0] });
                          // res.json({ status: 200, message: 'Admin logged in', access_key : user[0].jwt });
                      }
                      else { 
                        connection.release();
                        res.status(201).send({message: 'Password Incorrect'});
                          
                          // res.json({ status: 401, message: 'PasswordIncorrect' });
                      }
                  
              
          }
      })
  })

});



router.post('/change_password', isLoggedIn, (req, res) => {
  req.checkBody('password').notEmpty();
  req.checkBody('new_password').notEmpty();
  var users = new User();
  let selectQry = ' select password from users' + 
      ' where id = "' + req.decoded.id + '"';
  console.log(selectQry);
  mysql.getConnection(function (err, connection) {
    connection.query(selectQry ,function (err, user) {
          if (user.length == 0) {
              // res.json({ status: 201, message: 'Invalid credentials' });
              res.status(201).send({message: "Invalid credentials"});
          } else {
                  if(users.validPassword(req.body.password, user[0].password)){
                      // console.log("password",req.body.password,"checking Password",user[0].password)
                      
                      let data = {
                        password: users.generatePasswordHash(req.body.new_password)
                    };

                        const insertQry = `update users set ? where id = ${req.decoded.id}`;
                        connection.query(insertQry, data, function (error, rows) {
                            if (error) res.end(JSON.stringify(error))
                            else {
                              connection.release();
                                return res.status(200).send({message: 'Password successfully changed' });
                            }
                        })
                      }
                      else { 
                        connection.release();
                        res.status(201).send({message: 'Password Incorrect'});
                          
                      

                      }
                  
              
          }
      })
  })

});


router.post('/add_feedback', async function(req, res) {
 
  var qry = `select id, name, link from users WHERE link = '${req.body.link}'`;
   mysql.query(qry, async function (error, rows) {
     var answers = req.body.answers.toString();
    console.log(error)
       if (error) return JSON.stringify(error)
       else {
         var data = {
           user_id : rows[0].id,
           answers : answers,
           link : req.body.link,
          created_at : moment().format("YYYY-MM-DD HH:mm:ss")
         }
         
        var qry = `insert into response set ?`;
        executeQry(qry, data);
        
        var qry = `select * from response WHERE link = '${req.body.link}'`;
        var feedback_data = await getFeedBackResponseData(qry)
         return res.status(200).send({message : "Feedback added..!", feedback_data});
       }
       
   })
      
});

router.post('/send_feedback_request',isLoggedIn, async function(req, res) {

        var receivers = req.body.email;
        receivers = receivers.toString()
        console.log(receivers)
        
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        let info =await transporter.sendMail({
          from: 'feedback@yardstix.co.uk', // sender address
          to : `survey@yardstix.co.uk`,
          bcc : `${receivers}`,
          subject: "Colleague Anonymous Feedback Request", // Subject line
          text: "Hello, you have been invited by "+ req.decoded.username + " to complete a 60 second peer review of their skills.\n\n All of the results provided to "+ req.decoded.username + " are anonymised to maintain the integrity of your feedback.\n\n" + req.body.base_url + req.decoded.link + "\n\nThank you, \n\nSarah\nYardstix Customer Success Team", // plain text body
        });

        var dats = {
          name : req.decoded.username,
          emails : receivers,
          created_at : moment().format("YYYY-MM-DD HH:mm:ss")
        }
        var qry2 = `insert into requests set ?`;
        executeQry(qry2, dats);
        console.log(info)
         return res.status(200).send({message : "Feedback Request Sent to the emails..!"});
      
      
});

router.get('/dummy_questions', async function(req, res) {
  var questions = await executeQry(`select * from questions where link = '0'`);
  var link = await executeQry(`select name from users where link = '${req.query.link}'`);

  for(var i = 0; i < questions.length; i++){
    questions[i].question = questions[i].question.replace("#", link[0].name);
  }

  return res.status(200).send({questions});
})

router.get('/questions', async function(req, res) {
  var questions = await executeQry(`select * from questions where link = '${req.query.link}'`);
  var link = await executeQry(`select name from users where link = '${req.query.link}'`);

  for(var i = 0; i < questions.length; i++){
    questions[i].question = questions[i].question.replace("#", link[0].name);
  }

  return res.status(200).send({questions});
})

router.post('/questions', async function(req, res) {
  console.log(req.body)
  for(var i = 0; i < req.body.questions.length; i++){
    let new_question = {
      question : req.body.questions[i].question,
      link : req.body.link
    }
    executeQry(`insert into questions set ?`, new_question);
  }

  return res.status(200).send({message : "Survey created."});
})
router.post('/update_questions', async function(req, res) {
  
  for(var i = 0; i < req.body.questions.length; i++){
    let new_question = {
      question : req.body.questions[i].question,
      link : req.body.link
    }
    executeQry(`update questions set ? where id = ${req.body.questions[i].id}`, new_question);
  }

  return res.status(200).send({message : "Survey updated"});
})

router.post('/delete_questions', async function(req, res) {
  executeQry(`update questions set link = '1' where id = ${req.body.id}`);
  
  return res.status(200).send({message : "question deleted"});
})
router.get('/response_data', async function(req, res) {
 var questions = await executeQry(`SELECT question FROM questions where link = '${req.query.link}'`);
 var question_len = questions.length;
  var qry = `select * from response WHERE link = '${req.query.link}'`;
   mysql.query(qry, async function (error, rows) {
     
    // console.log(rows)
    var result = [];
       if (error) return JSON.stringify(error)
       else {
        if(rows.length > 0){
          for(var i = 0; i < rows.length ; i++ ){
            
            result.push(rows[i].answers.split(','))
          }
              console.log(result.length, " ", question_len)
    var k = 0;
    var final = new Array(result.length).fill(0);
    var count = [];
    for(var i = 0; i < question_len; i++)
    count[i] = new Array(10).fill(0);
    
          for(var i = 0; i < question_len ; i++ ){
            for(var k = 1; k < question_len-1; k++){
              for(var j = 0; j < result.length; j++){
                  if(result[j][i] == k)
                  count[i][k-1]++;
              }
            }
          }
    // console.log(count)
          console.log(count.length, " " , count[0].length)
        }
        console.log(count.length, " " , questions.length)
         return res.status(200).send({message : "Feedback Data..!", data : count, questions});
       }
   })
});

function executeQry(qry, data) {
  return new Promise(function(resolve) {
    mysql.query(qry, data, function (error, rows) {
      if (error) resolve(JSON.stringify(error))
      else {
          resolve(rows);
      }
  })
  });
}
function getFeedBackResponseData(qry, data) {
  return new Promise(function(resolve) {
    mysql.query(qry, async function (error, rows) {
      
     var result = [];
        if (error) return JSON.stringify(error)
        else {
         if(rows.length > 0){
           for(var i = 0; i < rows.length ; i++ ){
             
             result.push(rows[i].answers.split(','))
           }
               console.log(result[0][1])
 var k = 0;
     var final = new Array(result.length).fill(0);
     var count = [];
     for(var i = 0; i < result[0].length; i++)
     count[i] = new Array(10).fill(0);
     
           for(var i = 0; i < result[0].length ; i++ ){
               for(var k = 1; k < 11; k++){
             for(var j = 0; j < result.length; j++){
                 if(result[j][i] == k)
                 count[i][k-1]++;
               }
             }
           }
          //   console.log(count)
          //  console.log(count.length, " " , count[0].length)
         }
         resolve(count);
        }
    })
  });
}


async function isLoggedIn(req, res, next) {
  var isValid = jwt_validator(req);
  var token = req.body.token || req.query.token || req.headers["x-access-token"];
  // console.log(globalUsers)
  // if (req.decoded && globalUsers[`'${req.decoded.id}'`] == token) {
    if (req.decoded) {
        console.log("--total connections--"+mysql.config.connectionLimit)
        console.log("--free connections--"+mysql._freeConnections.length)
        console.log("--all connections--"+mysql._allConnections.length)
        console.log("--working connections--"+mysql._acquiringConnections.length)
        console.log("user", req.decoded.id);
      next();
    } else {
      console.log(isValid)
      console.log("JWT token is missing", req.decoded);
      res.json({
        status: 401,
        message: "JWT token is missing"
      });
  }
  
}

function jwt_validator(req) {
  return new Promise(function(resolve) {
    var token = req.body.token || req.query.token || req.headers["x-access-token"];
        if (token) {
            jsonwebtoken.verify(token, config.secret, (err, decoded) => {
                if (err) {
                  resolve(false);
                } else {
                    req.decoded = decoded;
                    console.log("Inside middle-ware, jwt_validator, decoded OBJ-> ", req.decoded);
                    resolve(true);
                }
            });
        } else {
            resolve(false);
        }
  });
}


  
  
module.exports = router;
