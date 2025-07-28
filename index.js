require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const Feedback = require('./models/Feedback');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('DB error:', err));

// Routes
app.get('/', (req, res) => res.redirect('/feedbacks'));

app.get('/submit', (req, res) => res.render('submit', { error: null, name: '', message: '' }));

app.post('/submit', async (req, res) => {
  const { name, message } = req.body;
  let error = null;
  if (!name || !message) error = 'Both name and message are required.';
  if (error) {
    return res.render('submit', { error, name, message });
  }
  try {
    const feedback = await Feedback.create({ name, message });
    res.redirect(`/feedback/${feedback._id}`);
  } catch (err) {
    console.error(err);
    res.render('submit', { error: 'Error saving feedback.', name, message });
  }
});

app.get('/feedbacks', async (req, res) => {
  const feedbacks = await Feedback.find().sort({ createdAt: -1 });
  res.render('all', { feedbacks });
});

app.get('/feedback/:id', async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).send('Not found');
    const shareUrl = `${req.protocol}://${req.headers.host}${req.originalUrl}`;
    res.render('single', { feedback: fb, shareUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
