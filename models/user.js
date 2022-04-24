var mySql = require("../config/database");
var config = require('../config/configuration.js');
var crypto = require('crypto');
var sha1 = require('sha1');
var moment = require('moment');
var jsonwebtoken = require('jsonwebtoken');
class user {
    constructor() {

    }

    getUsersProfile(userId, callback) {
        var query = "SELECT *\
                     FROM users\
                     WHERE id =  " + userId;

        mySql.getConnection(function (err, connection) {
            if (err) {
                throw err;
            }
            connection.query(query, function (err, rows) {
                connection.release()
                callback(err, rows); //Passing results to callback function
            });
        });
    }
    getCustomerss(id) {
        return new Promise(function (resolve) {
            var query = `SELECT * from customers WHERE id = ${id}`;
            mySql.getConnection(function (err, connection) {
                if (err) {
                    throw err;
                }
                connection.query(query, function (err, rows) {
                    if (err) {
                        throw err;
                    }
                    else {
                        connection.release();
                        console.log("Promise going to be resolved");
                        resolve(rows);
                    }
                });
            });
        });
    }


    generatePasswordHash(password) {
        console.log("password", password);
        //var sha1 = crypto.createHash('sha1').update(password).digest("hex");
        var sha = sha1(password)
        console.log("sha1", sha);
        // return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
        return sha;
    }

    validPassword(password, localPassword) {
        //  console.log("password",password,"localPassword",localPassword);
        // var sha1 = crypto.createHash('sha1').update(password).digest("hex");
        var sha = sha1(password)
        console.log(sha , " -- " , localPassword)
        if (sha == localPassword) {
            return true;
        } else {
            return false;
        }
        //  return bcrypt.compareSync(password,localPassword); 
    }  
    encryptPassword(password) {
        //  console.log("password",password,"localPassword",localPassword);
        // var sha1 = crypto.createHash('sha1').update(password).digest("hex");
        var sha = sha1(password)
        return sha;
        //  return bcrypt.compareSync(password,localPassword); 
    }
    validToken(req){
        var token = req.body.token || req.query.token || req.headers["x-access-token"];
        if (token) {
            jsonwebtoken.verify(token, config.secret, (err, decoded) => {
                if (err) {
                    return false;
                } else {
                    req.decoded = decoded;
                    console.log("Inside middle-ware, decoded OBJ->", req.decoded);
                    return true;
                }
            });
        } else {
            return false;
        }


    }
}
module.exports = user;
