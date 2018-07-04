import { google } from 'googleapis';
var OAuth2 = google.auth.OAuth2;

import store from './store';

export default {
	getLiveChatId(token, videoId, callback) {
	  var service = google.youtube('v3');
    var auth = new OAuth2(global.__settings.clientId, global.__settings.clientSecret);
    auth.setCredentials(token);

    service.videos.list({
      auth: auth,
      id: videoId,
      part: 'snippet,contentDetails,statistics,liveStreamingDetails',
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      if (response.data.items.length > 0) {
      	var stream = response.data.items[0];
      	if (!stream.liveStreamingDetails || !stream.liveStreamingDetails.activeLiveChatId) {
          if (callback) callback('No active live chat found for the video.');
        } else {
      		if (callback) callback(null, stream.liveStreamingDetails.activeLiveChatId);
        }
      } else {
        if (callback) callback('No video found for this url.');
      }
    });
	},
	getNewComments(token, liveChatId, nextPageToken, callback) {
	  var service = google.youtube('v3');
    var auth = new OAuth2(global.__settings.clientId, global.__settings.clientSecret);
    auth.setCredentials(token);

    var params = {
      auth: auth,
      liveChatId: liveChatId,
      part: 'snippet, authorDetails',
    };

    if (nextPageToken) {
    	params.pageToken = nextPageToken;
    }

    service.liveChatMessages.list(params, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      if (callback && response.data) {
      	callback(response.data);
      }
    });
	},
	insertComment(token, liveChatId, messageText) {
	  var service = google.youtube('v3');
    var auth = new OAuth2(global.__settings.clientId, global.__settings.clientSecret);
    auth.setCredentials(token);

    service.liveChatMessages.insert({
      auth: auth,
      part: 'snippet',
      resource: {
      	snippet: {
		      liveChatId: liveChatId,
		      type: 'textMessageEvent',
		      textMessageDetails: {
			      "messageText": messageText
			    }
			  }
      }
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
    });
	},
	fetchChannel(token, channelId, callback) {
	  var service = google.youtube('v3');
    var auth = new OAuth2(global.__settings.clientId, global.__settings.clientSecret);
    auth.setCredentials(token);

		service.channels.list({
		  auth: auth,
		  id: channelId,
		  part: 'snippet,contentDetails,brandingSettings,invideoPromotion,statistics',
		}, function(err, response) {
			console.log('res');

		  if (err) {
		    console.log('The API returned an error: ' + err);
		    return;
		  }

		  var channels = response.data.items;
		  if (channels.length > 0) {
		   	var channel = channels[0];
		   	if (callback) callback(channel);
		  }
		});
	}
};
