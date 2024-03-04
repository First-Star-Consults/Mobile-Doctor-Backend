import serverless from 'serverless-http';
import app from '../../server.js'; // Adjust the path as necessary

export const handler = serverless(app);
