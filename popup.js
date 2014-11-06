var teksavvyApp = angular.module('teksavvyApp', ['ngMaterial']);

teksavvyApp.controller('AppController', ['$scope', '$mdBottomSheet', function($scope, $mdBottomSheet) {
    $scope.textElements = {
        title: "TekSavvy Usage Meter",
        currentUsage: "Current Monthly Usage:",
        settings: "Settings"
    };

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
        apiKey: "",
        maximumUsage: 0
    };

    $scope.init = function() {
        var that = this;

        //Retreive settings - if saved
        chrome.storage.sync.get('settings', function(data) {
            if (data.settings) {
                that.settings = data.settings; 
                that.requestUsage();
            }
        });
    };

    $scope.onClickSettings = function($event) {
        //Retain the context for the chrome storage callback
        var that = this;

        $mdBottomSheet.show({
            templateUrl: 'settings-list-template.html',
            controller: 'SettingsSheetController',
            locals: {settings: this.settings},
            targetEvent: $event
        }).then(function(newSettings) {
            //settings are returned from dialog, save to chrome storage and refresh usage data
            chrome.storage.sync.set({
                'settings': newSettings
            }, function() {
                that.requestUsage();
                that.setCurrentMonthValues();
            });
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
        this.amounts.currentMonthPercentage = this.getUsagePercentage(this.usage.iPeakDownload, this.settings.maximumUsage);
    };

    $scope.getUsagePercentage = function(iUsage, iMaximumUsage) {
        if (iMaximumUsage !== 0) {
            var iPercentageUsage = (iUsage / parseInt(iMaximumUsage) * 100);
            return iPercentageUsage.toFixed(0);
        } else {
            return "";
        }
    };
}]);

teksavvyApp.controller('SettingsSheetController', ['$scope', '$mdBottomSheet', 'settings', function($scope, $mdBottomSheet, settings) {
    $scope.textElements = {
        settingsHeader: "Settings",
        apiKey: "API Key",
        save: "Save",
        bandwidthCap: "Monthly Bandwidth Cap (GB)"
    };

    $scope.settings = settings;

    $scope.onClickSave = function() {
        $mdBottomSheet.hide(this.settings);
    };
}]);

teksavvyApp.filter('percentage', function() {
    return function(input) {
        var numberInput = parseInt(input);

        if(typeof(numberInput) === "number" && numberInput !== 0 && numberInput !== "NaN") {
            return input.toString() + "%";
        } else {
            return "";
        }
    };
})