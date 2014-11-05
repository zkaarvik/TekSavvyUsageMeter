var teksavvyApp = angular.module('teksavvyApp', ['ngMaterial']);

teksavvyApp.controller('AppController', function($scope, $mdBottomSheet) {
    $scope.textElements = {
        title: "TekSavvy Usage Meter",
        currentUsage: "Current Monthly Usage:",
        settings: "Settings",
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
    $scope.settingsVisible = false;
    $scope.progressVisible = false;
    $scope.amounts = {
        currentMonthAmount: "",
        currentMonthAmountError: "",
        currentMonthPercentage: ""
    };
    $scope.usage = {
        iPeakDownload: "",
        iPeakUpload: "",
        iPeakTotal: "",
        iOffPeakDownload: "",
        iOffPeakUpload: "",
        iOffPeakTotal: ""
    };
    $scope.settings = {
        apiKey: ""
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
                that.settings.apiKey = data.apiKey;
                that.requestUsage();
            }
        });
    };

    $scope.onClickSettings = function($event) {
        $mdBottomSheet.show({
            templateUrl: 'settings-list-template.html',
            controller: 'SettingsSheetController',
            targetEvent: $event
        });
    };

    $scope.requestUsage = function() {
        //Start request - show progress meter
        this.progressVisible = true;
        $scope.$digest();

        var sApiKey = this.settings.apiKey;
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
        } else {
            var oUsage = JSON.parse(e.target.response);

            this.usage.iPeakDownload = oUsage.value[0].OnPeakDownload;
            this.usage.iPeakUpload = oUsage.value[0].OnPeakUpload;
            this.usage.iPeakTotal = this.usage.iPeakDownload + this.usage.iPeakUpload;
            this.usage.iOffPeakDownload = oUsage.value[0].OffPeakDownload;
            this.usage.iOffPeakUpload = oUsage.value[0].OffPeakUpload;
            this.usage.iOffPeakTotal = this.usage.iOffPeakDownload + this.usage.iOffPeakUpload;

            this.setCurrentMonthValues();
        }

        //Experienced issue with view updating, manually trigger update

        //Start request - show progress meter
        this.progressVisible = false;
        $scope.$digest();
    };

    $scope.setCurrentMonthValues = function() {
        this.amounts.currentMonthAmount = this.usage.iPeakDownload.toFixed(2).toString() + " GB";
        this.amounts.currentMonthAmountError = "";
        this.amounts.currentMonthPercentage = this.getUsagePercentage(this.usage.iPeakDownload, this.maximumUsage.value);
    };

    $scope.getUsagePercentage = function(iUsage, iMaximumUsage) {
        if (iMaximumUsage !== 0) {
            var iPercentageUsage = (iUsage / parseInt(iMaximumUsage) * 100);
            return iPercentageUsage.toFixed(0);
        } else {
            return "";
        }
    };
});

teksavvyApp.controller('SettingsSheetController', function($scope, $mdBottomSheet) {
    $scope.textElements = {
        settingsHeader: "Settings",
        apiKey: "API Key",
        save: "Save"
    };

    $scope.onClickSave = function() {
        var that = this;

        //Save API Key and request usage
        chrome.storage.sync.set({
            'apiKey': this.settings.apiKey
        }, function() {
            that.requestUsage();
        });

        //Save Maximum Usage
        chrome.storage.sync.set({
            'maximumUsage': this.maximumUsage
        }, function() {
            that.setCurrentMonthValues();
        });
    };
});