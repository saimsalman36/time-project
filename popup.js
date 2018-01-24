// Init UI
$(function() {
    chrome.runtime.sendMessage({command: 'status'}, function(status) {
        $('.popup').hide();

        if(status && status.user) {
            // Update balance info
            $('.balance').html('$' + status.user.balance);

            $('.remaining-time').html(status.remainingTime);

            $('.will-was').html(status.oneBuckWithdrawn ? 'was' : 'will be');

            if(!status.user.paid) {
                $('.popup.post-install').show();
            } else if(status.user.balance > 0) {
                if(status.wastedToday) {
                    $('.popup.one-buck').show();
                } else {
                    $('.popup.remaining').show();
                }
            } else {
                $('.popup.wasted').show();
            }
        } else {
            $('.popup.auth').show();
        }
    });
});