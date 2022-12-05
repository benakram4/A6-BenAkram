// require mongoose and setup the Schema
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// require bcrypt for password hashing
const bcrypt = require('bcryptjs');


// define the company schema
var userSchema = new Schema({
    "userName": {
        "type": String,
        "unique": true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }]
});

var User = new Object; // to be defined on new connection (see initialize)
const URL = "mongodb+srv://mongoose:mongoose16@weba6.nnj8k3q.mongodb.net/?retryWrites=true&w=majority";

exports.initialize = () => {
    return new Promise( (resolve, reject) => {
        const db = mongoose.createConnection(URL,  {useNewUrlParser: true, useUnifiedTopology: true}, function (err) {
            if (err) {
                console.log(`\nError connecting to MongoDB Atlas: ${err}\n`);
                reject(err);
            } 
            else {
                console.log(`\nConnected to MongoDB Atlas\n`);
                User = db.model("users", userSchema);
                //module.exports.User = User;
                resolve();
            }
        });
    });
}

exports.registerUser = function (userData) {
    return new Promise( (resolve, reject) => {
        if (userData.password == null || userData.password.trim() == "" ||
            userData.password2 == null || userData.password2.trim() == "") {
            reject("Error: user name cannot be empty or only white spaces! ");
        }
        else if (userData.password != userData.password2) {
            reject("Error: passwords do not match! ");
        }
        else {
            bcrypt.hash(userData.password, 10)
            .then((hash)=>{
                userData.password = hash;
                var newUser = new User(userData);
                    newUser.save()
                    .then(() => {
                            //console.log(`\nUser ${userData.userName} registered\n`);
                        resolve();
                    })
                    .catch((err) => {
                        if (err.code == 11000) {
                            reject("User Name already taken");
                        }
                        else {
                            reject("There was an error creating the user: " + err);
                        }
                    });
                })
                .catch((err) => {
                    reject("There was an error encrypting the password: " + err);
                });
        }
    });
};

exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.findOne({ userName: userData.userName })
            .exec()
            .then((foundUser) => {
                if (!foundUser) {
                    console.log(`\nUser not found for userName: ` + userData.userName + `\n`);
                    reject("Unable to find user: " + userData.userName);
                }
                else {
                    bcrypt.compare(userData.password, foundUser.password).then((res) => {
                        if (res === true) {
                            console.log(`\nUser found for userName: ` + userData.userName + `\n`)
                            foundUser.loginHistory.push({ dateTime: (new Date()).toString(), userAgent: userData.userAgent })
                            User.updateOne(
                                { userName: foundUser.userName },
                                { $set: { loginHistory: foundUser.loginHistory } })
                                .exec()
                                .then(() => {
                                    console.log(`\nUser ${userData.userName} login history updated\n`);
                                    resolve(foundUser);
                                })
                                .catch((err) => {
                                    console.log(`\nError updating user ${userData.userName} with loginHistory\n`);
                                    reject("There was an error verifying the user: " + err);
                                });
                        }
                        else {
                            reject("Incorrect Password for user:" + userData.userName);
                        }
                    });
                };
            })
            .catch((err) => {
                console.log(`\nError finding user: ${err}\n`);
                reject("Unable to find user: " + userData.userName);
            });
    });
};


