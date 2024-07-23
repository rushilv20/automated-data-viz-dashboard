const express = require('express');
const app = express();
const dataRoutes = require('./routes/dataRoutes');

const port = 3000;

app.use('/api', dataRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
