const express = require('express');
const cors = require('cors'); // Import cors
const app = express();
const dataRoutes = require('./routes/dashboard');

const corsOptions = {
    origin: 'https://dashboard.d15p3i91pmeilq.amplifyapp.com/', // Update this with your Amplify app domain
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', dataRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
