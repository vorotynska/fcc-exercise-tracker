const express = require('express')
const app = express()
const mongoose = require("mongoose");
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  }
});

const User = mongoose.model("User", UserSchema)

const ExerciseBaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now()
  }
});

const ExerciseBase = mongoose.model("ExerciseBase", ExerciseBaseSchema)

app.post("/api/users", async (request, response) => {
  const user = new User(request.body);

  try {
    await user.save();
    response.send(user);
  } catch (error) {
    response.status(500).send(error);
  }
});

app.get("/api/users", async (request, response) => {
  const users = await User.find({});

  try {
    response.send(users);
  } catch (error) {
    response.status(500).send(error);
  }
});

app.post('/api/users/:_id/exercises', async (request, response) => {
  try {
    const userId = request.params._id;
    const findUser = await User.findById(userId).exec();

    if (!findUser) {
      return response.status(404).send('User not found');
    }

    const exercise = new ExerciseBase({
      userId: userId,
      description: request.body.description,
      duration: request.body.duration,
      date: request.body.date || new Date()
    });

    await exercise.save();

    response.json({
      _id: findUser._id,
      username: findUser.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
});


app.get('/api/users/:_id/logs', async (request, response) => {
  const {
    from,
    to,
    limit
  } = request.query;
  const id = request.params._id;

  try {
    const user = await User.findById(id);

    if (!user) {
      return response.status(404).send('User not found');
    }

    const query = {
      userId: id
    };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    let exercisesQuery = ExerciseBase.find(query);

    if (limit) {
      exercisesQuery = exercisesQuery.limit(+limit);
    }

    const exercises = await exercisesQuery.exec();

    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

    response.send({
      username: user.username,
      count: exercises.length,
      _id: id,
      log
    });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
});


/*app.post('/api/users/:_id/exercises', async (request, response) => {
  try {
    const userId = request.params._id;
    const findUser = await User.findById(userId).exec();

    if (!findUser) {
      return response.status(404).send('User not found');
    }

    const exercise = new ExerciseBase({
      userId: userId,
      description: request.body.description,
      duration: request.body.duration,
      date: request.body.date || new Date()
    });

    await exercise.save();

    response.json({
      _id: exercise._id,
      username: findUser.username,
      description: exercise.description,
      duration: exercise.duration,
      date: new Date(exercise.date).toDateString()
    });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
});

app.get('/api/users/:_id/logs', async (request, response) => {
  const {
    from,
    to,
    limit
  } = request.query;
  const id = request.params._id;

  try {
    const user = await User.findById(id);

    if (!user) {
      return response.status(404).send('User not found');
    }

    const query = {
      userId: id
    };

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(from);
      if (to) query.date.$lte = new Date(to);
    }

    let exercisesQuery = ExerciseBase.find(query);

    if (limit) {
      exercisesQuery = exercisesQuery.limit(+limit);
    }

    const exercises = await exercisesQuery.exec();

    const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
    }));

    response.send({
      username: user.username,
      count: exercises.length,
      _id: id,
      log
    });
  } catch (error) {
    console.error(error);
    response.status(500).send('Internal Server Error');
  }
});*/

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})