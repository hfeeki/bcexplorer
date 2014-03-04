/*
	Copyright 2013-2014, JUMA Technology

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/
var services= [];
var app = {

    // Application Constructor
    initialize: function() {
        app.bindCordovaEvents();
        app.bindUIEvents();
    },
    
    bindCordovaEvents: function() {
        document.addEventListener('bcready', app.onBCReady, false);
		document.addEventListener('deviceconnected', app.onDeviceConnected, false);
		document.addEventListener('devicedisconnected', app.onBluetoothDisconnect, false);
		document.addEventListener('newdevice', app.addNewDevice, false);
		document.addEventListener('bluetoothstatechange', app.onBluetoothStateChange, false);
    },
    
	onDeviceConnected : function(arg){
		var deviceID = arg.deviceID;
		//alert("device:"+deviceID+" is connected!");
	},
	
    bindUIEvents: function(){
    	$('#scanOnOff').change(app.startORstopScan); 
    },
    
    device_page: function(deviceID){
    	app.device = BC.bluetooth.devices[deviceID];
		BC.Bluetooth.StopScan();
		var scanOnOff = $("#scanOnOff");
		scanOnOff[0].selectedIndex = 0;
		scanOnOff.slider("refresh");
    	$.mobile.changePage("device_detail.html","slideup");
    },
    
    startORstopScan: function(){
		var state = $("#scanOnOff").val();
		if(state == 1){
			BC.Bluetooth.StartScan();
		}else if(state == 0){
			BC.Bluetooth.StopScan();
		}
    },
    
    onBCReady: function() {
		if(!BC.bluetooth.isopen){
			if(API !== "ios"){
				BC.Bluetooth.OpenBluetooth(function(){
					BC.Bluetooth.StartScan();
				});
			}else{					
				alert("Please open your bluetooth first.");
			}
		}else{
			BC.Bluetooth.StartScan();
		}
    },
	
	onBluetoothStateChange : function(){
		if(BC.bluetooth.isopen){
			alert("your bluetooth has been opened successfully.");
			var scanOnOff = $("#scanOnOff");
			scanOnOff[0].selectedIndex = 0;
			scanOnOff.slider("refresh");
		}else{
			alert("bluetooth is closed!");
			BC.Bluetooth.OpenBluetooth(function(){alert("opened!");});
		}
	},
	
	addNewDevice: function(arg){
		var deviceID = arg.deviceID;
		var viewObj	= $("#user_view");
		var liTplObj=$("#li_tpl").clone();
		var newDevice = BC.bluetooth.devices[deviceID];
		$("a",liTplObj).attr("onclick","app.device_page('"+newDevice.deviceID+"')");
		
		liTplObj.show();
		for(var key in newDevice){
			if(key == "isConnected"){
				if(newDevice.isConnected){
					$("[dbField='"+key+"']",liTplObj).html("YES");
				}
				$("[dbField='"+key+"']",liTplObj).html("NO");
			}else{
				$("[dbField='"+key+"']",liTplObj).html(newDevice[key]);
			}
		}	
			
		viewObj.append(liTplObj);
		viewObj.listview("refresh");
	},
	
	onBluetoothDisconnect: function(arg){
		alert("device:"+arg.deviceID+" is disconnected!");
		$.mobile.changePage("index.html","slideup");
	},
	
	onScanStartSuccess: function(list){
		//alert(list);
	},	
	
	onScanStopSuccess: function(result){
		alert(result.mes);
	},	
	
	onGeneralSuccess: function(result){
		alert(result.mes);
	},

    onGeneralError: function(message){
		alert(message.mes);
	},
	
	deviceViewInit: function(){
		$("#deviceName").html(app.device.deviceName);
		$("#deviceID").html(app.device.deviceID);
		var isconnect = app.device.isConnected;

		if(!isconnect){
			$("#connect").show();
		}else{
			$("#device_operation").show();
			$("#disconnect").show();
			app.fillServices();
		}
			
		//bind events
		$("#connect").click(app.connectDevice);
		$("#disconnect").click(app.disconnectDevice);
	},
	
	connectDevice: function(){
		app.showLoader("Connecting and discovering services...");
		app.device.connect(app.connectSuccess);
	},
	
	connectSuccess: function(message){
		$("#device_operation").show();
		$("#disconnect").show();
		$("#connect").hide();
		//get all GATT table information about this device
		//app.device.prepare(app.fillServices,function(message){alert(message);});
		//or you can get service information only
		app.device.discoverServices(app.fillServices,function(message){alert(message);});
	},
	
	disconnectDevice: function(){
		app.device.disconnect(app.disconnectSuccess);
	},
	
	showLoader : function(message) {
		$.mobile.loading('show', {
			text: message, 
			textVisible: true, 
			theme: 'a',        
			textonly: true,   
			html: ""           
		});
	},

	hideLoader : function(){
		$.mobile.loading('hide');
	},
	
	disconnectSuccess: function(message){
		$("#connect").show();
		$("#disconnect").hide();
		$("#service_view").empty();
		sessionStorage.setItem("isConnected","NO");
	},
	
	fillServices: function(){
		var viewObj	= $("#service_view");
		viewObj.empty();
		for(var i=0; i<app.device.services.length; i++){
			var service = app.device.services[i];
			var liTplObj=$("#service_tpl").clone();
			var serviceIndex = service.index;
			$("a",liTplObj).attr("onclick","app.getChar('"+serviceIndex+"')");
			liTplObj.show();
			
			for(var key in service){
				$("[dbField='"+key+"']",liTplObj).html(service[key]);
			}	

			viewObj.append(liTplObj);
		}
		app.hideLoader();
	},
	
	getChar: function(serviceIndex){
		sessionStorage.setItem("serviceIndex",serviceIndex);
		//if you only get service information, you should get discover characteristics next
		app.device.services[serviceIndex].discoverCharacteristics(function(){
			$.mobile.changePage("char_detail.html","slideup");
		},function(){
			alert("discover characteristics error!");
		});
		//$.mobile.changePage("char_detail.html","slideup");
	},
	
	charViewInit: function(){
		var serviceIndex = sessionStorage.getItem("serviceIndex");
		$("#char_deviceName").html(app.device.deviceName);
		$("#char_deviceID").html(app.device.deviceID);
		$("#service_name").html(app.device.services[serviceIndex].name);
		
		var viewObj	= $("#char_view");
		for(var i=0; i<app.device.services[serviceIndex].characteristics.length; i++){
			var character = app.device.services[serviceIndex].characteristics[i];
			var liTplObj=$("#char_tpl").clone();
			$("#optChar",liTplObj).attr("onclick","app.optChar('"+character.index+"')");
			$("#getDes",liTplObj).attr("onclick","app.change2DesView('"+character.index+"')");
			liTplObj.show();
			
			for(var key in character){
				if(key == 'property'){
					var propertyArray = character[key];
					var propertyStr = "";
					_.each(propertyArray, function(property){
						propertyStr += " "+property;
					}
				);
					$("[dbField='"+key+"']",liTplObj).html(propertyStr);
				}else{
					$("[dbField='"+key+"']",liTplObj).html(character[key]);
				}
			}	
			viewObj.append(liTplObj);
		}
	},
	
	change2DesView: function(characteristicIndex){
		sessionStorage.setItem("characterIndex",characteristicIndex);
		//if you only get characteristic information, you should get discover descriptors next
		var serviceIndex = sessionStorage.getItem("serviceIndex");
		app.device.services[serviceIndex].characteristics[characteristicIndex].discoverDescriptors(function(){
			$.mobile.changePage("desc_list.html","slideup");
		},function(){
			alert("get descriptors error!");
		});
		//$.mobile.changePage("desc_list.html","slideup");
	},
	
	desListViewInit: function(){
		//then recover from json string
		var serviceIndex = sessionStorage.getItem("serviceIndex");
		var characterIndex= sessionStorage.getItem("characterIndex");
		var service = app.device.services[serviceIndex];
		var character = service.characteristics[characterIndex];
		$("#desc_deviceName").html(app.device.deviceName);
		$("#desc_deviceID").html(app.device.deviceID);
		$("#desc_service_name").html(service.name);
		$("#desc_char_name").html(character.name);
		
		var viewObj	= $("#des_list_view");
		var descriptors = character.descriptors;
		viewObj.empty();
		for(var i=0; i<descriptors.length; i++){
			var liTplObj=$("#des_tpl").clone();
			liTplObj.show();
			
			for(var key in descriptors[i]){
				$("[dbField='"+key+"']",liTplObj).html(descriptors[i][key]);
			}	
			descriptors[i].read(function(data){
				$("[dbField='value_hex']",liTplObj).html(data.value.getHexString());
				$("[dbField='value_ascii']",liTplObj).html(data.value.getASCIIString());
				$("[dbField='value_unicode']",liTplObj).html(data.value.getUnicodeString());
			});
			viewObj.append(liTplObj);
		}
	},
	
	optChar: function(index){
		sessionStorage.setItem("characterIndex",index);
		$.mobile.changePage("operate_char.html","slideup");
	},
	
	operateCharViewInit: function(){
		var serviceIndex = sessionStorage.getItem("serviceIndex");
		var characterIndex = sessionStorage.getItem("characterIndex");
		var service = app.device.services[serviceIndex];
		var character = service.characteristics[characterIndex];
		$("#operate_char_deviceName").html(app.device.deviceName);
		$("#operate_char_deviceID").html(app.device.deviceID);
		$("#operate_service_name").html(service.name);
		$("#operate_char_name").html(character.name);
		$("#getDes_btn").click(function(){$.mobile.changePage("desc_list.html","slideup");});
		
		$("#writeOK").click(function(){		
				var type = $('input:radio[name="writeType"]:checked').val();
				character.write(type,$('#writeValue').val(),app.writeCharSuccess,app.onGeneralError);
			});
			
		$("#writeClear").click(function(){
			$('#writeValue').val('');
		});

		if(character.property.contains("read")){
			$("#read").show().click(function(){character.read(app.readCharSuccess,app.onGeneralError)});
		}
		if(character.property.contains("write") || character.property.contains("writeWithoutResponse")){
			$("#writeInput").show();
		}
		if(character.property.contains("notify")){
			$("#subscribe").show().click(function(){
				character.subscribe(app.onNotify);
			});
			$("#unsubscribe").show().click(function(){character.unsubscribe(function(){alert("unsubscribe success!");})});
			$("#notifyData").show();
		}
		if(character.property.contains("indicate")){
			$("#indicate").show().click(app.indicateChar);
		}
	},

	readCharSuccess: function(data){
		alert("Read Content(HEX):"+data.value.getHexString()+"\nRead Content(ACSII):"+data.value.getASCIIString()+"\nRead Content(Unicode):"+data.value.getUnicodeString()+"\nRead Time:"+data.date);
	},
	
	writeCharSuccess: function(message){
		alert("write success! message is:"+JSON.stringify(message));
	},
    
    onNotify:function(data){
		$("#notifyValue_hex").html(data.value.getHexString());
		$("#notifyValue_unicode").html(data.value.getUnicodeString());
		$("#notifyValue_ascii").html(data.value.getASCIIString());
		$("#notifyDate").html(data.date);
    },
	
	indicateChar: function(){
		alert("indicate data!");
	},
	
	createService : function(){
	
		var service = BC.Bluetooth.CreateService("0000ffe0-0000-1000-8000-00805f9b34fb");
		var property = ["read","write"];
		var permission = ["read","write"];
		var onMyWriteRequestName = "myWriteRequest";
		var onMyReadRequestName = "myReadRequest";
		var character1 = BC.Bluetooth.CreateCharacteristic("0000ffe1-0000-1000-8000-00805f9b34fb","01","Hex",property,permission);
		var character2 = BC.Bluetooth.CreateCharacteristic("0000fff2-0000-1000-8000-00805f9b34fb","00","Hex",property,permission);
		var descriptor1 = BC.Bluetooth.CreateDescriptor("00002901-0000-1000-8000-00805f9b34fb","00","Hex",permission);
		var descriptor2 = BC.Bluetooth.CreateDescriptor("00002902-0000-1000-8000-00805f9b34fb","08","Hex",permission);
		character1.addDescriptor(descriptor1);
		character1.addDescriptor(descriptor2);
		service.addCharacteristic(character1);
		service.addCharacteristic(character2);
		BC.Bluetooth.AddService(service,app.addServiceSusscess,app.addServiceError);
		
		services[0] = service;
	},
	
	addServiceSusscess : function(){
		alert("add service success!");
	},

	addServiceError : function(){
		alert("add service error!");
	},
	
	removeServiceSuccess : function(){
		alert("remove service success!");
	},
	
	removeServiceError : function(){
		alert("remove service error!");
	},
	
	removeService : function(){
		BC.Bluetooth.RemoveService(services[0],app.removeServiceSuccess,app.removeServiceError);
	},
	
	getPairedDevice : function(){
		BC.Bluetooth.GetPairedDevices(function(mes){alert(JSON.stringify(mes));},function(mes){alert(JSON.stringify(mes));});
	},
	
	getConnectedDevice : function(){
		BC.Bluetooth.GetConnectedDevices(function(mes){alert(JSON.stringify(mes));},function(mes){alert(JSON.stringify(mes));});
	},
	
	getRSSI : function(){
		app.device.getRSSI(app.getRSSISuccess);
	},
	
	getRSSISuccess : function(data){
		alert(JSON.stringify(data));
	},
	
	createPair : function(){
		app.device.createPair(function(mes){},function(mes){});
	},
	
	removePair : function(){
		app.device.removePair(function(mes){},function(mes){});
	},
	
	getDeviceInfo : function(){
		app.device.getDeviceInfo(app.getDeviceIDSuccess,app.getDeviceIDError);
	},
	
	getDeviceIDSuccess : function(){
		alert("System ID:"+app.device.systemID.getHexString()+"\n"+
			  "Model Number:"+app.device.modelNum.getASCIIString()+"\n"+
			  "Serial Number:"+app.device.serialNum.getASCIIString()+"\n"+
			  "Firmware Revision:"+app.device.firmwareRevision.getASCIIString()+"\n"+
			  "Hardware Revision:"+app.device.hardwareRevision.getASCIIString()+"\n"+
			  "Software Revision:"+app.device.softwareRevision.getASCIIString()+"\n"+
			  "Manufacturer Name:"+app.device.manufacturerName.getASCIIString());
	},
	
	getDeviceIDError : function(){
		alert("get device ID (profile) error!");
	},
};
