var teksavvyApp = angular.module('teksavvyApp', ['ngMaterial']);

teksavvyApp.controller('AppController', ['$scope', '$mdBottomSheet', function($scope, $mdBottomSheet) {
    $scope.textElements = {
        title: "TekSavvy Usage Meter",
        currentUsage: "Current Monthly Usage:",
        settings: "Settings"
    };

    $scope.sTekSavvyApiUrl = "https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true";
    $scope.state = {
        progressVisible: false,
        usagePercentageContainerVisible: false
    };
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
        this.state.progressVisible = true;
        $scope.$digest();

        var sApiKey = this.settings.apiKey;
        var req = new XMLHttpRequest();
        req.open("GET", this.sTekSavvyApiUrl, true);
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

        //Start request - show progress meter
        this.state.progressVisible = false;
        $scope.$digest();
    };

    $scope.setCurrentMonthValues = function() {
        this.amounts.currentMonthAmount = this.usage.iPeakDownload.toFixed(2).toString() + " GB";
        this.amounts.currentMonthAmountError = "";
        this.amounts.currentMonthPercentage = this.getUsagePercentage(this.usage.iPeakDownload, this.settings.maximumUsage);
        
        //Show usage percentage if maximum usage !== 0, otherwise hide
        if(this.settings.maximumUsage && this.settings.maximumUsage !== 0) {
            //Setting the percentage to zero and back to the real value after a timeout preserves the animation
            //  being broken from initially hiding the usage percentage container
            var tempPercentage = this.amounts.currentMonthPercentage;
            this.amounts.currentMonthPercentage = 0;
            this.state.usagePercentageContainerVisible = true;

            var that = this;
            setTimeout( function() {
                that.amounts.currentMonthPercentage = tempPercentage;
                $scope.$digest();
            }, 20 );

        } else {
            this.state.usagePercentageContainerVisible = false;
        }
    };

    $scope.getUsagePercentage = function(iUsage, iMaximumUsage) {
        if (iMaximumUsage !== 0) {
            var iPercentageUsage = (iUsage / parseInt(iMaximumUsage) * 100);
            return iPercentageUsage.toFixed(0);
        } else {
            return "0";
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

        if(typeof(numberInput) !== "number" || numberInput === 0 || isNaN(numberInput)) {
            return "";
        } else {
            return input.toString() + "%";
        }
    };
})