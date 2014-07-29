var tekSavvy = {

    sUsageURL: "https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true",
    iTotalPeak: 0,

    initialization: function() {
        //Set function to save API key when "set" button is pressed
        $("#setApiKeyButton").click(this.onSetApiKey);
        //Set function to show/hide settings input box
        $("#settingsTitle").click(this.onClickSettingsTitle);
        //Set function to save maximum monthly usage when it is changed
        $("#maximumUsageDropdown").change(this.onChangeMaximumUsage);

        //Hide settings by default - maybe move to css
        $("#settingsContent").hide();

        //Retreive maximum usage - if saved then request usage
        chrome.storage.sync.get('maximumUsage', function(data) {
            if (data.maximumUsage) {
                $("#maximumUsageDropdown").val(data.maximumUsage);
            }
        });

        //Retreive API key - if saved then request usage
        chrome.storage.sync.get('apiKey', function(data) {
            if (data.apiKey) {
                tekSavvy.requestUsage(data.apiKey);

                $("#apiKeyInputValue").val(data.apiKey);
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

    processUsage: function(e) {
        if (!e.target.response) {
            //API Key bad - display error 
            $("#currentMonthAmount").html(null);
            $("#currentMonthAmountError").html("Error retreiving data: Check API Key");
            $("#currentMonthPercentage").html(null);
            return;
        }

        var oUsage = JSON.parse(e.target.response);

        var iPeakDownload = oUsage.value[0].OnPeakDownload;
        var iPeakUpload = oUsage.value[0].OnPeakUpload;
        this.iTotalPeak = iPeakDownload + iPeakUpload;

        var iOffPeakDownload = oUsage.value[0].OffPeakDownload;
        var iOffPeakUpload = oUsage.value[0].OffPeakUpload;


        $("#currentMonthAmount").html(this.iTotalPeak.toFixed(2).toString() + " GB");
        $("#currentMonthAmountError").html(null);

        this.updatePercentage();
    },

    updatePercentage: function() {
        var sMaximumUsage = $("#maximumUsageDropdown").val();
        if (sMaximumUsage !== "unlimited") {
            var iPercentageUsage = (this.iTotalPeak / parseInt(sMaximumUsage) * 100);
            $("#currentMonthPercentage").html(iPercentageUsage.toFixed(0) + "%");
        } else {
            $("#currentMonthPercentage").html(null);
        }
    },

    onSetApiKey: function(e) {
        var sApiKey = $("#apiKeyInputValue").val();

        chrome.storage.sync.set({
            'apiKey': sApiKey
        }, function() {
            if (this.args[1].apiKey) {
                tekSavvy.requestUsage(this.args[1].apiKey);
            }
        });
    },

    onClickSettingsTitle: function(e) {
        if ($('#settingsContent').is(':visible')) {
            $("#settingsContent").hide();
        } else {
            $("#settingsContent").show();
        }
    },

    onChangeMaximumUsage: function(e) {
        var sMaximumUsage = $("#maximumUsageDropdown").val();

        chrome.storage.sync.set({
            'maximumUsage': sMaximumUsage
        }, function() {
            tekSavvy.updatePercentage();
        });
    }

};

document.addEventListener('DOMContentLoaded', function() {
    tekSavvy.initialization();
});
