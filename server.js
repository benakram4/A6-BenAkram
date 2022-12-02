/************************************************************************* 
 *  BTI325– Assignment 6
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.
 *   No part of this assignment has been copied manually or electronically from any other source. *
 * (including 3rd party web sites) or distributed to other students. *  
 *  Name: Ben Akram Student ID: 158523217 Date: xx/xx/xxxx *
 *  Online (Cyclic) URL:  *  *
 * ********************************************************************************/

// ======Create express application ================================================================
var express = require("express"); // Include express.js module
var app = express();
app.use(express.static('public')); // serve static files from the public folder
app.use(express.json()); // parse incoming JSON requests and place them in req.body
app.use(express.urlencoded({ extended: true })); // parse incoming urlencoded form data and place it in req.body
// =================================================================================================

// === mongoose & cookie setup  ====================================================================
var dataServiceAuth = require("./data-service-auth.js");
var clientSessions = require("client-sessions");

app.use(clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "web322_assignment6_is_the_best", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60 // the session will be extended by this many ms each request (1 minute)
}));
app.use(function(req,res,next){
    res.locals.session = req.session;
    next();
});

ensureLogin = function (req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}


// =================================================================================================


// === Create path to static files =================================================================
var path = require("path"); // include module path to use __dirname, and function path.join()
var data = require("./data-service.js");
// =================================================================================================

// === Include file handling module ================================================================
var multer = require("multer"); 
// === Multer setup ===============================================================================
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
// =================================================================================================
   
// === includes writing to a file ==================================================================
var fs = require("fs");  
// =================================================================================================

// === Include handlebars ==========================================================================
const exphbs = require("express-handlebars"); 
// =================================================================================================

// === Set up handlebars engine ====================================================================
app.engine(".hbs", exphbs.engine({ 
    extname: ".hbs", 
    helpers: {
        navLink: function(url, options){
            return '<li' +
            ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
            '><a href=" ' + url + ' ">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
            throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
            return options.inverse(this);
            } 
            else {
            return options.fn(this);
            }
        },
        viewData: (view) =>{
            return view.fn(this);
        }
    }
}));

app.set("view engine", ".hbs");
// =================================================================================================

// === Enable dynamic menu ========================================================================
app.use(function(req,res,next){
     let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
     next(); }); 
// =================================================================================================


// =================================================================================================
// === Setup HTTP server to listen on port 8080 ====================================================
var HTTP_PORT = process.env.PORT || 8080;
// call this function after the http server starts listening for requests
function onHttpStart(){
    console.log("Express http server listening on port: " + HTTP_PORT);
};
// =================================================================================================



//================================================================================================//
//  GET ROUTES
//================================================================================================//

//home route
app.get("/", function(req, res){
    res.render("home");
});

//about page route
app.get("/about", function(req, res){
    res.render("about");
});

//employees/add route
app.get("/employees/add", ensureLogin, function(req, res){
    data.getDepartments()
    .then((data) => res.render("addEmployee", {departments: data}))
    .catch((err) => res.render("addEmployee", {departments: []}));
});

//images/add route
app.get("/images/add", ensureLogin,function(req, res){
    //redirect to images page if render was successful
    res.render("addImage");
});

// images route
app.get("/images", ensureLogin,function(req, res){
    //return all images in the images folder
    fs.readdir("./public/images/uploaded", (err, images) =>{
        if(err){
            console.log("Error reading images");
        }
        else{
            console.log("Images read successfully");
            res.render("images", {images: images});
        }
    });
});


//employees route and employee related queries
app.get("/employees", ensureLogin,function(req, res){

    if(req.query.status){ //query with employees status
        console.log("this is req.query.status: " + req.query.status);
        data.getEmployeesByStatus(req.query.status)
        .then((data) => res.render("employees", {employees: data}))
        .catch((err) => res.render('employees',{message: `${err}`}));
        console.log("getting emp : getEmployeesByStatus()");
    }   
    else if(req.query.department){ //query with employees department
        console.log("this is req.query.department: " + req.query.department);
        data.getEmployeesByDepartment(req.query.department)
        .then((data) => res.render("employees", {employees: data}))
        .catch((err) => res.render({message: `${err}`}));
    }
    else if(req.query.manager){ //query with employees manager id
        console.log("this is req.query.manager: " + req.query.manager);
        data.getEmployeesByManager(req.query.manager)
        .then((data) => res.render("employees", {employees: data}))
        .catch((err) => res.render({message: `${err}`}));
    }
    else{
        data.getAllEmployees() // without query 
        .then((data) => res.render("employees", {employees: data}))
        .catch((err) => res.render("employees",{message: `${err}`}))
        console.log("getting all employees : getAllEmployees()");
    }
});

//managers route
app.get("/managers", ensureLogin,function(req, res){
    data.getManagers()
    .then((data) => {res.json(data)})
    .catch((err) => {console.log(`${err}`)});
    console.log("getting managers : getManagers()");
});

//get employee by emp number function
app.get("/employee/:empNum", ensureLogin,(req, res) => {
	// initialize an empty object to store the valueslet 
	viewData = {};

    console.log("\n\nview data when it empty: " + viewData + "\n\n");

	data.getEmployeeByNum(req.params.empNum)
	.then((data) => {
        if (data) {
		viewData.employee = data; //store employee data in the "viewData" object as "employee"
        console.log("\n\nset employee to null if none were returned: " + viewData + "\n\n");
		} 
		else {
			viewData.employee = null; // set employee to null if none were returned
            console.log("\n\nset employee to null if none were returned: " + viewData + "\n\n");
		}
	})
	.catch(() => {
		viewData.employee= null; // set employee to null if there was an error 
		}).then(data.getDepartments)
		.then((data) => {
			viewData.departments = data; // store department data in the "viewData" object as "departments"

			// loop through viewData.departments and once we have found the departmentId that matches
			// the employee's "department" value, add a "selected" property to the matching 
			// viewData.departments object
			for (let i = 0; i < viewData.departments.length; i++) {
				if (viewData.departments[i].departmentId == viewData.employee.department) {
					viewData.departments[i].selected = true;
                    console.log("\n\nset department: " + viewData + "\n\n");
				}
			}
		}).catch(() => {
			viewData.departments = []; // set departments to empty if there was an error
			}).then(() => {
				if (viewData.employee== null) { // if no employee -return an error
					res.status(404).send("Employee Not Found");
				} else {
                    console.log("\n\nFound Emp and rendering " + viewData + "\n\n");
					res.render("employee", { viewData: viewData }); // render the "employee" view
				}
			});
});


//delete employee by emp number function
app.get("/employees/delete/:empNum", ensureLogin,(req, res) => {
    console.log('\n' + "delete emp num: " + req.params.empNum + '\n');
    data.deleteEmployeeByNum(req.params.empNum)
    .then(() => res.redirect("/employees"))
    .catch((err) => res.status(500).send("\nUnable to Remove Employee / Employee not found: " + err + '\n'));
});


//departments route
app.get("/departments", ensureLogin,function(req, res){
    data.getDepartments()
    .then((data) => {res.render("departments", {departments: data})})
    .catch((err) => {res.render("departments", {message: `error${err}`})})
    console.log("getting dep : getDepartments()");
});
  
//add department route
app.get("/departments/add", ensureLogin,function(req, res){
    res.render("addDepartment");
});


app.get("/department/:value", ensureLogin,function(req, res){
    data.getDepartmentById(req.params.value)
    .then((data) => {res.render("department", {department: data})})
    .catch((err) => {res.status(404).send(`\nDepartment not found${err}\n`)});
    //if data is undefined, send 404 error
    if(data === undefined){
        res.status(404).send(`\nDepartment not found\n`);
    }
    console.log("\ngetting dep by id : getDepartmentById()\n");
});

// === GET LOGIN ROUTES ==========================================================================//
//login route
app.get("/login", function(req, res){
    res.render("login");
});

//register route
app.get("/register", function(req, res){
    res.render("register");
});

// === POST LOGIN ROUTES ===============================================================================//
// login post route
app.post("/login", function(req, res){
    req.body.userAgent = req.get('User-Agent');
    dataServiceAuth.checkUser(req.body)
    .then((user) => {
        req.session.user = {
            userName: user.userName, // authenticated user's userName
            email: user.email, // authenticated user's email
            loginHistory: user.loginHistory // authenticated user's loginHistory
        }
        res.redirect('/employees');
    })
    .catch((err) => {
        res.render('login', {errorMessage: err, userName: req.body.userName});
    });
});

// logout route
app.get("/logout", (req, res)=>{
    req.session.reset();
    res.redirect("/login");
});

// user history route
app.get("/userHistory", ensureLogin, function(req, res){
    res.render("userHistory");
});



//register post route
app.post("/register", function(req, res){
    dataServiceAuth.registerUser(req.body)
    .then(() => {
        res.render("register", {successMessage: "User created"});
    })
    .catch((err) => {
        res.render("register", {errorMessage: err, userName: req.body.userName});
    });
});


//================================================================================================//

//================================================================================================//
//  POST ROUTES
//================================================================================================//

//upload image function
app.post("/images/add", ensureLogin,upload.single("imageFile") ,function(req, res){
    fs.readdir("./public/images/uploaded", (err, files) => {
        console.log("Uploading Image");
        if(err){
            console.log("Failed to upload Image");
            res.status(500).send(`\nUnable to Update Employee: ${err} \n`);
            
        }
        else{
            console.log("Image Uploaded successfully");
            res.redirect("/images");
        }
     });
     
});

//add employee function
app.post("/employees/add", ensureLogin,(req,res) =>{
    data.addEmployee(req.body)
    .then(() => {res.redirect("/employees")})
    .catch((err) => {res.status(500).send(`\nUnable to Add Employee: ${err} \n`)});
    //console.log("adding emp");
})



//update employee
app.post("/employee/update", ensureLogin,(req, res)=> {
    console.log(req.body);
    data.updateEmployee(req.body)
    .then(() => {res.redirect("/employees")})
    .catch((err) => {res.status(500).send(`\nUnable to Update Employee: ${err} \n`)}); 
    //console.log("updating emp");
});

//add department
app.post("/departments/add", ensureLogin,(req, res) => {
    data.addDepartment(req.body)
    .then(() => {res.redirect("/departments")})
    .catch((err) => {res.status(500).send(`\nUnable to Add Department: ${err} \n`)});
});

//update department
app.post("/department/update", ensureLogin,(req, res) => {
    data.updateDepartment(req.body)
    .then(() => {res.redirect("/departments")})
    .catch((err) => {res.status(500).send(`\nUnable to Update Department: ${err} \n`)});
});




//================================================================================================//

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "views/error404.html"));
});
  
data.initialize().then(dataServiceAuth.initialize).then(app.listen(HTTP_PORT, onHttpStart)).catch((err) => {
    console.log("Error: " + err);
});
