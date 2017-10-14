import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Media, MediaObject } from '@ionic-native/media';
import { HTTP } from '@ionic-native/http';
import { File } from '@ionic-native/file';
import CryptoJS from 'crypto-js'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

	inputPath: string;
	inputFile: string;

	private fileName: string = "temprecord.mp3";
	private path: string = "file:///sdcard/";
	private file: MediaObject;
	
	method: string = "POST";
	host: string = "identify-eu-west-1.acrcloud.com";
	endpoint: string = "/v1/identify";
	signatureVersion: string = "1";
	dataType: sring = "audio";
	accessKey: string = "4331bd05c48746da009a58ede2a9b3ca";
	accessSecret: string = "veJCKOAb1mMeUxrTDay0Ymsy8TLaDEnBlciBKnEJ";

  constructor(public navCtrl: NavController, private media: Media, private http: HTTP, private fs: File) {
	console.log("Data dir", this.fs.dataDirectory);
	console.log("Cache dir", this.fs.cacheDirectory);
  }
  
  startRecording()
  {
	console.log("Button clicked, yo");
	let mediaPath = this.fileName;
	console.log(mediaPath);
	this.file = this.media.create(mediaPath);
	
	this.file.onStatusUpdate.subscribe(status => console.log(status)); // fires when file status changes
	this.file.onSuccess.subscribe(success => console.log('Action is successful', success));
	this.file.onError.subscribe(error => console.log('Error!'));
	
	this.file.startRecord();
  }
  
  stopRecording()
  {
	if(this.file != undefined)
	{
		this.file.stopRecord();
		this.file.play();
	}
  }
  
  tryCrypto()
  {
	let currentDate = new Date();
	let timestamp = currentDate.getTime() / 1000;
	
	
	let stringToSign = this.buildStringToSign(this.method, this.endpoint, this.accessKey, this.dataType, this.signatureVersion, timestamp);
	console.log(stringToSign);
	let signature = this.sign(stringToSign, this.accessSecret);
	console.log(signature);
	
	this.fs.listDir(this.inputPath, this.inputFile).then(arr => {
		for(let entry of arr)
		{
			console.log(entry.name);
		}
	}, err => {
		console.log("Error", err, err.message);
	});
  }
  
  identifySong()
  {
	if(this.file != undefined)
	{
	  this.fs.checkFile(this.path, this.fileName).then(val => {
	    if(val) {
			this.fs.readAsArrayBuffer(this.path, this.fileName).then(data => {
				
				let currentDate = new Date();
				let timestamp = currentDate.getTime();
	
				let stringToSign = this.buildStringToSign(this.method, this.endpoint, this.accessKey, this.dataType, this.signatureVersion, timestamp);
				console.log(stringToSign);
				let signature = this.sign(stringToSign, this.accessSecret);
				console.log(signature);
	  
				let formData = {
				sample: data,
				access_key:this.accessKey,
				data_type:this.dataType,
				signature_version:this.signatureVersion,
				signature:signature,
				sample_bytes:data.byteLength,
				timestamp:timestamp,
				}
				
				let url = "http://" + this.host + this.endpoint;
				console.log(url);
				this.printObject(formData);
				
				this.http.setHeader("Content-Type", "multipart/form-data");
				this.http.post(url, formData, {}).then(response => {
					console.log("HTTP Response:");
					this.printObject(response);
				}, err => {
					console.log("HTTP Error:");
					this.printObject(err);
				});
				
			}, err => {
				console.log("File read error", err.message);
			});
		}
	  }, err => {
		  console.log("File check error", err.message);
	  });
    }
  }
  
  buildStringToSign(method, uri, accessKey, dataType, signatureVersion, timestamp) {
    return [method, uri, accessKey, dataType, signatureVersion, timestamp].join('\n');
  }

  sign(signString, accessSecret) {
	/*  declare const crypto;
	  declare const Buffer;
    return crypto.createHmac('sha1', accessSecret)
    .update(new Buffer(signString, 'utf-8'))
    .digest().toString('base64');
  */
	return CryptoJS.HmacSHA1(signString, accessSecret).toString(CryptoJS.enc.Base64);
  }
  
  printObject(obj: any)
  {
	for(let key in obj)
	{
		let val = obj[key];
		if(val instanceof Object)
		{
			console.log(key + ": {");
			this.printObject(obj[key]);
			console.log("}");
		}
		else
		{
			console.log(key + ": " + val);
		}
	}
  }


}
