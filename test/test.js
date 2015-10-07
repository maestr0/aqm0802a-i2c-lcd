var proxyquire = require('proxyquire');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var debug = require('debug')('lcd:test');
var EventEmitter = require('events').EventEmitter;

var i2cStub = {};
var Lcd = proxyquire('../lib/lcd.js', {'i2cd': i2cStub});

describe('Lcd', function() {
  describe('constructor', function() {
    it('should complain if we do not pass in a config', function(){
      expect(function() {
        var lcd = new Lcd();
      }).to.throw('Empty or no configuration passed in to constructor');
    });

   it('should return an object of type Lcd if passed in a correct config', function(){
        var lcd = new Lcd('/dev/i2c-1', 0x3e);
        expect(lcd).to.be.an.instanceof(Lcd);
        expect(lcd).to.be.an.instanceof(EventEmitter);
    });
  });

  describe('initialization', function(done) {
    it('should complain if the i2c slave address corresponding to the display could not be detected', function(){
      var lcd = new Lcd('/dev/i2c-1', 0x0F);
      lcd.once('error', function(err) {
        expect(err).to.equal('Address not found');
        done();
      });
      lcd.init();
    }); 

    it('should complain if the i2c device specified could not be used', function(done){
        var lcd = new Lcd('/dev/i2c-500', 0x3e);
        lcd.once('error', function(err) {
          debug('error is - ' + err.toString());
          expect(err.toString()).to.include('i2c bus specified is unusable');
          done();
        });
        lcd.init();
    }); 

    it('should emit a ready event once the display is initialized', function(done) {
        var lcd = new Lcd('/dev/i2c-1', 0x3e);
        lcd.on('ready', function(){
          done();
        });
        lcd.init();
    });

  });
});

describe('Lcd writing and cursor tests', function(){
  var lcd;
  before(function(done) {
        lcd = new Lcd('/dev/i2c-1', 0x3e);
        lcd.on('ready', function() {
          done();
        });
        lcd.init();
  });

  it('should move the cursor to the specified location', function(done) {
    lcd.setCursorPosition(1, 3);
    done();
  });
});
