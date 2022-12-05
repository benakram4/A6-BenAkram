
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');



//Schema
var userSchema = new Schema({
  "userName":  {
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



//Initialize
let url = "mongodb+srv://mongoose:mongoose16@weba6.nnj8k3q.mongodb.net/?retryWrites=true&w=majority"

let User;

exports.initialize = () => {
    return new Promise((resolve, reject)=> {
        const db = mongoose.createConnection(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err){
            if(err) {
                console.log("FAILURE");
                reject(err);
            }
            else {
                console.log("SUCCESS");
                User = db.model("users", userSchema);
                resolve();
            }
        });  
    });
}



//Functions----------------------------------------------------------------------------------
//userData contains: .userName, .userAgent, .email, .password, .password2
exports.registerUser = (userData) => {
    return new Promise((resolve, reject) => {
        if (userData.password == null || userData.password.trim() == "" || 
            userData.password2 == null || userData.password2.trim() == "") {
            reject("Error: user name cannot be empty or only white spaces!");
        }
        else if(userData.password != userData.password2) {
            reject("Error: Passwords do not match");
        }
        else {
            bcrypt.hash(userData.password, 10)  //encrypt password
            .then((hash)=>{
                userData.password = hash;
                let newUser = new User(userData);
            
                newUser.save()
                .then(()=> {
                    resolve()
                }).catch((err)=>{
                    if (err == 11000) 
                        reject("User Name already taken");
                    else
                        reject(`There was an error creating the user: ${err}`);
                });

            }).catch(err=> {
                reject("There was an error encrypting the password");
            });
        }
    });
}

//userData contains: .userName, .userAgent, .email, .password
exports.checkUser = (userData) => {
    return new Promise((resolve, reject) => {
        User.findOne({ userName : userData.userName })
        .exec()
        .then((userFound) => {
            if(userFound.userName == null || userFound.userName == "") {  //if (!userFound)
                reject(`Unable to find user: ${userData.userName}`);
            }
            else {
                bcrypt.compare(userData.password, userFound.password)
                .then((res) => {
                    if (res == true) {
                        userFound.loginHistory.push({dateTime: (new Date()).toString(), userAgent: userData.userAgent}); 
                        
                        User.updateOne(
                            { userName: userFound.userName},
                            { $set: { loginHistory: userFound.loginHistory } })
                        .exec()
                        .then(()=> { resolve(userFound) })
                        .catch(err=> { reject(`There was an error verifying the user: ${err}`) });
                    }
                    else {
                        reject(`Incorrect Password for user: ${userData.userName}`);
                    }
                });
            }
        })
        .catch(err => {
            reject(`Unable to find user: ${userData.userName}`);
        });
    });
}   

