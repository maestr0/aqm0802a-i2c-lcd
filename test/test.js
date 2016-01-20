var proxyquire = require('proxyquire');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var debug = require('debug')('lcd:test');
var EventEmitter = require('events').EventEmitter;

var i2cStub = {};
var Lcd = proxyquire('../lib/lcd.js', {'i2cd': i2cStub});

//TODO: these tests are really more a listing of how the
//      driver is expected to be used. 
//      the driver should be rewritten to use promises.
describe('Lcd', function() {
  describe('constructor', function() {
    it('should complain if we do not pass in a config', function(){
      expect(function() {
        var lcd = new Lcd();
      }).to.throw('Empty or no configuration passed in to constructor');
    });

   it('should return an object of type Lcd if passed in a correct config', function(){
        //the default address and bus for the display
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

  it('should write a string from the current cursor location', function(done) {
    lcd.print("Hello!", function() {
      done();
    });
  });

  it('should clear the display when clearscr is called', function(done) {
    //TODO - this just sends a 0x01 byte to the display - there is really nothing to test here 
    //       this whole thing should be rewritten to use promises
    lcd.clrscr(function() { 
      done(); 
    });
  });
});
