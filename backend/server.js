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
        console.log("Origin:", origin); // Debug log to check the origin
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

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Mounting the dashboard routes at the base path /api
app.use('/api', dashboardRoutes);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
