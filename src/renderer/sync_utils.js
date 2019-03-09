import store from './store';
import request from 'request'
import { auth, exportTokenStorage } from './auth';
import { resultsDb } from './database';
import arrayChunk from 'array.chunk';
import queue from 'queue';

export default {
  /**
   * Check the list of local results to see if they are synced with the server.
   * To action is executed each time a list of new results was inserted in the database.
   * We also check when the application was just started.
   */
  sync_results() {
    var syncUrl = global.__settings.sync_results_url;
    var syncVersion = global.__settings.sync_api_version;
    var token = store.state.syncApiToken;

    if (syncUrl && syncVersion && token) {
      // Flag to stop process on error
      var interruptSync = false;
      
      // Used to limit requests to one at a time
      var q = queue({ concurrency: 1, autostart: true });
      q.on('timeout', function (next, job) { next(); });
      q.on('end', function (result, job) {
        store.commit('setSyncPercent', null);
      })

      // Find results wich were not synced yet..
      var results = resultsDb.find({
        $or: [
          {'sync.version': { $ne: syncVersion }},
          {'sync.synced': { $ne: true }}
        ]
      }).exec(function (err, results) {
        console.log("Results to sync", results);

        if (err) console.error(err);
        else {
          // Group by chunks of 100 to minimise requests
          var total = results.length;
          var completed = 0;
          var resultsChunks = arrayChunk(results, 100);

          for (var i = 0; i < resultsChunks.length; i++) {
            let chunk = resultsChunks[i];
            let chunkData = chunk.map(result => {
              return {
                'is_medal': result.isMedal,
                'rank': result.rank,
                'precision': result.precision,
                'date': result.date,
                'user_id': result.user.channelId,
                'user_display_name': result.user.displayName, 
                'user_profile_image_url': result.user.profileImageUrl,
                'comment_id': result.id
              }
            });

            q.push(function (next) {
              if (interruptSync) return next();

              request({ 
                method: 'POST',
                url: syncUrl,
                form: { 
                  access_token: token,
                  sync_version: syncVersion,
                  results_json: JSON.stringify(chunkData)
                }
              }, function (error, response, body) {
                if (error) { 
                  interruptSync = true;
                  next();
                } else if (response.statusCode === 403) {
                  interruptSync = true;
                  // Invalid token, unset...
                  $.notify("Invalid sync ID.", 'error');
                  store.commit('setSyncApiToken', null);
                  exportTokenStorage();
                  next();
                } else if (response.statusCode !== 200) {
                  console.error(body);
                  next();
                } else {
                  // Update sync status in the database
                  let ids = chunk.map(result => result.id);
                  resultsDb.update({ id: { $in: ids }}, {
                    $set: { 
                      "sync.version": syncVersion, 
                      "sync.synced": true 
                    } 
                  }, { multi: true }, function () {
                    completed += chunk.length;
                    store.commit('setSyncPercent', completed / total);
                    console.log(`Successfully synced ${chunk.length} results.`);
                    next();
                  });
                }
              });
            });
          }
          
        }
      });
    }
  }
};
