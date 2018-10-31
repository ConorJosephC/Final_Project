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
const Op = Sequelize.Op;

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
    unique: false
  }
},  {
   timestamps: false
 });

 const Lifestyle = sequelize.define('lifestyle', {
   profession: {
     type: Sequelize.STRING,
     unique: false
   },
   sleep: {
     type: Sequelize.STRING,
     unique: false
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
  const {lifestyle_profession, lifestyle_sleep, lifestyle_smoking, lifestyle_budget, lifestyle_duration} = req.body;
  const lifestyle = {profession: req.body.lifestyle_profession ,sleep: req.body.lifestyle_sleep,smoking: req.body.lifestyle_smoking ,budget: req.body.lifestyle_budget,duration: req.body.lifestyle_duration};

  if(user != null){
  res.render('profile', {user: user, lifestyle: lifestyle})             // message: message
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

////////////////////////////////////////////////////////////////////////////////
// LIFESTYLECONFIRMATION

app.post('/lifestyleconfirmation', (req, res) => {
  const user = req.session.user;
  const {lifestyle_profession, lifestyle_sleep, lifestyle_smoking, lifestyle_budget, lifestyle_duration} = req.body;
  const lifestyle = {profession: req.body.lifestyle_profession ,sleep: req.body.lifestyle_sleep,smoking: req.body.lifestyle_smoking ,budget: req.body.lifestyle_budget,duration: req.body.lifestyle_duration};

  res.render('lifestyleconfirmation', {user: user, lifestyle: lifestyle});
})

////////////////////////////////////////////////////////////////////////////////
// LIFESTYLE ADDED TO DB

app.post('/lifestyle', (req, res) => {
    const user = req.session.user;
    const {lifestyle_profession, lifestyle_sleep, lifestyle_smoking, lifestyle_budget, lifestyle_duration} = req.body;

    Lifestyle.create({
      profession: lifestyle_profession,
      sleep: lifestyle_sleep,
      smoking: lifestyle_smoking,
      budget: lifestyle_budget,
      duration: lifestyle_duration,
      userId: user.id,
    })
    .then((lifestyle)=>{
      res.redirect('/profile')
    })
    .catch((err)=>{
      console.error(err);
    });
})



////////////////////////////////////////////////////////////////////////////////
// MATCHES

app.get('/matches', (req, res) => {
  const user = req.session.user;
  const {lifestyle_profession, lifestyle_sleep, lifestyle_smoking, lifestyle_budget, lifestyle_duration} = req.body;
  console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"+user)

Lifestyle.findOne({
  where: {
    userId: user.id
  },
  include: [{
    model: User
  }]
})

.then((user_lifestyle)=>{
  Lifestyle.findAll({
    where: {
      id: {
        [Op.ne]: user_lifestyle.id
      },
      profession: user_lifestyle.profession,
      sleep: user_lifestyle.sleep,
      smoking: user_lifestyle.smoking,
      budget: user_lifestyle.budget,
      duration: user_lifestyle.duration,
    }, include:[{
        model: User
      }]
  })
.then((matches)=>{
  console.log(JSON.stringify(matches))
  res.render('matches', {user: user, user_lifestyle: user_lifestyle, matches: matches})
})
.catch(err => console.error(err))
})
})

//   console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"+user)
//   // const {lifestyle_profession, lifestyle_sleep, lifestyle_smoking, lifestyle_budget, lifestyle_duration} = req.body;
//   // const lifestyle = {profession: req.body.lifestyle_profession, sleep: req.body.lifestyle_sleep, smoking: req.body.lifestyle_smoking ,budget: req.body.lifestyle_budget,duration: req.body.lifestyle_duration};
// console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"+lifestyle.profession)
//
//   for (let i = 0; i < lifestyle.length; i++) {
//     if (req.body.lifestyle_profession == lifestyle[i].profession &&
//         req.body.lifestyle_sleep == lifestyle[i].sleep &&
//         req.body.lifestyle_smoking == lifestyle[i].smoking &&
//         req.body.lifestyle_budget == lifestyle[i].budget &&
//         req.body.lifestyle_duration == lifestyle[i].duration) {
//        let match = lifestyle[i].user;
//
// console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"+match)
//         res.render('matches', {
//           user: match,
//         });
//       }}
// })

// app.post('/matches', (req, res) => {
//   const user = req.session.user;
//   console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"+user)
//   const {lifestyle_profession, lifestyle_sleep, lifestyle_smoking, lifestyle_budget, lifestyle_duration} = req.body;
//   const lifestyle = {profession: req.body.lifestyle_profession, sleep: req.body.lifestyle_sleep, smoking: req.body.lifestyle_smoking ,budget: req.body.lifestyle_budget,duration: req.body.lifestyle_duration};
// console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"+lifestyle)
//
//   for (let i = 0; i < lifestyle.length; i++) {
//     if (req.body.lifestyle_profession == lifestyle[i].profession &&
//         req.body.lifestyle_sleep == lifestyle[i].sleep &&
//         req.body.lifestyle_smoking == lifestyle[i].smoking &&
//         req.body.lifestyle_budget == lifestyle[i].budget &&
//         req.body.lifestyle_duration == lifestyle[i].duration) {
//        let match = lifestyle[i].user;
//
// console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"+match)
//         res.render('matches', {
//           user: match,
//         });
//       }}
//   })


  //     res.render('matched', {match: matchedUser, user: user, lifestyle: lifestyle});
  //   }
  // }




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
