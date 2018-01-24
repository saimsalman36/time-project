function ActivityReporter(activityMonitor) {
    this._logUrl = "/logs";

    if(activityMonitor) {
        this.attachMonitor(activityMonitor);
    }

    EventEmitter.call(this);
}

ActivityReporter.prototype = new EventEmitter;

ActivityReporter.prototype.attachMonitor = function(activityMonitor) {
    activityMonitor && activityMonitor.on('new-log', function(log) {
        this.reportLog(log);
    }.bind(this));
};

ActivityReporter.prototype.reportLog = function(log) {
    $.post(this.getReportUrl(), log).then(function() {
        this.emit('after-report');
    }.bind(this));
};

ActivityReporter.prototype.getReportUrl = function() {
    return config.host + this._logUrl;
};