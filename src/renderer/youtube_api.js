import { google } from 'googleapis';
var OAuth2 = google.auth.OAuth2;

import store from './store';
import { auth } from './auth';

export default {
	getLiveChatId(channelId, videoId, callback) {
	  var service = google.youtube('v3');

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

      // 
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
	getNewComments(liveChatId, nextPageToken, callback) {
	  var service = google.youtube('v3');

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
      } else if (response.data) {
      	callback(null, response.data);
      }
    });
	},
	insertComment(liveChatId, messageText) {
	  var service = google.youtube('v3');

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
	}
};
