////////////////////////////////////////////////////////////////////////////////
                // DEPENDENCIES
////////////////////////////////////////////////////////////////////////////////

const Sequelize = require('sequelize');
const express = require('express');
const ejs = require('ejs');
const session = require('express-session');
const app = express();

const bodyParser = require('body-parser');
const SequelizeStore = require('connect-session-sequelize')(session.Store)

////////////////////////////////////////////////////////////////////////////////
                // BCRYPT PASSWORD
////////////////////////////////////////////////////////////////////////////////

const bcrypt = require('bcrypt');

const saltRounds = 10;

////////////////////////////////////////////////////////////////////////////////
                // CONFIGURE DEPENDENCIES
////////////////////////////////////////////////////////////////////////////////

const sequelize = new Sequelize("roommatefinder", process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
    host: 'localhost',
    dialect: 'postgres'
})

////////////////////////////////////////////////////////////////////////////////
                // CONNECT WITH TEMPLATE ENGINE FOLDER
////////////////////////////////////////////////////////////////////////////////

app.set('views', './public/views');
app.set('view engine', 'ejs');

////////////////////////////////////////////////////////////////////////////////
                // SET UP SESSION
////////////////////////////////////////////////////////////////////////////////

app.use(session({
  store: new SequelizeStore({
    db: sequelize,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 24 * 60 * 60 * 1000
  }),
  secret: "any string",
  saveUninitialized: true,
  resave: false
}))

////////////////////////////////////////////////////////////////////////////////
                // CONNECT WITH PUBLIC FOLDER
////////////////////////////////////////////////////////////////////////////////

app.use(express.static('./public'));

////////////////////////////////////////////////////////////////////////////////
                // SET UP BODY PARSER
////////////////////////////////////////////////////////////////////////////////

app.use(bodyParser.urlencoded({extended: true}));

////////////////////////////////////////////////////////////////////////////////
                // MODELS DEFINITION
////////////////////////////////////////////////////////////////////////////////

const User = sequelize.define('user', {
  username: {
    type: Sequelize.STRING,
    unique: true
  },
  firstname: {
    type: Sequelize.STRING,
    unique:false
  },
  lastname: {
    type: Sequelize.STRING,
    unique: false
  },
  age: {
    type: Sequelize.INTEGER,
    unique: false
  },
  about: {
    type: Sequelize.STRING,
    unique: false
  },
  email: {
    type: Sequelize.STRING,
    unique: false
  },
  password: {
    type: Sequelize.STRING,
    unique: false,
  }
},  {
   timestamps: false
 });

 const Lifestyle = sequelize.define('lifestyle', {
   profession: {
     type: Sequelize.STRING,
     unique: true
   },
   sleep: {
     type: Sequelize.STRING,
     unique:false
   },
   smoking: {
     type: Sequelize.STRING,
     unique: false
   },
   budget: {
     type: Sequelize.STRING,
     unique: false
   },
   duration: {
     type: Sequelize.STRING,
     unique: false
   },
 }, {
    timestamps: false
  });

////////////////////////////////////////////////////////////////////////////////
                // TABLE RELATIONSHIPS/ASSOCIATION
////////////////////////////////////////////////////////////////////////////////

User.hasOne(Lifestyle, { foreignKey: { allowNull: false } });
Lifestyle.belongsTo(User, { foreignKey: { allowNull: false } });

////////////////////////////////////////////////////////////////////////////////
                // ROUTES
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// HOME PAGE

app.get('/', (req, res) => {
  let user = req.session.user;
  res.render('home', {user: user})
})

////////////////////////////////////////////////////////////////////////////////
// ABOUT US

app.get('/aboutus', (req, res) => {
  res.render('aboutus');
})

////////////////////////////////////////////////////////////////////////////////
// SIGN UP

app.get('/signup', (req, res) => {
  res.render('signup');
})

app.post('/signup', (req,res) => {

  let inputusername = req.body.username
  let inputfirstname = req.body.firstname
  let inputlastname = req.body.lastname
  let inputage = req.body.age
  let inputabout = req.body.about
  let inputemail = req.body.email
  let inputpassword = req.body.password
  let inputconfirmpassword = req.body.confirmpassword

  if (inputpassword !== inputconfirmpassword) {
    res.send('Your password does not match');
  } else {
  bcrypt.hash(inputpassword, saltRounds).then(hash => {
  User.create({
    username: inputusername,
    firstname: inputfirstname,
    lastname: inputlastname,
    age: inputage,
    about : inputabout,
    email: inputemail,
    password: hash,
  })

  .then((user) => {
        req.session.user = user;
        res.redirect('/profile');
      });
    })
  }
  })

////////////////////////////////////////////////////////////////////////////////
// LOGIN AND CHECKING FOR MATCHING USER INPUT DATA

app.get('/login', (req, res) => {
  let user = req.session.user;
  res.render('login');
})

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  if(email.length === 0) {
    res.redirect('/?message=' + encodeURIComponent("Please fill in your correct email."));
    return;
  }
  if(password.length === 0) {
    res.redirect('/?message=' + encodeURIComponent("Please fill in your password."));
    return;
  }
  User.findOne({
		where: {
			email: email
		}
	})
  .then((user) => {
    if(user !== undefined ) {
      let hash = user.password;
      bcrypt.compare(password, hash,(err, result) => {
        req.session.user = user;
        res.redirect('/profile');
      });
    } else {
      res.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
    }
  })
  .catch((error) => {
    console.error(error);
  });
});

////////////////////////////////////////////////////////////////////////////////
// LOG OUT

app.get('/logout', (req,res)=>{
  req.session.destroy(function(error) {
    if(error) {
      throw error;
    }
    res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
  })
})

////////////////////////////////////////////////////////////////////////////////
// PROFILE

app.get('/profile', (req, res)=> {

  const user = req.session.user;
  if(user != null){
  res.render('profile', {user: user})             // message: message
}else{
    res.redirect('/')
}
})

////////////////////////////////////////////////////////////////////////////////
// LIFESTYLE

app.get('/lifestyle', (req, res) => {
  const {user} = req.session;
  res.render('lifestyle', {user: user})
})

app.post('/lifestyle', (req, res) => {
  const {user} = req.session;
  const {lifestyle_profession, lifestyle_sleep, lifestyle_smoking, lifestyle_budget, lifestyle_duration} = req.body;
  console.log("profession");
  Lifestyle.findOne({
    where: {
      profession: lifestyle_profession,
      sleep: lifestyle_sleep,
      smoking: lifestyle_smoking,
      budget:lifestyle_budget,
      duration: lifestyle_duration,
    }
  })
  // .then(time => {
  //   return Offer.findAll({
  //     where: {
  //       timeId: time.id
  //     },
  //     include: [{model: Business}, {model: Time}]
  //   })
  // })
  .then((lifestyle)=>{
    res.render('lifestyleconfirmation', {user: user})
  })
  .catch((err)=>{
    console.error(err);
  });
})

////////////////////////////////////////////////////////////////////////////////
// LIFESTYLECONFIRMATION

app.get('/lifestyleconfirmation', (req, res) => {
  const {user} = req.session;
  res.render('lifestyleconfirmation', {user: user});
})

////////////////////////////////////////////////////////////////////////////////
// MATCHES

app.get('/matches', (req, res) => {
  res.render('matches');
})

////////////////////////////////////////////////////////////////////////////////
// MESSAGING

app.get('/messages', (req, res) => {
  res.render('messages');
})

////////////////////////////////////////////////////////////////////////////////
                // START SERVER AND SEQUELIZE
////////////////////////////////////////////////////////////////////////////////

sequelize.sync({force: false})
.then(() => {
  const server = app.listen(3000, () => {
    console.log('App is running on port 3000');
  })
})
