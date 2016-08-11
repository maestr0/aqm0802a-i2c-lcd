var Lcd = require('./lib/lcd.js');

var l = new Lcd('/dev/i2c-1', 0x3e);

l.clrscr(function(){});
l.setCursorPosition(0, 0);

l.print('hello world', function(){
	console.log('printed');
});