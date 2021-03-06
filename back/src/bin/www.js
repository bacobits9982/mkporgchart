#!/usr/bin/env node
/* eslint-disable no-console */

import debug from 'debug';
import http from 'http';
import app from '../app';

const createPort = (port = 8000) => {
  if (process.env.NODE_ENV === 'test') {
    return 3000;
  }
  return port;
};

const PORT = createPort(process.env.PORT);

const onError = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(`Port ${PORT} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`Port ${PORT} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

const server = http.createServer(app);
const log = debug('server');  // eslint-disable-line
server.listen(PORT, () => log(`Server listening in port ${PORT}`));
server.on('error', onError);
