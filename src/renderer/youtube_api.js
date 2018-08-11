import { google } from 'googleapis';
var OAuth2 = google.auth.OAuth2;

import store from './store';

export default {
	getLiveChatId(token, channelId, videoId, callback) {
	  var service = google.youtube('v3');
    var auth = new OAuth2(global.__settings.clientId, global.__settings.clientSecret);
    auth.setCredentials(token);

    var onVideoIdFound = function (id) {
      service.videos.list({
        id: id,
        auth: auth,
        part: 'snippet,contentDetails,statistics,liveStreamingDetails',
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }
        if (response.data.items.length > 0) {
          var video = response.data.items[0];
          if (!video.liveStreamingDetails || !video.liveStreamingDetails.activeLiveChatId) {
            if (callback) callback('No active live chat found for the live broadcast.');
          } else {
            if (callback) callback(null, id, 
              video.liveStreamingDetails.activeLiveChatId,
              video.snippet.title);
          }
        } else {
          if (callback) callback('Could not retreive live broadcast information.');
        }
      });
    }

    if (videoId) {
      console.log("Selecting video from URL.");
      onVideoIdFound(videoId);
    } else if (channelId) {
      service.search.list({
        auth: auth,
        channelId: channelId,
        eventType: 'live',
        type: 'video',
        part: 'snippet',
      }, function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }
        if (response.data.items.length > 0) {
          var stream = response.data.items[0];
          var broadcastId = stream.id.videoId;
          console.log("Live stream video ID found: " + broadcastId);
          onVideoIdFound(broadcastId);
        } else {
          if (callback) callback('No live broadcast found for this channel. (You may wait at least 2 min after stream started)');
        }
      });
    } else {
      if (callback) callback('Something unusual happened, try again.');
    }
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
        callback(err);
      }
      if (callback && response.data) {
      	callback(null, response.data);
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
