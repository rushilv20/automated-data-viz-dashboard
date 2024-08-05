/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/


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

module.exports = app;
