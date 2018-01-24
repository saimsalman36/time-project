// INDICATE DEVELOPER MODE
if(config.host.indexOf('localhost') !== -1) {
    chrome.browserAction.setBadgeText({
        text: 'D'
    });
}


var gUser = null;
var gTimeWastedToday = 0;
var gMaxTime = 1000 * 60 * 60;
var gTransactions = [];

var MIN_UPDATE_INTERVAL = 1000 * 60 * 5;    // 5 minutes
var gTimer = null;

var activeTabId = 0;

var gActivityMonitor = new ActivityMonitor();
gActivityMonitor.on('new-log', function(log) {
    console.log(log);
});

var gActivityReporter = new ActivityReporter(gActivityMonitor);
gActivityReporter.on('after-report', function() {
    getLogs().then(updateIcon).then(getUserInfo);
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if(tabId === activeTabId && changeInfo.status && changeInfo.status === 'complete' && tab.url) {
        gActivityMonitor.activityChanged(tab.url);  // Loading completed in active tab, so now we know url
    }

    // check authorization
    if(changeInfo.status && changeInfo.status === 'complete' && tab.url && tab.url.indexOf(config.host) !== -1) {
        getUserInfo().then(updateIcon);
    }
});

// Active tab changed
chrome.tabs.onActivated.addListener(function(activeInfo) {
    // when document not loaded yet - we don't know it's url,
    // so just remember activeTabId and get url in "complete" event listener (above)
    activeTabId = activeInfo.tabId;

    chrome.tabs.get(activeInfo.tabId, function(tab) {
        if(tab.url) {
            gActivityMonitor.activityChanged(tab.url);  // active tab changed and it has an url
        }
    });
});

// Listen messages from popup
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.command && request.command === 'status') {
            sendResponse({
                user: gUser,
                remainingTime: makeRemainingTimeText(gTimeWastedToday),
                wastedToday: gTimeWastedToday > gMaxTime,
                oneBuckWithdrawn: !!gTransactions.length
            });
        }
    });

function makeRemainingTimeText(timeWasted) {
    var remainingMinutes = (timeWasted > gMaxTime) ? 0 : Math.ceil((gMaxTime - timeWasted) / (1000 * 60));

    return remainingMinutes + ' ' + ((remainingMinutes === 1) ? 'minute' : 'minutes');
}


function getUserInfo() {
    if(gTimer) {
        clearTimeout(gTimer);
    }

    // if nothing related to facebook activity will happen – update status on timeout
    gTimer = setTimeout(function() {
        getUserInfo().then(getLogs).then(updateIcon);
    }, MIN_UPDATE_INTERVAL);

    return $.get(config.host + '/users/me').then(function(user) {
        console.log(user);
        gUser = user;
    });
}


function getLogs() {
    var todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    return $.get(config.host + '/logs', { start: todayStart.getTime(), end: todayStart.getTime() + 1000 * 60 * 60 * 24}).then(function(logs) {
       gTimeWastedToday = logs.map(function(log) {
            return (new Date(log.end)).getTime() -  (new Date(log.start)).getTime();
        }).reduce(function(a, b) {
            return a + b;
        }, 0);

        if(gTimeWastedToday > gMaxTime) {
            return getTransactions().then(getUserInfo);
        } else {
            return $.Deferred().resolve();
        }
    });
}

function getTransactions() {
    var todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    return $.get(config.host + '/transactions', { start: todayStart.getTime(), end: todayStart.getTime() + 1000 * 60 * 60 * 24}).then(function(transactions) {
        gTransactions = transactions;
    });
}

function updateIcon() {
    if(gUser && gUser.balance) {
        if(gTimeWastedToday > gMaxTime) {
            chrome.browserAction.setIcon({
                path: 'i/16_wasted.png'
            });
        } else {
            chrome.browserAction.setIcon({
                path: 'i/16_ok.png'
            });
        }
    } else {
        chrome.browserAction.setIcon({
            path: 'i/16_na.png'
        });
    }

    return $.Deferred().resolve();
}

$(function() {
    getUserInfo().then(getLogs).then(updateIcon);
});