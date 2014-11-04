var teksavvyApp = angular.module('teksavvyApp', []);

teksavvyApp.controller('AppController', function($scope) {
    $scope.textElements = {
        title: "TekSavvy Usage Meter",
        currentUsage: "Current Monthly Usage:",
        settings: "Settings",
        apiKey: "API Key",
        save: "Save",
        maxMonthlyUsage: "Maximum Monthly Usage"
    };

    $scope.usageValues = [{
        name: "75 GB",
        value: 75
    }, {
        name: "150 GB",
        value: 150
    }, {
        name: "300 GB",
        value: 300
    }, {
        name: "Unlimited",
        value: 0
    }];

    $scope.sUsageURL = "https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true";
    $scope.settingsHidden = true;
    $scope.amounts = {
        currentMonthAmount: "",
        currentMonthAmountError: "",
        currentMonthPercentage: ""
    };
    $scope.apiKey = "";


    $scope.init = function() {
        var that = this;

        //Retreive maximum usage - if saved
        chrome.storage.sync.get('maximumUsage', function(data) {
            if (data.maximumUsage) {
                that.maximumUsage = data.maximumUsage; 
            }
        });

        //Retreive API key - if saved then request usage
        chrome.storage.sync.get('apiKey', function(data) {
            if (data.apiKey) {
                that.apiKey = data.apiKey;
                that.requestUsage();
            }
        });
    };

    $scope.onClickSave = function() {
        var that = this;

        //Save API Key and request usage
        chrome.storage.sync.set({
            'apiKey': this.apiKey
        }, function() {
            that.requestUsage();
        });

        //Save Maximum Usage
        chrome.storage.sync.set({
            'maximumUsage': this.maximumUsage
        }, function() {
            //Error here - need to fix - should be saving the download values in a model
            //this.amounts.currentMonthPercentage = this.getUsagePercentage(iPeakDownload, that.maximumUsage.value);
            that.updatePercentage();
        });
    };

    $scope.onClickSettingsTitle = function() {
        this.settingsHidden = !this.settingsHidden;
    };

    $scope.requestUsage = function() {
        var sApiKey = this.apiKey;
        var req = new XMLHttpRequest();
        req.open("GET", this.sUsageURL, true);
        req.setRequestHeader("TekSavvy-APIKey", sApiKey);
        req.onload = this.onRequestUsageSuccess.bind(this);
        req.send(null);
    };

    $scope.onRequestUsageSuccess = function(e) {
        if (!e.target.response) {
            //API Key bad - display error 
            this.amounts.currentMonthAmount = "";
            this.amounts.currentMonthAmountError = "Error retreiving data: Check API Key";
            this.amounts.currentMonthPercentage = "";
            //Experienced issue with view updating, manually trigger update
            $scope.$digest();
            return;
        }

        var oUsage = JSON.parse(e.target.response);

        var iPeakDownload = oUsage.value[0].OnPeakDownload;
        var iPeakUpload = oUsage.value[0].OnPeakUpload;

        var iOffPeakDownload = oUsage.value[0].OffPeakDownload;
        var iOffPeakUpload = oUsage.value[0].OffPeakUpload;


        this.amounts.currentMonthAmount = iPeakDownload.toFixed(2).toString() + " GB";
        this.amounts.currentMonthAmountError = "";
        this.amounts.currentMonthPercentage = this.getUsagePercentage(iPeakDownload, this.maximumUsage.value);

        //Experienced issue with view updating, manually trigger update
        $scope.$digest();
    };

    $scope.getUsagePercentage = function(iUsage, iMaximumUsage) {
        if (iMaximumUsage !== 0) {
            var iPercentageUsage = (iUsage / parseInt(iMaximumUsage) * 100);
            return iPercentageUsage.toFixed(0) + "%";
        } else {
            return "";
        }
    };
});
