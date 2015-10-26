var I2C = require('i2c');
var wire = null;
var verror = require('verror');
var debug = require('debug')('lcd');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

/*
 * Lcd - creates an Lcd object with the specified attributes
 * @params i2cdevice - a string representation of the i2c device. For example - "/dev/i2c-1"
 * @params displayAddress - a numeric representation of the LCD address on the i2c bus. For example - 0x3e
 * @params config - a configuration object that specifies various properties of the LCD display to be set up during initialization
 *  {
      cursorDisplay:  true or false,
      cursorBlink:    true or false,
      leftToRight:    true or false,
      screenShift:    true or false,
      largeFont:      true or false, 
    }
 */
function Lcd(i2cdevice, displayAddress, config) {

  //if accidentally invoked without new, ensure that
  //this does not point to the global object by explicitly
  //calling ourselves as a constructor with new
  if(!this instanceof(Lcd)) {
    return new Lcd(i2cdevice, displayAddress, config);
  }

  if(!i2cdevice || !displayAddress) {
    throw new Error('Empty or no configuration passed in to constructor');
  }
  
  this.i2cdevice      = i2cdevice;
  this.displayAddress = displayAddress;

  this.wire = new I2C(displayAddress, { device: i2cdevice });
}
util.inherits(Lcd, EventEmitter);


Lcd.prototype.init = function init() {
  var self = this;
  //Scan the i2c bus to ensure that the specified display
  //address is found on the bus, and the bus is usable 
  try {
    this.wire.scan(function(err, addressesOnBus) {
      if(err) {
        debug("We got an error when doing a wire scan: " + err);
        self.emit('error', 'We got an error when scanning the i2c bus'+ err);
        return;
      }

      if(addressesOnBus.indexOf(self.displayAddress) == -1) {
        debug("Address: " + self.displayAddress + " not found on the i2c bus");
        self.emit('error', 'Address not found');
        return;
      }

      //device found - now initialize the LCD display
      //the 0x0e refers to the cursor display
      self.wire.write([0x38,0x39,0x14,0x70,0x56,0x6c,0x38,0x0e,0x01], function(err) {
          if(err) {
            console.log(err);
            self.emit('error', err);
          }
          
          //init succeeded - emit ready
          self.emit('ready');
      });
    });
  } catch (e) {
    debug("We caught: " + e);
    var initError = new verror.WError(e, 'i2c bus specified is unusable. Address: %s Bus: %s', this.displayAddress, this.i2cdevice);
    self.emit('error', initError);
    return;
  }
};

/*
 * setCursorPosition - moves the cursor to the specified location
 * @param row - should be an integer between 0 and 7
 * @param col - should be either 0 for the first row or 1 for the second row
 */
Lcd.prototype.setCursorPosition = function setCursorPosition(row, col) {
  var self = this;
  row_offsets = [0x00, 0x40];
  command = 0x80 | (col + row_offsets[row]);
  debug("Sending command - " + command.toString(16));
  self.wire.write([0x00, command], function(err) {
    self.emit('WRITTEN'); 
  });
};

/* 
 * turnOff - turn display off. note: ddram contents stay the same
 * so, if the display is turned on again, the contents will be shown.
 */
Lcd.prototype.turnOff = function turnOff() {
  var self = this;
  //TODO: move constants outside, and write logic for generating 
  //function set instructions by bitwise OR'ing user-understandable terms 
  var CMD_FUNCTION_SET_NORMAL_INSTRUCTION = 0x38;
  var CMD_FUNCTION_SET_EXTENSION_INSTRUCTION = 0x39;
  var CMD_DISPLAY_OFF = 0x08; 
  self.wire.write([0x00, CMD_FUNCTION_SET_NORMAL_INSTRUCTION, CMD_DISPLAY_OFF], function(err) {
    self.emit('TURNED_OFF');
  }); 
};

/* 
 * print - prints the given string from the current cursor position
 * string should be less than 80 characters
 */
Lcd.prototype.print = function print(str, cb) {
  var self = this;
  for(var i = 0; i < str.length; i++) {
    self.wire.write([0x40, str.charCodeAt(i)], function(err) {
      if(err) {
        cb(err);
      }
    }); 
  }
  cb();
}

module.exports = Lcd;
