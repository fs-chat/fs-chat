import store from './store';
import request from 'request'
import { auth } from './auth';

export default {
  readPoints() {
    var token = store.state.oauthStreamlabsToken;
    var info = store.state.streamlabsAccountInfo;
    if (token && info && info.youtube) {
      var options = { method: 'GET',
        url: 'https://streamlabs.com/api/v1.0/points',
        qs: { 
          access_token: token.access_token,
          // username: info.youtube.id,
          channel: info.youtube.id
        }
      };

      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        else {
          console.log(body);
        }
      });
    }
  },
	rewardPoints(userPoints) {
    var token = store.state.oauthStreamlabsToken;
    var info = store.state.streamlabsAccountInfo;
    if (token && info && info.youtube) {
      var options = { method: 'POST',
        url: 'https://streamlabs.com/api/v1.0/points/import',
        qs: { 
          access_token: token.access_token,
          channel: info.youtube.id,
          // 'users["UCJXulm-f3zXIzWB3uAwYfjA"]': 100
          // users: {
          //   'UCJXulm-f3zXIzWB3uAwYfjA': 100
          // }
        }
      };

      console.log(options);

      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        else {
          console.log(body);
        }
      });
    }
	}
};
