import { remote } from 'electron'
import Datastore from 'nedb';
import store from './store'

export var resultsDb = null;

/** 
 * This operation verifies that the database exists and is up to date.
 */
export function initDatabase() {
	// Persistent datastore with manual loading
	resultsDb = new Datastore({ filename: remote.app.getPath('userData')+'\\leaderboard.db' });
	resultsDb.loadDatabase(function (err) {    // Callback is optional
	  if (err) console.log(err);
	  else store.commit('setDatabaseLoaded', true);
	});

	resultsDb.ensureIndex({ fieldName: 'date' }, function (err) {
		if (err) console.log(err);
	});
}

export function randomId() {
	var text = "";
  var chars = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";
  for (var i = 0; i < 30; i++)
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}