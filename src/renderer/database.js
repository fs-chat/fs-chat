import { remote } from 'electron'
import loki from 'lokijs';
import store from './store'

export var db = null;

/** 
 * This operation verifies that the database exists and is up to date.
 */
export function initDatabase() {
	var databaseInitialize = function() {
		// Init collections
	  if (db.getCollection("results") === null) {
	    db.addCollection("results", { indices: ['id'] });
	  }

		store.commit('setDatabaseLoaded', true);  
	};

	// Trigger database load
	var basePath = remote.app.getPath('userData')+'\\';
	db = new loki(basePath + 'leaderboard.db', {
		autoload: true,
		autosave: true, 
		autoloadCallback : databaseInitialize,
		autosaveInterval: 4000
	});
}

export function randomId() {
	var text = "";
  var chars = "23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz";
  for (var i = 0; i < 30; i++)
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  return text;
}