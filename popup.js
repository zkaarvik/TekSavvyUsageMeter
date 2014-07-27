var tekSavvyApi = {

  sUsageURL: "https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true",

  requestUsage: function() {
    var req = new XMLHttpRequest();
    req.open("GET", this.sUsageURL, true);
    req.setRequestHeader("TekSavvy-APIKey", "408F3085E995B8E30EAE2C1F3E4B6F37");
    req.onload = this.processUsage.bind(this);
    req.send(null);
  },

  processUsage: function (e) {
    var oUsage = JSON.parse(e.target.response);

    var iPeakDownload = oUsage.value[0].OnPeakDownload;
    var iPeakUpload = oUsage.value[0].OnPeakUpload;

    var iOffPeakDownload = oUsage.value[0].OffPeakDownload;
    var iOffPeakUpload = oUsage.value[0].OffPeakUpload;

    var oCurrentDiv = document.getElementById("currentMonthAmount"); 
    oCurrentDiv.innerHTML = (iPeakDownload+iPeakUpload).toString();

  },

};

document.addEventListener('DOMContentLoaded', function () {
  tekSavvyApi.requestUsage();
});
