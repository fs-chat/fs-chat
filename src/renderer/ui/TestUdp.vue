<template>
  <div>
  	<div class="row">
	    <div class="col-md-12">
        <div class="card">
          <div class="card-header card-header-primary">
            <h4 class="card-title">Test UDP</h4> 
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-md-12">

                <div class="form-group">
                  <label>Test message to send</label>
                  <input type="text" class="form-control" v-model="testMessage">
                </div>
                <div class="form-group">
                  <button type="submit" class="btn btn-primary btn-fill" v-on:click.prevent="sendMessage()">
                    Send and receive on port {{ udpPort }}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
	    </div>
	  </div>
  </div>
</template>

<script>
import { ipcRenderer, remote, shell } from 'electron'

export default {
  data() {
    return {
      testMessage: "gear=down"
    };
  },
  created: function() {
    this.$store.commit('setTitle', "Test UDP");
  },
  computed: {
    udpPort() {
      return global.__settings.udp_port || 7;
    }
  },
  methods: {
    sendMessage() {
      var self = this;
      ipcRenderer.send("send-udp-message", { 
        msg: self.testMessage
      });
    }
  }
};
</script>
