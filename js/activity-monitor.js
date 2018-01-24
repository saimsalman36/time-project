var activities = [{
    type: 'facebook',
    urlRE: /https?:\/\/(www\.)?facebook\.com/
}];

function ActivityMonitor() {
    this._log = [];

    this._currentActivity = null;

    this._flushInterval = 1000 * 60 * 1;

    this._timer = setInterval(this.flushLog.bind(this), this._flushInterval);

    EventEmitter.call(this);
}

ActivityMonitor.prototype = new EventEmitter();

ActivityMonitor.prototype.activityChanged = function(url) {
    var activityName = this.getActivityType(url);

    if(this._currentActivity && activityName != this._currentActivity.type) {
        this.flushLog();
        this._currentActivity = null;
    }

    if(activityName) {
        this.startLog(activityName);
    }
};

ActivityMonitor.prototype.flushLog = function() {
    if(this._currentActivity) {
        this._currentActivity.end = Date.now();

        this.emit('new-log', this._currentActivity);

        this._currentActivity.start = Date.now();
        delete this._currentActivity.end;
    }
};

ActivityMonitor.prototype.getActivityType = function(url) {
    for(var i = 0; i < activities.length; i++) {
        if(activities[i].urlRE.test(url)) {
            return activities[i].type;
        }
    }

    return false;
};

ActivityMonitor.prototype.startLog = function(activityType) {
    this._currentActivity = {
        type: activityType,
        start: Date.now()
    };
};