'use strict';

const axios = require('axios');
const querystring = require('querystring');
const cheerio = require('cheerio');
const debug = require('debug')('FritzPlatformLUA');

class LUAHandler {
  constructor (platform, config) {

    this.config = config;   
    debug.enabled = platform.debugEnabled;
    
    this.count = 0;
    
  }
  
  async requestLUA(formData, path, device, typ){
 
    this.count++;
    let currCount = this.count;
  
    try {

      let sid = device.services['urn:dslforum-org:service:DeviceConfig:1']; 
      sid = await sid.actions['X_AVM-DE_CreateUrlSID']();
      
      sid = sid['NewX_AVM-DE_UrlSID'].split('sid=')[1];
     
      let url = 'http://' + this.config.host + path + '?sid=' + sid;
        
      formData.sid = sid;
        
      debug('[LUA Debug] ' + device.deviceInfo.friendlyName + ' api request ' + currCount + ': get ' + path + '?sid=' + sid + (typ ? ' (' + typ + ')' : ''));
          
      let post = await axios.post(url, querystring.stringify(formData), { headers: { 'Content-Type': 'application/x-www-form-urlencoded'}});
        
      debug('[LUA Debug] ' + device.deviceInfo.friendlyName + ' api request ' + currCount + ': Ok');
        
      if(typ){
        
        let data = this.parseOutput(post.data, typ);
          
        return data;
        
      } else {
        
        return post.data;
        
      }
    
    } catch(error){
    
      if(error.response)
        error = {
          status: error.response.status,
          message: error.response.statusText,
          config: error.config,
          data: error.response.data
        };
      
      debug('[LUA Debug] ' + device.deviceInfo.friendlyName + ' api request ' + currCount + ': Error');
        
      throw error;
    
    }
  
  }
  
  async parseOutput(data, type){

    let value;
  
    try {
    
      let $ = cheerio.load(data);
      let elements = $('input').toArray();
      
      for(const el of elements){
    
        if(el.attribs.name === type && el.attribs.checked){

          return el.attribs.value;
      
        } else {
          
          value = el.attribs.value || 0;

        }
    
      }
      
      return value;
    
    } catch(err){
    
      throw err;
    
    }
 
  }

}

module.exports = LUAHandler;