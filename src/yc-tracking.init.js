/* global initYcTrackingCore initYcTrackingMagentoModule initYcTrackingShopwareModule */
var initYcTracking = function (context) {

    initYcTrackingCore(context);
    initYcTrackingMagentoModule(context);
    initYcTrackingShopwareModule(context);

    return context.YcTracking;
};

if (typeof define === 'function' && define.amd) {
    // Expose YcTracking as an AMD module if it's loaded with RequireJS or similar.
    define(function () {
        return initYcTracking({});
    });
} else {
    // Load YcTracking normally (creating a YcTracking global) if not using an AMD loader.
    initYcTracking(this);
}
