const express = require('express');
const cors = require('cors'); // Import cors
const app = express();
const dataRoutes = require('./routes/dashboard');

app.use(cors()); // Use cors middleware to handle CORS headers
app.use(express.json());
app.use('/api', dataRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
