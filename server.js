var http = require('http');
var url = require('url');
var fs = require('fs');
var querystring = require('querystring');

http.createServer(function(request, response) {
  var method = request.method.toUpperCase();
  var pathname = url.parse(request.url).pathname;
  var ext = pathname.match(/(\.[^.]+|)$/)[0];
  var time = new Date();

  time = time.toString();
  time = time.slice(0, time.indexOf('GMT')).trim();
  console.log('>' + time + ': ' + method + ' ' + request.url);
  
  switch (method) {
    case 'GET':
      switch(ext) {
        case '.css':
        case '.js':
        case '.json':
          fs.readFile('.' + pathname, 'utf-8', function(err, data) {
            if (err) throw err;
            response.writeHead(200, {
              'Content-Type': {'.css': 'text/css', 
                               '.js': 'application/javascript',
                               '.json': 'application/json'
                              }[ext]
            });
            response.write(data);
            response.end();
          });
          break;
        default:
          fs.readFile('./index.html', 'utf-8', function(err, data) {
            if (err) throw err;
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(data);
            response.end();
          });
      }
      break;  // endof 'GET'

    case 'POST':
      var tarId = -1;
      var postData = '';

      request.on('data', function(chunk) {
        postData += chunk;
      });

      request.on('end', function() {
        //postData = querystring.parse(postData);
        tarId = +postData;
      });

      // update the data file
      if (ext !== '.json') {
        console.log('Extension of file is ' + ext + ' while .json is expected.');
        return;
      }
      var dataJson;
      fs.readFile('.' + pathname, 'utf-8', function(err, data) {
        if (err) throw err;
        var dataJson = JSON.parse(data);

        for (var i = 0, len = dataJson.length; i < len; i++) {
          if (dataJson[i].id == tarId) {
            dataJson.splice(i, 1);
            break;
          }
        }
        fs.writeFile('.' + pathname, JSON.stringify(dataJson), function(err) {
          if (err) throw err;
          console.log('> .' + pathname + ' got updated on server.');
        });
        response.write(JSON.stringify(dataJson));
        response.end();
      });

      break;  // endof 'POST'

    default:
      console.log('Unresolved method: ' + method);
  }

}).listen(8888);
console.log('>server running at localhost:8888');
