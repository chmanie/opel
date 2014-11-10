#!/usr/bin/env node

/*
TODO:
- provide option to just show available projects
- get rid of -c option as customerId it is available in a project. get project first then add hours

*/


'use strict';

var program = require('commander'),
    http = require('http'),
    colors = require('colors'),
    connect = require('connect'),
    request = require('request'),
    cors = require('connect-cors');

program
  .version('0.1.0')
  .option('-e, --endpoint <n>', 'Remote API endpoint (full URL)', String)
  .option('-p, --port <n>', 'Port to listen on', parseInt)
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

if (!program.endpoint || !program.endpoint.match(/^https?\:\/\//)) return out.fatal('Please define a valid API endpoint');
program.port = program.port || 3000;

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
