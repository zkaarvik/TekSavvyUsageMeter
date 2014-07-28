var tekSavvy = {

  sUsageURL: "https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true",

  initialization: function() {
    //Set function to save API key when "set" button is pressed
    document.getElementById("setApiKeyButton").addEventListener("click", this.onSetApiKey);

    //Retreive API key - if saved then request usage
    chrome.storage.sync.get('apiKey', function(data) {
        if(data.apiKey) {
            tekSavvy.requestUsage(data.apiKey);
            var oApiKeyDiv = document.getElementById("apiKey");
            oApiKeyDiv.value = data.apiKey;
        }
    });
  },

  requestUsage: function(sApiKey) {
    var req = new XMLHttpRequest();
    req.open("GET", this.sUsageURL, true);
    req.setRequestHeader("TekSavvy-APIKey", sApiKey);
    req.onload = this.processUsage.bind(this);
    req.send(null);
  },

  processUsage: function (e) {
    //API Key bad - display error 
    if(!e.target.response) {
        document.getElementById("currentMonthAmount").innerHTML = "Error retreiving data: Check API Key";
        return;
    }

    var oUsage = JSON.parse(e.target.response);

    var iPeakDownload = oUsage.value[0].OnPeakDownload;
    var iPeakUpload = oUsage.value[0].OnPeakUpload;

    var iOffPeakDownload = oUsage.value[0].OffPeakDownload;
    var iOffPeakUpload = oUsage.value[0].OffPeakUpload;

    document.getElementById("currentMonthAmount").innerHTML = (iPeakDownload+iPeakUpload).toString();

  },

  onSetApiKey: function(e) {
    var oApiKeyDiv = document.getElementById("apiKey");
    var sApiKey = oApiKeyDiv.value;

    chrome.storage.sync.set({'apiKey': sApiKey}, function() {
        if(this.args[1].apiKey) {
            tekSavvy.requestUsage(this.args[1].apiKey);
        }
    });
  }

};

document.addEventListener('DOMContentLoaded', function () {
    tekSavvy.initialization();
});
