var tekSavvy = {

  sUsageURL: "https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true",

  initialization: function() {
    //Set function to save API key when "set" button is pressed
    $("#setApiKeyButton").click(this.onSetApiKey);
    //Set function to show/hide API key input box
    $("#apiKeyTitle").click(this.onClickApiKeyTitle);

    //Hide api key input by default
    $("#apiKeyInput").hide();

    //Retreive API key - if saved then request usage
    chrome.storage.sync.get('apiKey', function(data) {
        if(data.apiKey) {
            tekSavvy.requestUsage(data.apiKey);

            $("#apiKeyInputValue").val(data.apiKey);
            $("#apiKeyTitleDisplay").html(data.apiKey);
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
    if(!e.target.response) {
        //API Key bad - display error 
        $("#currentMonthAmount").html( null );
        $("#currentMonthAmountError").html( "Error retreiving data: Check API Key" );
        return;
    }

    var oUsage = JSON.parse(e.target.response);

    var iPeakDownload = oUsage.value[0].OnPeakDownload;
    var iPeakUpload = oUsage.value[0].OnPeakUpload;

    var iOffPeakDownload = oUsage.value[0].OffPeakDownload;
    var iOffPeakUpload = oUsage.value[0].OffPeakUpload;

    $("#currentMonthAmount").html( (iPeakDownload+iPeakUpload).toString() );
    $("#currentMonthAmountError").html( null );

  },

  onSetApiKey: function(e) {
    var sApiKey = $("#apiKeyInputValue").val();

    chrome.storage.sync.set({'apiKey': sApiKey}, function() {
        if(this.args[1].apiKey) {
            tekSavvy.requestUsage(this.args[1].apiKey);
        }
    });
  },

  onClickApiKeyTitle: function(e) {
    if($('#apiKeyInput').is(':visible')){
       $("#apiKeyInput").hide();
    } else {
        $("#apiKeyInput").show();
    }
  }

};

document.addEventListener('DOMContentLoaded', function () {
    tekSavvy.initialization();
});
