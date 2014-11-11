#!/usr/bin/env node

'use strict';

var program = require('commander'),
    http = require('http'),
    colors = require('colors'),
    connect = require('connect'),
    request = require('request'),
    merge = require('merge');

program
  .version('0.2.0')
  .option('-e, --endpoint <s>', 'Remote API endpoint (full URL, required)', String)
  .option('-p, --port [n]', 'Port to listen on (default: 8090)', parseInt)
  .option('-h, --headers [f]', 'JSON file containing additional headers send to the server', String)
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

var corsHeaders = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Authorization, Content-Type, If-None-Match,' +
    'X-Requested-With, Cache-Control, Content-Type, Content-Range, Content-Disposition' +
    'Content-Description',
  'access-control-allow-methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS'
};

var app = connect();

if (!program.endpoint || !program.endpoint.match(/^https?\:\/\//)) {
  return out.fatal('Please define a valid API endpoint (starting with http(s))');
}
program.port = program.port || 8090;

if (program.headers) {
  var headers;
  try {
    headers = require('./' + program.headers);
  } catch (e) {
    return out.fatal('Could not read file ' + program.headers + '. Is it proper JSON?');
  }
}

app.use(function(req, res){

  merge(program.headers, req.headers);

  var options = {
    url: program.endpoint + req.url,
    method: req.method,
    headers: headers || {}
  };

  req.pipe(request(options)).on('response', function (response) {

    merge(response.headers, corsHeaders);

    res.writeHead(response.statusCode, response.headers);

    response.pipe(res);
  });

});


//create node.js http server and listen on port
http.createServer(app).listen(program.port, function () {
  out.info('opel is listening for connections on port ' + program.port);
});
