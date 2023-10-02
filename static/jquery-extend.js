(function ($) {
    $.fn.firmDown = function (callback) {
        return this.each(function () {
            const element = this;

            if (callback) {
                element.onFirmDown = callback;
            } else {
                if (element.onFirmDown) element.onFirmDown.call(element);
            }
        });
    };
    $.fn.firmUp = function (callback) {
        return this.each(function () {
            const element = this;

            if (callback) {
                element.onFirmUp = callback;
            } else {
                if (element.onFirmUp) element.onFirmUp.call(element);
            }
        });
    };
})(jQuery);