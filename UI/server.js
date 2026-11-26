const express = require('express');
const path = require('path');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

const url = 'mongodb+srv://hkmuuser:guser1024@cluster0.kqxfpiw.mongodb.net/sample_gp'
const User = require('./models/userinfo');
const Question= require('./models/questionbank');

// 1. Point Express to your "view" folder (singular)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse form data (helpful for login and Adds pages)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Optional: serve static files (CSS, client JS, images) from a "public" folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret:'comp3810-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie:{maxAge: 1000*60*60}
}))

mongoose.connect(url)
  .then(console.log('Mongoose Connected!'))
  .catch((err)=>console.log(err))
  .finally()


//Function for Login page 
function isLoggedin(req,res,next) {
    if (req.session.user){
        return next();
    }
    res.redirect('/login');
}

//Funcion for Assignments
async function getQuestionInfo(courseCode) {
    var qInfo = await Question.find({course: courseCode}, {question: 1, choices:1, answer:1, _id: 0});
    return qInfo;
};
async function getTeacherCourses(username){
    const teacherInfo = await User.findOne({username},{courses:1, _id:0});
    return teacherInfo.courses
}
async function getStudentCourses(username){
    const studentInfo = await User.findOne({username},{courses:1, _id:0});
    return studentInfo.courses
}

// 2. Routes for all your EJS files
app.get('/', (req, res) => {
  res.render('login',{error:null});
});

app.get('/login', (req, res) => {
  if (req.session.user){
    return res.redirect(req.session.user.role === 'teacher' ? '/teacher' : '/student');
  }
  res.render('login',{error: null});
});

app.post('/login',async(req,res) => {
    const {username, password} = req.body;
    const user = await User.findOne({username, password});
    if(user){
        //Login successful: write to session
      req.session.user = {username: user.username, role: user.role, course: user.courses};
      if (user.role == 'teacher'){
          res.redirect('/teacher')
      }else{
          res.redirect('/student');
      }
      }else{
        //Login failed
        const errorMsg = "Wrong username or password, please try again."
        res.render('login',{error:errorMsg})
    }
})

//Logout
app.get('/logout',(req,res)=> {
    req.session.destroy((err)=> {
        if (err) console.log(err);
        res.redirect('/login')
    });
});

//Function to Seperate courses

//Student home page
app.get('/student', isLoggedin, async(req,res) => {
    if (req.session.user.role !== 'student') return res.redirect('/login');
    const studentCourse = await getStudentCourses(req.session.user.username);
    res.render('student',{user: req.session.user.username, studentCourse});
});

//Teacher home page
app.get('/teacher', isLoggedin, (req,res) => {
    if (req.session.user.role !== 'teacher') return res.redirect('/login');
    res.render('teacher',{user:req.session.user.username});
});

//Function to calculate student's assignment score
function calculateScore(userAns,questInfo) {
  let userScore = 0;
  questInfo.forEach((quest, idx) => {
    if (userAns[idx] === quest.answer){
      userScore++;
    }
  })
  const userGrade = Math.round((userScore/questInfo.length)*100).toFixed(2)
  return userGrade
}

//Assignment page -course 1080
app.get('/assignment/1080', isLoggedin, async(req, res) => {
  const questions = await getQuestionInfo('1080');
  const studentCourse = await getStudentCourses(req.session.user.username);
  res.render('assignment',{course: '1080', questions,user: req.session.user.username, studentCourse});
});

app.post('/assignment/1080',isLoggedin, async(req,res)=> {
  const returnAns = req.body.choice;
  const questionInfo = await getQuestionInfo('1080');
  const studentGrade = String(calculateScore(returnAns, questionInfo));
  await User.updateOne({username: req.session.user.username},{$set:{'score.1080':studentGrade}})
  res.redirect('/student')
})

//Assignment page -course 2620
app.get('/assignment/2620', isLoggedin, async(req, res) => {
  const questions = await getQuestionInfo('2620');
  const studentCourse = await getStudentCourses(req.session.user.username);
  res.render('assignment',{course: '2620', questions,user: req.session.user.username, studentCourse});
});

app.post('/assignment/2620',isLoggedin, async(req,res)=> {
  const returnAns = req.body.choice;
  const questionInfo = await getQuestionInfo('2620');
  const studentGrade = String(calculateScore(returnAns, questionInfo));
  await User.updateOne({username: req.session.user.username},{$set:{'score.2620':studentGrade}})
  res.redirect('/student')
})

//Assignment page -course 2660
app.get('/assignment/2660', isLoggedin, async(req, res) => {
  const questions = await getQuestionInfo('2660');
  const studentCourse = await getStudentCourses(req.session.user.username);
  res.render('assignment',{course: '2660', questions,user: req.session.user.username, studentCourse});
});

app.post('/assignment/2660',isLoggedin, async(req,res)=> {
  const returnAns = req.body.choice;
  const questionInfo = await getQuestionInfo('2660');
  const studentGrade = String(calculateScore(returnAns, questionInfo));
  await User.updateOne({username: req.session.user.username},{$set:{'score.2660':studentGrade}})
  res.redirect('/student')
})

//For students to check their grades
app.get('/checkMyGrades', isLoggedin, async(req,res)=>{
    const selfInfo = await User.findOne({username: req.session.user.username},{courses:1, score:1,_id:0});
    const selfCourse = selfInfo.courses
    const selfScore = selfInfo.score
  //console.log(selfScore)
  res.render('myGrades',{user:req.session.user.username,selfScore, selfCourse})
})

//Edit course for students
app.get('/Adds', isLoggedin, async(req, res) => {
  if (req.session.user.role !== 'teacher') return res.redirect('/login');
  const teacherCourse = await getTeacherCourses(req.session.user.username)
  res.render('Adds',{user:req.session.user.username, teacherCourse}); // Matches "Adds.ejs" in your view folder
});

app.post('/Adds', isLoggedin, async(req,res) =>{
  const {username,course,score} = req.body;
  const studentName = await User.findOne({username});
  const courseEnrolled = Array.isArray(studentName.courses) && studentName.courses.includes(course);
  //Wrong student name
  if(!studentName){
    res.status(404).send('Student not found')
    res.redirect('/teacher')
  } else{
    if(courseEnrolled){
      //Update exsisted course grade
      await User.updateOne({username},{$set:{[`score.${course}`]:score}})
    }else{
      //Enroll course for student
      await User.updateOne({username},{$addToSet:{courses:course}, $set: {[`score.${course}`]:score}});
    }
  return res.redirect('/teacher')}
})

//Showing student's grade
app.get('/grade', isLoggedin, async(req,res) =>{
  if (req.session.user.role !== 'teacher') return res.redirect('/login');
  const teacherCourse = await getTeacherCourses(req.session.user.username)
  res.render('Grades',{user:req.session.user.username, teacherCourse, studentList:[]})
})

app.post('/grade',isLoggedin, async(req,res)=>{
  const {course} = req.body;
  const teacherCourse = await getTeacherCourses(req.session.user.username)
  const studentList = await User.find({role:"student",courses:course},{username:1,score :1, _id:0});
  res.render('Grades',{studentList,course,user:req.session.user.username, teacherCourse})
})

//Remove student from course
app.get('/delete', isLoggedin, async(req, res) => {
  if (req.session.user.role !== 'teacher') return res.redirect('/login');
  const teacherCourse = await getTeacherCourses(req.session.user.username)
  res.render('delete',{user:req.session.user.username, teacherCourse});
});

app.post('/delete', isLoggedin, async(req,res) =>{
  const {username,course} = req.body;
  const studentName = await User.findOne({username});
  const courseEnrolled = Array.isArray(studentName.courses) && studentName.courses.includes(course);
  //Wrong student name
  if(!studentName){
    res.status(404).send('Student not found')
    //res.redirect('/teacher')
  } else{
    if(courseEnrolled){
      //Delete exsisted course grade
      await User.updateOne({username},{$pull:{courses:course}, $unset: {'score.course' :''}})
    }else{
      //Enroll course for student
      res.status(404).send('Student not found')
    }
  return res.redirect('/teacher')}
})

app.get('/addNewQuestion',isLoggedin,async(req,res) =>{
  if (req.session.user.role !== 'teacher') return res.redirect('/login');
  const teacherCourse = await getTeacherCourses(req.session.user.username)
  res.render('addNewQuestion',{user:req.session.user.username, teacherCourse});
})

app.post('/addNewQuestion',isLoggedin,async(req,res)=>{
  const{course,question,choices,answer} = req.body;
  const newQuestion = new Question({course:course, question:question,choices:choices,answer:answer});
  await newQuestion.save();
  console.log(newQuestion);
  res.redirect('/teacher');
})

//To read all questions in the collection
app.get('/viewQuestion',isLoggedin,async(req,res)=>{
  if (req.session.user.role !== 'teacher') return res.redirect('/login');
  const teacherCourse = await getTeacherCourses(req.session.user.username)
  res.render('viewQuestion',{user:req.session.user.username, teacherCourse, questionList:[]});
})

app.post('/viewQuestion',isLoggedin, async(req,res)=>{
  const {course} = req.body;
  const teacherCourse = await getTeacherCourses(req.session.user.username)
  const questionList = await getQuestionInfo(course)
  res.render('viewQuestion',{questionList,course,user:req.session.user.username, teacherCourse})
})

//To delete a question from the collection
app.post('/deleteQuestion',isLoggedin,async(req,res)=>{
  await Question.deleteOne({question:req.body.question});
  res.redirect('/viewQuestion')
})

//To update exsisting questions in the collection
app.get('/editQuestion',isLoggedin,async(req,res)=>{
  if (req.session.user.role !== 'teacher') return res.redirect('/login');
  const teacherCourse = await getTeacherCourses(req.session.user.username)
  res.render('editQuestion',{user:req.session.user.username, teacherCourse, questionList:[]});
})

app.post('/editQuestion',isLoggedin,async(req,res)=>{
  const {course} = req.body;
  const teacherCourse = await getTeacherCourses(req.session.user.username)
  const questionList = await getQuestionInfo(req.body.course)
  res.render('editQuestion',{questionList,course,user:req.session.user.username, teacherCourse})
})

app.post('/updatedQuestion',isLoggedin,async(req,res)=>{
  for (let i = 0, j = 4, h = 0; h < req.body.question.length; i+=4,j+=4,h++){
    if(req.body.question[h]){
    await Question.updateOne({question:req.body.originalQuest[h]},{$set:{question:req.body.question[h],choices:req.body.choice.slice(i,j),answer: req.body.answer[h]}});
  }}
  res.redirect('/editQuestion')
})

// Handle API errors
function handleApiError(res, err) {
  console.error(err);

  res.status(500).json({
    error: 'Server error'
  });
}


// ----------------------------STUDENT API-----------------------------


// GET: Read all students / Search students
//curl http://localhost:3000/api/students
//curl "http://localhost:3000/api/students?username=Maxxxx"
//curl "http://localhost:3000/api/students?role=student"
//curl "http://localhost:3000/api/students?courses=2620"
//curl "http://localhost:3000/api/students?score=80"

app.get('/api/students', async (req, res) => {
  try {
    const filter = {};

    if (req.query.username) {
      filter.username = new RegExp(req.query.username, 'i');
    }

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.courses) {
      filter.courses = req.query.courses;
    }

    if (req.query.score && req.body.cources) {
      filter[`score.${req.query.courses}`] = req.query.score;
    }

    const students = await User.find(filter);
    res.json(students);
  } catch (err) {
    handleApiError(res, err);
  }
});

// GET: Read one student
//curl http://localhost:3000/api/students/Maxxxx
app.get('/api/students/:username', async (req, res) => {
  try {
    const student = await User.findOne({
      username: req.params.username
    });

    if (!student) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    res.json(student);
  } catch (err) {
    handleApiError(res, err);
  }
});

// POST: Create student 
//curl -X POST http://localhost:3000/api/students \
//-H "Content-Type: application/json" \
//-d '{
  //"username": "Mary ",
 // "role": "student",
 // "password": "88888888",
  //"courses": ["2660","1080"],
 // "score": {"2660": "80","1080":"No grading"}
//}'

app.post('/api/students', async (req, res) => {
  try {
    const student = await User.create({
      username: req.body.username,
      role: req.body.role,
      password: req.body.password,
      courses: req.body.courses,
      score: req.body.score 
    });

    res.status(201).json({
      message: 'Student created',
      data: student
    });
  } catch (err) {
    handleApiError(res, err);
  }
});

// PUT: Update student password
//curl -X PUT http://localhost:3000/api/students/username \
//-H "Content-Type: application/json" \
//-d '{
 // "username": "Mary Updated",
  //"password": "88888888",
  //"score": {"1080": "90"}
//}'
  

app.put('/api/students/:username', async (req, res) => {
  try {
    const allowedFields = [
      'username',
      'password',
      'score'
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Provide at least one field to update.'
      });
    }

    const student = await User.findOneAndUpdate(
      { username: req.params.username },
      updateData,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    res.json({
      message: 'Student updated',
      data: student
    });
  } catch (err) {
    handleApiError(res, err);
  }
});

// DELETE: Delete student
//curl -X DELETE http://localhost:3000/api/students/S001
app.delete('/api/students/:username', async (req, res) => {
  try {
    const result = await User.deleteOne({
      username: req.params.username
    });

    if (!result.deletedCount) {
      return res.status(404).json({
        error: 'Student not found'
      });
    }

    res.json({
      message: 'Student deleted'
    });
  } catch (err) {
    handleApiError(res, err);
  }
});


// -----------------------------Question API---------------------------


// GET: Read all courses 
//curl http://localhost:3000/api/courses
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await Question.find();
    res.json(courses);
  } catch (err) {
    handleApiError(res, err);
  }
});

// POST: Create course question
//curl -X POST http://localhost:3000/api/courses \
//-H "Content-Type: application/json" \
//-d '{
  //"course": "2660",
 // "question": "Which of the LMC instruction is the best describe if the LMC machine code is 301?",
 // "choices": ["BRA 01", "LDA 01", "STO 01", "None of the other choices"],
 //"answer": "STO 01"
//}'
  
app.post('/api/courses', async (req, res) => {
  try {
    const course = await Question.create({
      course: req.body.course,
      question: req.body.question,
      choices: req.body.choices,
      answer: req.body.answer
    });

    res.status(201).json({
      message: 'Course created',
      data: course
    });
  } catch (err) {
    handleApiError(res, err);
  }
});

//Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
