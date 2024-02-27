const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const app = express();
const port = 8080;

app.use(express.json());

// Enable CORS → Cross-Origin Resource Sharing (CORS) issue: If the client and server are running on different domains or ports, you might encounter a CORS issue. This occurs when the browser blocks requests from a different origin for security reasons. To resolve this, you need to enable CORS on the server-side by adding appropriate headers to the server's response. You can use the cors package in Express to simplify this process.
app.use(cors({
  origin: 'https://mis-final-project-webgl-three-frontend.onrender.com'
}));

// Set the path to the .env file
dotenv.config({ path: './server/.env' });

// Server API endpoints
app.get('/api/key', (req, res) => {
  // Validate the client's request here if needed

  const apiKey = process.env.API_KEY;
  res.json({ apiKey });
});

// Serve static files for the client application
app.use(express.static('client'));

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});