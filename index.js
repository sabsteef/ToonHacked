/*
    "accessories": [
        {
            "accessory": "Thermostat",
            "name": "Toon Thermostaat",
            "apiroute": "http://yourToonIp",
            //optional
            "maxTemp": "26",
            "minTemp": "10",
        }
*/



var Service, Characteristic;
var request = require("request");

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-toonhacked", "Thermostat", Thermostat);
};


function Thermostat(log, config) {
	this.log = log;
	this.maxTemp = config.maxTemp || 26;
	this.minTemp = config.minTemp || 10;
	this.name = config.name;
	this.apiroute = config.apiroute || "apiroute";
	this.log(this.name, this.apiroute);
	this.username = config.username || null;
	this.password = config.password || null;
	
	if(this.username != null && this.password != null){
		this.auth = {
			user : this.username,
			pass : this.password
		};
	}

	//Characteristic.TemperatureDisplayUnits.CELSIUS = 0;
	//Characteristic.TemperatureDisplayUnits.FAHRENHEIT = 1;
	this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS;
	this.currentTemperature = 19;
	this.currentRelativeHumidity = 0;
	// The value property of CurrentHeatingCoolingState must be one of the following:
	//Characteristic.CurrentHeatingCoolingState.OFF = 0;
	//Characteristic.CurrentHeatingCoolingState.HEAT = 1;
	//Characteristic.CurrentHeatingCoolingState.COOL = 2;
	this.heatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
	this.targetTemperature = 21;
	this.targetRelativeHumidity = 0;
	this.heatingThresholdTemperature = 22;
	this.coolingThresholdTemperature = 16;
	// The value property of TargetHeatingCoolingState must be one of the following:
	//Characteristic.TargetHeatingCoolingState.OFF = 0;
	//Characteristic.TargetHeatingCoolingState.HEAT = 1;
	//Characteristic.TargetHeatingCoolingState.COOL = 2;
	//Characteristic.TargetHeatingCoolingState.AUTO = 3;
	this.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;

	this.service = new Service.Thermostat(this.name);

}

Thermostat.prototype = {
	//Start
	identify: function(callback) {
		this.log("Identify requested!");
		callback(null);
	},
	// Required
	getCurrentHeatingCoolingState: function(callback) { // Get burner info = 1 active, 0 disabled 
		this.log("getCurrentHeatingCoolingState from:", this.apiroute+"/happ_thermstat?action=getThermostatInfo");
		request.get({
			url: this.apiroute+"/happ_thermstat?action=getThermostatInfo",
			auth : this.auth
		}, function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				var json = JSON.parse(body); //{targetHeatingCoolingState":3,"currentHeatingCoolingState":0,"targetTemperature":10,"temperature":12,"humidity":98}
				this.log("currentHeatingCoolingState is %s", json.burnerInfo);
				this.currentHeatingCoolingState = json.burnerInfo;
				this.service.setCharacteristic(Characteristic.CurrentHeatingCoolingState, this.currentHeatingCoolingState);
				
				callback(null, this.currentHeatingCoolingState); // success
			} else {
				this.log("Error getting CurrentHeatingCoolingState: %s", err);
				callback(err);
			}
		}.bind(this));
	},
	getTargetHeatingCoolingState: function(callback) {
		this.log("getTargetHeatingCoolingState from:", this.apiroute+"/status");
		request.get({
			url: this.apiroute+"/status",
			auth : this.auth
		}, function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				var json = JSON.parse(body); //{"targetHeatingCoolingState":3,"currentHeatingCoolingState":0,"targetTemperature":10,"temperature":12,"humidity":98}
				this.log("TargetHeatingCoolingState received is %s", json.targetHeatingCoolingState, json.targetStateCode);
				this.targetHeatingCoolingState = json.targetHeatingCoolingState !== undefined? json.targetHeatingCoolingState : json.targetStateCode;
				this.log("TargetHeatingCoolingState is now %s", this.targetHeatingCoolingState);
				//this.service.setCharacteristic(Characteristic.TargetHeatingCoolingState, this.targetHeatingCoolingState);
				
				callback(null, this.targetHeatingCoolingState); // success
			} else {
				this.log("Error getting TargetHeatingCoolingState: %s", err);
				callback(err);
			}
		}.bind(this));
	},
	setTargetHeatingCoolingState: function(value, callback) {
		if(value === undefined) {
			callback(); //Some stuff call this without value doing shit with the rest
		} 
		else {/*
			this.log("setTargetHeatingCoolingState from/to:", this.targetHeatingCoolingState, value);
			
			request.get({
				url: this.apiroute + '/targetHeatingCoolingState/' + value,
				auth : this.auth
			}, function(err, response, body) {
				if (!err && response.statusCode == 200) {
					this.log("response success");
					//this.service.setCharacteristic(Characteristic.TargetHeatingCoolingState, value);
					this.targetHeatingCoolingState = value;
					callback(null); // success
				} else {
					this.log("Error getting state: %s", err);
					callback(err);
				}
			}.bind(this));*/
		callback();
		}
	},
	getCurrentTemperature: function(callback) {
		this.log("getCurrentTemperature from:", this.apiroute+"/happ_thermstat?action=getThermostatInfo");
		request.get({
			url: this.apiroute+"/happ_thermstat?action=getThermostatInfo",
			auth : this.auth
		}, 	    
			function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				var json = JSON.parse(body); //{targetHeatingCoolingState":3,"currentHeatingCoolingState":0,"temperature":"18.10","humidity":"34.10"}

				if (json.currentTemp != undefined) {
                                  this.log("CurrentTemperature %s", json.currentTemp);
				  var output = (parseFloat(json.currentTemp) / 100).toFixed(0);
                                  this.currentTemperature = output;
				  this.log("CurrentTemperature %s", output);
                                }
                                else {
                                  this.log("Temperature %s", json.temperature);
                                  this.currentTemperature = parseFloat(json.temperature);
                                }
								
				callback(null, this.currentTemperature); // success
			} else {
				this.log("Error getting state: %s", err);
				callback(err);
			}
		}.bind(this));
	},
	getTargetTemperature: function(callback) {
		this.log("getTargetTemperature from:", this.apiroute+"/happ_thermstat?action=getThermostatInfo");
		request.get({
			url: this.apiroute+"/happ_thermstat?action=getThermostatInfo",
			auth : this.auth
		}, function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				var json = JSON.parse(body); //{targetHeatingCoolingState":3,"currentHeatingCoolingState":0"temperature":"18.10","humidity":"34.10"}
				var output = (parseFloat(json.currentSetpoint) / 100).toFixed(0);
				this.targetTemperature = output;
				this.log("Target temperature is %s", this.targetTemperature);
				callback(null, this.targetTemperature); // success
			} else {
				this.log("Error getting state: %s", err);
				callback(err);
			}
		}.bind(this));
	},
	setTargetTemperature: function(value, callback) {
		this.log("setTargetTemperature from:", this.apiroute+"/happ_thermstat?action=setSetpoint&Setpoint="+value+"00");
		request.get({
			url: this.apiroute+"/happ_thermstat?action=setSetpoint&Setpoint="+value+"00",
			auth : this.auth
		}, function(err, response, body) {
			if (!err && response.statusCode == 200) {
				this.log("response success");
				callback(null); // success
			} else {
				this.log("Error getting state: %s", err);
				callback(err);
			}
		}.bind(this));
	},
	getTemperatureDisplayUnits: function(callback) {
		this.log("getTemperatureDisplayUnits:", this.temperatureDisplayUnits);
		var error = null;
		callback(error, this.temperatureDisplayUnits);
	},
	setTemperatureDisplayUnits: function(value, callback) {
		this.log("setTemperatureDisplayUnits from %s to %s", this.temperatureDisplayUnits, value);
		this.temperatureDisplayUnits = value;
		var error = null;
		callback(error);
	},

	// Optional
	getCurrentRelativeHumidity: function(callback) {
		this.log("getCurrentRelativeHumidity not implemented with API");
		this.currentRelativeHumidity = this.targetRelativeHumidity;
		var error = null;
		callback(error, this.currentRelativeHumidity);
	},
	getTargetRelativeHumidity: function(callback) {
		this.log("getTargetRelativeHumidity not implemented with API");
		var error = null;
		callback(error, this.targetRelativeHumidity);
	},
	setTargetRelativeHumidity: function(value, callback) { 
		this.log("setTargetRelativeHumidity not implemented with API");
		var error = null;
		callback(error, this.targetRelativeHumidity);
	},
/*	getCoolingThresholdTemperature: function(callback) {
		this.log("getCoolingThresholdTemperature: ", this.coolingThresholdTemperature);
		var error = null;
		callback(error, this.coolingThresholdTemperature);
	},
*/	getHeatingThresholdTemperature: function(callback) {
		this.log("getHeatingThresholdTemperature :" , this.heatingThresholdTemperature);
		var error = null;
		callback(error, this.heatingThresholdTemperature);
	},
	getName: function(callback) {
		this.log("getName :", this.name);
		var error = null;
		callback(error, this.name);
	},

	getServices: function() {

		// you can OPTIONALLY create an information service if you wish to override
		// the default values for things like serial number, model, etc.
		var informationService = new Service.AccessoryInformation();

		informationService
			.setCharacteristic(Characteristic.Manufacturer, "Eneco")
			.setCharacteristic(Characteristic.Model, "Toon")
			.setCharacteristic(Characteristic.SerialNumber, "not saying ;-)");

		

		// Required Characteristics
		this.service
			.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.on('get', this.getCurrentHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.on('get', this.getTargetHeatingCoolingState.bind(this))
			.on('set', this.setTargetHeatingCoolingState.bind(this));

		this.service
			.getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', this.getCurrentTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetTemperature)
			.on('get', this.getTargetTemperature.bind(this))
			.on('set', this.setTargetTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.TemperatureDisplayUnits)
			.on('get', this.getTemperatureDisplayUnits.bind(this))
			.on('set', this.setTemperatureDisplayUnits.bind(this));

		// Optional Characteristics
		this.service
			.getCharacteristic(Characteristic.CurrentRelativeHumidity)
			.on('get', this.getCurrentRelativeHumidity.bind(this));

		this.service
			.getCharacteristic(Characteristic.TargetRelativeHumidity)
			.on('get', this.getTargetRelativeHumidity.bind(this))
			.on('set', this.setTargetRelativeHumidity.bind(this));
		/*
		this.service
			.getCharacteristic(Characteristic.CoolingThresholdTemperature)
			.on('get', this.getCoolingThresholdTemperature.bind(this));
		*/

		this.service
			.getCharacteristic(Characteristic.HeatingThresholdTemperature)
			.on('get', this.getHeatingThresholdTemperature.bind(this));

		this.service
			.getCharacteristic(Characteristic.Name)
			.on('get', this.getName.bind(this));
		this.service.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({
				minValue: this.minTemp,
				maxValue: this.maxTemp,
				minStep: 1
			});
		this.service.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({
				minValue: this.minTemp,
				maxValue: this.maxTemp,
				minStep: 1
			});
		this.log(this.minTemp);
		return [informationService, this.service];
	}
};
