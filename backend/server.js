const express = require('express');
const cors = require('cors');
const app = express();
const dashboardRoutes = require('./routes/dashboard');

const allowedOrigins = [
  'https://bellairdashboard.com',
  'https://www.bellairdashboard.com'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Mounting the dashboard routes at the base path /api
app.use('/api', dashboardRoutes);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
