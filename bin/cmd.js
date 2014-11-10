#!/usr/bin/env node

'use strict';

var program = require('commander'),
    http = require('http'),
    colors = require('colors'),
    connect = require('connect'),
    request = require('request'),
    cors = require('connect-cors');

program
  .version('0.1.1')
  .option('-e, --endpoint <n>', 'Remote API endpoint (full URL, required)', String)
  .option('-p, --port <n>', 'Port to listen on (default: 8090)', parseInt)
  .parse(process.argv);

colors.setTheme({
  success: 'green',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

var out = {
  fatal: function (errstr) {
    console.log('ERROR: '.error + errstr);
    process.exit(1);
  },
  error: function (errstr) {
    console.log('ERROR: '.error + errstr);
  },
  success: function (okstr) {
    console.log('SUCCESS: '.success + okstr);
  },
  info: function (infostr) {
    console.log(infostr);
  }
};

var app = connect();

if (!program.endpoint || !program.endpoint.match(/^https?\:\/\//)) return out.fatal('Please define a valid API endpoint (starting with http(s))');
program.port = program.port || 8090;

app.use(cors());

// respond to all requests
app.use(function(req, res){

  request(program.endpoint + req.url, function (err, response, body) {
    if (err) return res.end(err);
    return res.end(body);
  });

});

//create node.js http server and listen on port
http.createServer(app).listen(program.port);
