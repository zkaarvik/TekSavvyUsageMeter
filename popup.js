var teksavvyApp = angular.module('teksavvyApp', ['ngMaterial']);

teksavvyApp.controller('AppController', ['$scope', '$http', '$mdBottomSheet', '$mdToast', function($scope, $http, $mdBottomSheet, $mdToast) {
    $scope.textElements = {
        title: "TekSavvy Usage Meter",
        currentUsage: "Current Monthly Usage:",
        settings: "Settings",
        peakDownload: "Peak Download",
        peakUpload: "Peak Upload",
        peakTotal: "Peak Total",
        offPeakDownload: "Off Peak Download",
        offPeakUpload: "Off Peak Upload",
        offPeakTotal: "Off Peak Total"
    };

    $scope.sTekSavvyApiUrl = "https://api.teksavvy.com/web/Usage/UsageSummaryRecords?$filter=IsCurrent%20eq%20true";
    $scope.state = {
        progressVisible: false,
        usagePercentageContainerVisible: false,
        usageBigNumberContainerVisible: false
    };
    $scope.amounts = {
        currentMonthAmount: "",
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
            }
            that.requestUsage();
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

        var that = this;
        $http.get(this.sTekSavvyApiUrl, {
                headers: {"TekSavvy-APIKey": this.settings.apiKey}
            }).
            success(function(data, status, headers, config) {
                var oUsage = data.value[0];

                that.usage.iPeakDownload = oUsage.OnPeakDownload;
                that.usage.iPeakUpload = oUsage.OnPeakUpload;
                that.usage.iPeakTotal = that.usage.iPeakDownload + that.usage.iPeakUpload;
                that.usage.iOffPeakDownload = oUsage.OffPeakDownload;
                that.usage.iOffPeakUpload = oUsage.OffPeakUpload;
                that.usage.iOffPeakTotal = that.usage.iOffPeakDownload + that.usage.iOffPeakUpload;

                that.setCurrentMonthValues();

                //End request - hide progress meter
                that.state.progressVisible = false;

            }).
            error(function(data, status, headers, config) {
                //API Key bad - display error 
                that.amounts.currentMonthAmount = "";
                that.amounts.currentMonthPercentage = "";

                $mdToast.show({
                  template: '<md-toast>API key missing or invalid. Check settings.</md-toast>',
                  hideDelay: 3000
                });
                that.state.usagePercentageContainerVisible = false;
                that.state.usageBigNumberContainerVisible = false;

                //End request - hide progress meter
                that.state.progressVisible = false;
            });
    };

    $scope.setCurrentMonthValues = function() {
        this.amounts.currentMonthAmount = this.usage.iPeakDownload.toFixed(2).toString() + " GB";
        this.amounts.currentMonthPercentage = this.getUsagePercentage(this.usage.iPeakDownload, this.settings.maximumUsage);
        
        //Show usage percentage if maximum usage !== 0, otherwise hide
        if(this.settings.maximumUsage && this.settings.maximumUsage !== 0) {
            //Setting the percentage to zero and back to the real value after a timeout preserves the animation
            //  being broken from initially hiding the usage percentage container
            var tempPercentage = this.amounts.currentMonthPercentage;
            this.amounts.currentMonthPercentage = 0;
            this.state.usagePercentageContainerVisible = true;
            this.state.usageBigNumberContainerVisible = false;

            var that = this;
            setTimeout( function() {
                that.amounts.currentMonthPercentage = tempPercentage;
                $scope.$digest();
            }, 20 );

        } else {
            this.state.usagePercentageContainerVisible = false;
            this.state.usageBigNumberContainerVisible = true;
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
        bandwidthCap: "Bandwidth Cap (GB) (Optional)"
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
});

teksavvyApp.filter('GB', function() {
    return function(input) {
        var numberInput = parseInt(input);

        if(typeof(numberInput) !== "number" || isNaN(numberInput)) {
            return "";
        } else {
            return input.toFixed(2) + " GB";
        }
    };
});