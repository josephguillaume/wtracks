/**
 *
 */

// requires JQuery


// ------------------------------------------------------------------
// DPaste
// ------------------------------------------------------------------

 function dpasteUpload(name, gpx, onDone, onFail) {
   $.post( "//dpaste.com/api/v2/",
      { "content": gpx,
         "title": name,
         "syntax": "xml",
         "expiry_days": 60 // 1 day to 365 days (7 days is the default)
   }).done(function(data) {
     onDone(data, data + ".txt");
   }).fail(onFail);
 }

 // ------------------------------------------------------------------
 // HTPut
 // ------------------------------------------------------------------

 function htputUpload(name, gpx, onDone, onFail) {
   function getId() {
     return Math.random().toString(36).substring(2);
   }
   var id = getId() + "-" + getId();
   var sharedurl = "//htput.com/" + id;
   $.ajax({
     url: sharedurl,
     type: 'PUT',
     dataType: "json",
     data: gpx,
   }).done(function(resp) {
     if (resp.status === "ok") {
       sharedurl = window.location.protocol + sharedurl;
       onDone(sharedurl, sharedurl + "?contentType=text/plain", resp.pass);
     } else {
       onFail(resp.error_msg);
     }
   }).fail(onFail);
 }
 function htputDelete(url, rawurl, passcode, onDone, onFail) {
   $.ajax({
     url: url,
     type: 'DELETE',
     headers: {
       "Htput-pass": passcode
     },
     dataType: "json"
   }).done(function(resp) {
     if (onDone && resp.status === "ok") {
       onDone();
     } else if (onFail) {
       onFail(resp.error_msg);
     }
   }).fail(onFail);
 }

 // ------------------------------------------------------------------
 // Friendpaste
 // ------------------------------------------------------------------

 function friendpasteUpload(name, gpx, onDone, onFail) {
   $.ajax({
     method: "POST",
     url: "//www.friendpaste.com/",
     dataType: "json",
     contentType:"application/json; charset=utf-8",
     data: JSON.stringify({
       "title": name,
       "snippet": gpx,
       "password": "dummy",
       "language": "xml"
     })
   }).done(function(resp) {
     if (resp.ok) {
       onDone(resp.url + "?rev=" + resp.rev, resp.url + "/raw?rev=" + resp.rev);
     } else {
       onFail(resp.reason);
     }
   }).fail(onFail);
 }


 // ------------------------------------------------------------------
 // TmpFile
 // ------------------------------------------------------------------

 function tmpfileUpload(name, gpx, onDone, onFail) {
  $.ajax({
    method: "POST",
    url: "https://tmpfile.glitch.me",
    data: gpx
  }).done(function(resp) {
    onDone(resp.urlAdmin, resp.url);
  }).fail(onFail);
}

function tmpfileDelete(url, rawurl, passcode, onDone, onFail) {
  $.ajax({
    method: "DELETE",
    url: url
  })
  .done(onDone)
  .fail(onFail);
}

 // ------------------------------------------------------------------
 // file.io
 // ------------------------------------------------------------------

// this method only supports small file (< 100KB)
 function fileioUploadSmall(name, gpx, onDone, onFail) {
   $.post( "//file.io/?expires=1d", { "text": gpx }
   ).done(function(resp) {
     if (resp.success) {
       onDone(resp.link, resp.link);
     } else {
       onFail(resp.message);
     }
   }).fail(onFail);
 }

// this method supports BIG files
function fileioUpload(name, gpx, onDone, onFail) {
  try {
    var formData = new FormData();
    var blob = new Blob([gpx], { type: "text/xml" });
    formData.append("file", blob, "dummy");

    $.ajax({
      url: "//file.io/?expires=1d",
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
    }).done(function (resp) {
      if (resp.success) {
        onDone(resp.link, resp.link);
      } else {
        onFail(resp.message);
      }
    }).fail(onFail);
  } catch (err) {
    // browser does not support FormData, fallback to atlernative method
    fileioUploadSmall(name, gpx, onDone, onFail);
  }
}

// fileio deletes file after 1st download
function fileioDelete(url, rawurl, passcode, onDone, onFail) {
  $.get(rawurl).done(onDone); // read file to delete it, ignore it was already read & deleted
}

 // ------------------------------------------------------------------
 // transfer.sh
 // ------------------------------------------------------------------

function transferUpload(name, gpx, onDone, onFail) {
  function getId() {
    return Math.random().toString(36).substring(2);
  }
  var id = getId() + "-" + getId();
  var sharedurl = "//transfer.sh/" + id;
  $.ajax({
    url: sharedurl,
    type: 'PUT',
    timeout: 60000,
    dataType: "json",
    data: gpx,
  }).done(function(resp) {
    if (resp.status === "ok") {
      onDone(resp.text, resp.text);
    } else {
      onFail(resp);
    }
  }).fail(onFail);
}

 // ------------------------------------------------------------------
 // gofile.io
 // ------------------------------------------------------------------

function gofileUpload(name, gpx, onDone, onFail) {

  function _gofileUpload(server, name, gpx, onDone, onFail) {
    try {
      name = encodeURIComponent(name);
      var formData = new FormData();
      var blob = new Blob([gpx], { type: "text/xml" });
      formData.append("filesUploaded", blob, name + ".gpx");

      var gofileUrl = "https://" + server + ".gofile.io/";
      $.ajax({
        method: "POST",
        url: gofileUrl + "uploadFile",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
      }).done(function (resp) {
        if (resp.status == "ok") {
          //$.get("https://gofile.io/?c=" + resp.data.code);
          onDone("https://gofile.io/?c=" + resp.data.code,
            gofileUrl + "download/" + resp.data.code + "/" + name + ".gpx");
        } else {
          onFail("gofile upload failed: " + resp.status);
        }
      }).fail(onFail);
    } catch (err) {
      onFail("gofile upload failed: formData not supported");
    }
  }

  $.get("//apiv2.gofile.io/getServer").done(function (resp) {
    if (resp.status == "ok" && resp.data && resp.data.server) {
      _gofileUpload(resp.data.server, name, gpx, onDone, onFail);
    } else {
      onFail("failed to get gofile server");
    }
  }).fail(onFail);

}

 // ------------------------------------------------------------------
 // Solid Pod
 // ------------------------------------------------------------------

var solid_store, solid_fetcher;

async function loadSolid(){
  await Promise.all([
    new Promise((resolve, reject) =>
      $.getScript("js/solid-auth-fetcher.bundle.js")
        .done(resolve)
        .catch(reject)
    ),
    new Promise((resolve, reject) =>
      $.getScript("js/rdflib.min.js").done(resolve).catch(reject)
    )
  ]);
}

async function solidPing(done,fail){
  if (typeof solid === "undefined") await loadSolid();
  let session = await solidAuthFetcher.getSession();
  if(session && session.loggedIn){
    await setupSolid();
    done();
  } else {
    fail();
  }
}

async function solidLogin() {
  if (typeof solid === "undefined") await loadSolid();
  let session = await solidAuthFetcher.getSession();
  if (!session || !session.loggedIn) {
    session = await solidAuthFetcher.login({
      // TODO: UI to allow selection
      oidcIssuer: "https://solidcommunity.net",
      popUp: true,
      popUpRedirectPath: "wtracks/js/solid_popup.html"
    });
  }
  await setupSolid();
}

async function setupSolid(){
  if(typeof solid_store === "undefined"){
    solid_store = $rdf.graph();
    let session = await solidAuthFetcher.getSession();
    solid_fetcher = new $rdf.Fetcher(solid_store, { fetch: session.fetch });
    await solid_fetcher.load(session.webId);
  }
}

function getSolidPim(){
  if(typeof solid_store==="undefined") return null;
  return solid_store.match(
    null,
    $rdf.sym("http://www.w3.org/ns/pim/space#storage"),
    null
  )[0].object.value;
}

function solidLoggedInText(){
  let pim = getSolidPim();
  // TODO: allow choosing paths
  let gpx_url = `${pim}public/geodata/gpx/`
  let cfg_url = `${pim}private/wtracks.cfg`;
  return `
  [<a href="${gpx_url}">Gpx Store</a>] [<a href="${cfg_url}">Cfg</a>]
  `
}

async function solidLogout(done, fail){
    await solidAuthFetcher.logout();
}

async function solidUpload(name, gpx, onDone, onFail) {
  await solidLogin();
  let pim = getSolidPim();
  // TODO: allow choosing path
  let url = `${pim}public/geodata/gpx/${encodeURIComponent(name)}.gpx`;
  solidAuthFetcher
    .fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "text/xml" },
      body: gpx
    })
    .then(function (resp) {
      if (resp.ok) {
        onDone(resp.url, resp.url);
      } else {
        onFail(resp.statusText);
      }
    })
    .catch(onFail);
}

// TODO: avoid duplication with solidUpload
// TODO: allow specifying fileName and onFail
async function solidLoadConfig(onDone) {
  await solidLogin();
  let pim = getSolidPim();
  let url = `${pim}private/wtracks.cfg`;
  onFail = x=> console.error(x);
  solidAuthFetcher
    .fetch(url)
    .then(function (resp) {
      if (resp.ok) {
        resp.json().then(onDone);
      } else {
        onFail(resp.statusText);
      }
    })
    .catch(onFail);
}

// TODO: avoid duplication with solidUpload
async function solidSaveConfig(txt, fileName, onDone, onFail) {
  await solidLogin();
  let pim = getSolidPim();
  // TODO: allow choosing path
  let url = `${pim}private/${encodeURIComponent(fileName)}`;
  if(!onDone) onDone = x=>console.log(x);
  if(!onFail) onFail = x=>console.error(x);
  solidAuthFetcher
    .fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: txt
    })
    .then(function (resp) {
      if (resp.ok) {
        onDone(resp.url, resp.url);
      } else {
        onFail(resp.statusText);
      }
    })
    .catch(onFail);
}

function solidDelete(url, rawurl, passcode, onDone, onFail) {
  throw Error("solidDelete not implemented");
}


 // ------------------------------------------------------------------
 // Common
 // ------------------------------------------------------------------

 function pingUrl(url, onDone, onFail) {
  try {
    $.get(url)
    .done(onDone)
    .fail(onFail);
  } catch (err) {
    onFail();
  }
 }

 // when no delete API available
 var noDelete = function() {};

 // ------------------------------------------------------------------
 // The share library
 // ------------------------------------------------------------------


var pastesLib = {
  "dpaste": {
    "name": "DPaste",
    "enabled": true,
    "web": "https://dpaste.com/",
    "maxSize": "250KB",
    "maxTime": "2 months",
    "maxDownloads": "Unlimited",
    "upload": dpasteUpload,
    "ping": function(done, fail) { pingUrl("https://dpaste.com", done, fail); },
    "delete": noDelete
  },
  "friendpaste": {
    "#" : "Does not work on Safari when 'prevent cross-site tracking' is set, because of the cookie friendpaste is setting",
    "enabled": true,
    "name": "FriendPaste",
    "web": "https://friendpaste.com/",
    "maxSize": "approx. 80KB",
    "maxTime": "Unknown",
    "maxDownloads": "Unlimited",
    "upload": friendpasteUpload,
    "ping": function(done, fail) { pingUrl("https://friendpaste.com/4yufAYfTKm8xKMJuXPDRhs/raw", done, fail); },
    "delete": noDelete
  },
  "tmpfile": { // 15s startup
    "enabled": true,
    "name": "TmpFile",
    "web": "https://glitch.com/edit/#!/tmpfile?path=README.md%3A1%3A0",
    "maxSize": "200KB",
    "maxTime": "1 month after unused",
    "maxDownloads": "Unlimited",
    "upload": tmpfileUpload,
    "ping": function(done, fail) { pingUrl("https://tmpfile.glitch.me/ping", done, fail); },
    "delete": tmpfileDelete
  },
  "htput": { // expired certificate
    "name": "HTPut",
    "enabled": false,
    "web": "https://htput.com/",
    "maxSize": "1MB per day",
    "maxTime": "Unknown",
    "maxDownloads": "Unlimited",
    "upload": htputUpload,
    "ping": function(done, fail) { pingUrl("https://htput.com/dummy", done, fail); },
    "delete": htputDelete
  },
  "fileio": { // download once
    "name": "file.io",
    "enabled": false, // sharing requires more than 1 request
    "web": "https://file.io/",
    "maxSize": "5GB",
    "maxTime": "1 day",
    "maxDownloads": "<span class='material-icons symbol'>warning</span> Once only!",
    "upload": fileioUpload,
    "delete": fileioDelete
  },
  "transfer.sh": { // discontinued?
    "name": "transfer.sh",
    "enabled": false,
    "web": "https://transfer.sh",
    "maxSize": "10GB",
    "maxTime": "14 days",
    "maxDownloads": "Unlimited",
    "upload": transferUpload,
    "delete": noDelete
  },
  "gofile": { // no direct download? CORS?
    "name": "gofile.io",
    "enabled": false,
    "web": "https://gofile.io/",
    "maxSize": "No limit!",
    "maxTime": "Unknown",
    "maxDownloads": "Unlimited",
    "upload": gofileUpload,
    "ping": function(done, fail) { pingUrl("https://apiv2.gofile.io/getServer", done, fail); },
    "delete": noDelete
  },
  "solid":{
    "name": "Solid Pod",
    "enabled": true,
    "web": "https://solidproject.org/use-solid/",
    "maxSize": "Depends on your pod",
    "maxTime": "Unlimited",
    "maxDownloads": "Unlimited",
    "upload": solidUpload,
    "delete": solidDelete,
    "ping": solidPing,
    "login":solidLogin,
    "logout":solidLogout,
    "loggedInText":solidLoggedInText,
    "saveConfig":solidSaveConfig,
    "loadConfig":solidLoadConfig
  }
};
