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

    $scope.iTotalPeak = 0;
    $scope.sUsageURL = "https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true";
    $scope.settingsHidden = true;
    $scope.amounts = {
        currentMonthAmount: "",
        currentMonthAmountError: "",
        currentMonthPercentage: ""
    };


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
                that.requestUsage(data.apiKey);

                that.apiKey = data.apiKey;
            }
        });
    };

    $scope.onClickSave = function() {
        var that = this;

        //Save API Key and request usage
        chrome.storage.sync.set({
            'apiKey': this.apiKey
        }, function() {
            if (this.args[1].apiKey) {
                that.requestUsage(this.args[1].apiKey);
            }
        });

        //Save Maximum Usage
        chrome.storage.sync.set({
            'maximumUsage': this.maximumUsage
        }, function() {
            that.updatePercentage();
        });
    };

    $scope.onClickSettingsTitle = function() {
        this.settingsHidden = !this.settingsHidden;
    };

    $scope.requestUsage = function(sApiKey) {
        var req = new XMLHttpRequest();
        req.open("GET", this.sUsageURL, true);
        req.setRequestHeader("TekSavvy-APIKey", sApiKey);
        req.onload = this.processUsage.bind(this);
        req.send(null);
    };

    $scope.processUsage = function(e) {
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
        this.iTotalPeak = iPeakDownload;

        var iOffPeakDownload = oUsage.value[0].OffPeakDownload;
        var iOffPeakUpload = oUsage.value[0].OffPeakUpload;


        this.amounts.currentMonthAmount = this.iTotalPeak.toFixed(2).toString() + " GB";
        this.amounts.currentMonthAmountError = "";

        this.updatePercentage();

        //Experienced issue with view updating, manually trigger update
        $scope.$digest();
    };

    $scope.updatePercentage = function() {
        if (this.maximumUsage.value !== 0) {
            var iPercentageUsage = (this.iTotalPeak / parseInt(this.maximumUsage.value) * 100);
            this.amounts.currentMonthPercentage = iPercentageUsage.toFixed(0) + "%";
        } else {
            this.amounts.currentMonthPercentage = "";
        }
    };
});