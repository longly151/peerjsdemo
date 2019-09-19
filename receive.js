(function () {

  var lastPeerId = null;
  var peer = null; // Own peer object
  var peerId = null;
  var conn = null;
  var recvId = document.getElementById("receiver-id");
  var status = document.getElementById("status");
  var message = document.getElementById("message");
  var standbyBox = document.getElementById("standby");
  var goBox = document.getElementById("go");
  var fadeBox = document.getElementById("fade");
  var offBox = document.getElementById("off");
  var sendMessageBox = document.getElementById("sendMessageBox");
  var sendButton = document.getElementById("sendButton");
  var clearMsgsButton = document.getElementById("clearMsgsButton");

  /**
   * Create the Peer object for our end of the connection.
   *
   * Sets up callbacks that handle any events related to our
   * peer object.
   */
  function initialize() {
    // Create own peer object with connection to shared PeerJS server
    
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = async function ($evt) {
      if (xhr.readyState == 4 && xhr.status == 200) {
        let res = JSON.parse(xhr.responseText);
        console.log("response: ", res.v.iceServers);
        peer = new Peer(null, {
          host: 'mypeer1505.herokuapp.com',
          path: '/',
          secure: true,
          config: res.v.iceServers,
          // debug: 2
        });


        peer.on('open', function (id) {
          // Workaround for peer.reconnect deleting previous id
          if (peer.id === null) {
            console.log('Received null id from peer open');
            peer.id = lastPeerId;
          } else {
            lastPeerId = peer.id;
          }

          console.log('ID: ' + peer.id);
          recvId.innerHTML = "ID: " + peer.id;
          status.innerHTML = "Awaiting connection...";
        });
        peer.on('connection', function (c) {
          // Allow only a single connection
          if (conn) {
            c.on('open', function () {
              c.send("Already connected to another client");
              setTimeout(function () {c.close();}, 500);
            });
            return;
          }

          conn = c;
          console.log("Connected to: " + conn.peer);
          status.innerHTML = "Connected"
          ready();
        });
        peer.on('disconnected', function () {
          status.innerHTML = "Connection lost. Please reconnect";
          console.log('Connection lost. Please reconnect');

          // Workaround for peer.reconnect deleting previous id
          peer.id = lastPeerId;
          peer._lastServerId = lastPeerId;
          peer.reconnect();
        });
        peer.on('close', function () {
          conn = null;
          status.innerHTML = "Connection destroyed. Please refresh";
          console.log('Connection destroyed');
        });
        peer.on('error', function (err) {
          console.log(err);
          alert('' + err);
        });

      }
    }
    xhr.open("PUT", "https://global.xirsys.net/_turn/PeerJSDemo", true);
    xhr.setRequestHeader("Authorization", "Basic " + btoa(
      "longly151:90ea43f6-dac5-11e9-8a2d-0242ac110007"));
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({
      "format": "urls"
    }));
    // peer = new Peer(null, {
    //   host: 'localhost',
    //   port: 3000,
    //   path: '/',
    //   // secure: true,
    //   debug: 2
    // });
  };

  /**
   * Triggered once a connection has been achieved.
   * Defines callbacks to handle incoming data and connection events.
   */
  function ready() {
    conn.on('data', function (data) {
      console.log("Recieve ", data);
      var cueString = "<span class=\"cueMsg\">Cue: </span>";
      switch (data) {
        case 'Go':
          go();
          addMessage(cueString + data);
          break;
        case 'Fade':
          fade();
          addMessage(cueString + data);
          break;
        case 'Off':
          off();
          addMessage(cueString + data);
          break;
        case 'Reset':
          reset();
          addMessage(cueString + data);
          break;
        default:
          addMessage("<span class=\"peerMsg\">Peer: </span>" + data);
          break;
      };
    });
    conn.on('close', function () {
      status.innerHTML = "Connection reset<br>Awaiting connection...";
      conn = null;
      start(true);
    });
  }

  function go() {
    standbyBox.className = "display-box hidden";
    goBox.className = "display-box go";
    fadeBox.className = "display-box hidden";
    offBox.className = "display-box hidden";
    return;
  };

  function fade() {
    standbyBox.className = "display-box hidden";
    goBox.className = "display-box hidden";
    fadeBox.className = "display-box fade";
    offBox.className = "display-box hidden";
    return;
  };

  function off() {
    standbyBox.className = "display-box hidden";
    goBox.className = "display-box hidden";
    fadeBox.className = "display-box hidden";
    offBox.className = "display-box off";
    return;
  }

  function reset() {
    standbyBox.className = "display-box standby";
    goBox.className = "display-box hidden";
    fadeBox.className = "display-box hidden";
    offBox.className = "display-box hidden";
    return;
  };

  function addMessage(msg) {
    var now = new Date();
    var h = now.getHours();
    var m = addZero(now.getMinutes());
    var s = addZero(now.getSeconds());

    if (h > 12)
      h -= 12;
    else if (h === 0)
      h = 12;

    function addZero(t) {
      if (t < 10)
        t = "0" + t;
      return t;
    };

    message.innerHTML = "<br><span class=\"msg-time\">" + h + ":" + m + ":" + s + "</span>  -  " + msg + message.innerHTML;
  }

  function clearMessages() {
    message.innerHTML = "";
    addMessage("Msgs cleared");
  }

  // Listen for enter
  sendMessageBox.onkeypress = function (e) {
    var event = e || window.event;
    var char = event.which || event.keyCode;
    if (char == '13')
      sendButton.click();
  };
  // Send message
  sendButton.onclick = function () {
    if (conn.open) {
      var msg = sendMessageBox.value;
      sendMessageBox.value = "";
      conn.send(msg);
      console.log("Sent: " + msg)
      addMessage("<span class=\"selfMsg\">Self: </span>" + msg);
    }
  };
  // Clear messages box
  clearMsgsButton.onclick = function () {
    clearMessages();
  };

  initialize();
})();