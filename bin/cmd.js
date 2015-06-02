#!/usr/bin/env node

'use strict';

var program = require('commander'),
    http = require('http'),
    colors = require('colors'),
    connect = require('connect'),
    request = require('request'),
    merge = require('merge');

program
  .version('0.3.0')
  .option('-e, --endpoint <s>', 'Remote API endpoint (full URL, required)', String)
  .option('-p, --port [n]', 'Port to listen on (default: 8090)', parseInt)
  .option('-h, --headers [f]', 'JSON file containing additional headers send to the server', String)
  .option('-o, --origin <s>', 'Origin to allow in access-control-allow-origin header (default: *)')
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
  'access-control-allow-origin': program.origin || '*',
  'access-control-allow-headers': 'Authorization, Content-Type, If-None-Match,' +
    'X-Requested-With, Cache-Control, Content-Type, Content-Range, Content-Disposition' +
    'Content-Description, withCredentials',
  'access-control-allow-methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
  'access-control-allow-credentials': 'true',
};

var app = connect();

if (!program.endpoint || !program.endpoint.match(/^https?\:\/\//)) {
  return out.fatal('Please define a valid API endpoint (starting with http(s))');
}
program.port = program.port || 8090;

var headers;

if (program.headers) {
  try {
    headers = require('./' + program.headers);
  } catch (e) {
    return out.fatal('Could not read file ' + program.headers + '. Is it proper JSON?');
  }
} else {
  headers = {};
}

app.use(function(req, res){

  delete req.headers['host'];

  merge(headers, req.headers);

  var options = {
    url: program.endpoint + req.url,
    method: req.method,
    headers: headers
  };

  req.pipe(request(options)).on('response', function (response) {

    merge(response.headers, corsHeaders);

    if (response.headers && response.headers['set-cookie'] && response.headers['set-cookie'][0]) {
      response.headers['set-cookie'][0] = response.headers['set-cookie'][0].replace(/Path.+?;/, '');
    }

    res.writeHead(response.statusCode, response.headers);

    response.pipe(res);
  });

});

app.on('err', function (err) {
  console.log(err);
});

//create node.js http server and listen on port
http.createServer(app).listen(program.port, function () {
  out.info('opel is listening for connections on port ' + program.port);
});
