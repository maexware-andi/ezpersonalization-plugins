/* global Handlebars */

/**
 * Reference to global object.
 */
var Fn = Function, GLOBAL = new Fn('return this')();

/**
 * Init wrapper for the core module.
 * @param {Object} context The Object that the YcTracking gets attached to in yc-tracking.init.js.
 * If the YcTracking was not loaded with an AMD loader such as require.js, this is the global Object.
 */
function initYcTrackingCore(context) {
    'use strict';

    /**
     * Constructor for the YcTracking Object.
     *
     * @constructor
     */
    var YcTracking = function () {

        /**
         * Holds customer Id. This should be automatically populated on server from request to js when serving js.
         * Request is in format https://cdn.yoochoose.net/v1/100001/tracking.js, where 100001 is customer id.
         *
         * @private
         * @readonly
         * @type {number}
         */
        var customerId = YC_CUSTOMER_ID,

            /**
             * Holds path to event tracking api with customer id.
             *
             * @private
             * @readonly
             * @type {string}
             */
            eventHost = YC_RECO_EVENT_HOST + customerId,

            /**
             * Holds path to product recommendations api with customer id.
             *
             * @private
             * @readonly
             * @type {string}
             */
            recommendationHost = YC_RECO_RECOM_HOST_V2 + customerId,

            /**
             * Duration of session in minutes.
             *
             * @private
             * @readonly
             * @type {number}
             */
            sessionDuration = 30,

            /**
             * Name of local storage store.
             *
             * @private
             * @readonly
             * @type {string}
             */
            storeId = 'YCStore',

            /**
             * Checks if local storage can be used to store user data.
             * https://github.com/Modernizr/Modernizr/blob/master/feature-detects/storage/localstorage.js
             *
             * @private
             * @returns {boolean}
             */
            _canUseLocalStorage = function () {
                var mod = 'yc_localStorageTest';
                try {
                    GLOBAL.localStorage.setItem(mod, mod);
                    GLOBAL.localStorage.removeItem(mod);
                    return true;
                } catch (e) {
                    return false;
                }
            },

            /**
             * Gets user data from local storage.
             *
             * @private
             * @returns {object}
             */
            _getLocalStore = function () {
                return _canUseLocalStorage() ? JSON.parse(GLOBAL.localStorage.getItem(storeId)) : null;
            },

            /**
             * Saves user data to local storage.
             *
             * @private
             * @param {object} value - Data to store.
             */
            _setLocalStore = function (value) {
                if (_canUseLocalStorage()) {
                    GLOBAL.localStorage.setItem(storeId, JSON.stringify(value));
                } else {
                    throw 'Local storage not supported!';
                }
            },

            /**
             * Generates unique identifier.
             *
             * @private
             * @returns {string}
             */
            _generateGuid = function () {
                /**
                 * @returns {string}
                 */
                var S4 = function () {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                };
                return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
            },

            /**
             * Gets or sets user identifier using local store.
             * Stores user identifier if supplied through parameter userId.
             *
             * @private
             * @param {string} [userId] - User identifier
             * @returns {string}
             */
            _userIdFromLocalStorage = function (userId) {
                var userData = _getLocalStore(),
                    expirationDate = new Date();

                expirationDate.setMinutes(expirationDate.getMinutes() + sessionDuration);
                if (!userId) {
                    if (userData && userData.expires > new Date().getTime()) {
                        userId = userData.userId;
                    } else {
                        userId = _generateGuid();
                    }
                }

                _setLocalStore({ userId: userId, expires: expirationDate.getTime() });
                return userId;
            },

            /**
             * Gets or sets user identifier using cookie.
             * Stores user identifier if supplied through parameter userId.
             *
             * @private
             * @param {string} [userId] - User identifier
             * @returns {string}
             */
            _userIdFromCookie = function (userId) {
                var cookieId = 'YCCookie',
                    cookieValue = GLOBAL.document.cookie,
                    expirationDate = new Date(),
                    c_start = cookieValue.indexOf(' ' + cookieId + '='),
                    c_end;

                expirationDate.setMinutes(expirationDate.getMinutes() + sessionDuration);
                if (!userId) {
                    if (c_start === -1) {
                        c_start = cookieValue.indexOf(cookieId + '=');
                    }

                    if (c_start === -1) {
                        userId = _generateGuid();
                    } else {
                        c_start = cookieValue.indexOf('=', c_start) + 1;
                        c_end = cookieValue.indexOf(';', c_start);
                        if (c_end === -1) {
                            c_end = cookieValue.length;
                        }

                        userId = decodeURI(cookieValue.substring(c_start, c_end));
                    }
                }

                GLOBAL.document.cookie = cookieId + '=' + encodeURI(userId) + '; expires=' + expirationDate.toUTCString() + '; path=/';
                return userId;
            },

            /**
             * Gets or sets current user identifier. It tries to use local storage if browser supports it.
             * If not, cookie is used.
             * If userId is set, local user identifier will be updated.
             *
             * @private
             * @param {string} [userId] - User identifier to set.
             * @returns {string} User identifier.
             */
            _userId = function (userId) {
                if (_canUseLocalStorage()) {
                    return _userIdFromLocalStorage(userId);
                }

                return _userIdFromCookie(userId);
            },

            /**
             * Executes call to remote server by placing pixel image.
             *
             * @private
             * @param {string} url - Url to call.
             */
            _executeEventCall = function (url) {
                // event tracking is using pixel method because server does not support JSONP response
                var img = new Image(1, 1);
                img.src = eventHost + url;
            };

        /**
         * Resets user identifier. Should be called when user logs out.
         */
        this.resetUser = function () {
            return _userId(_generateGuid());
        };

        /**
         * Gets current user identifier used in tracking calls.
         *
         * @returns {string}
         */
        this.getUserId = function () {
            return _userId();
        };

        /**
         * Method for tracking Click event.
         *
         * @param {number} itemTypeId
         * @param {string} itemId
         * @param {string} [categoryPath] The forward slash separated path of categories of the item.
         * @param {string} language
         * @return {YcTracking} This object's instance.
         */

        /**
         * Method for tracking Click event.
         *
         * @param {number} itemTypeId
         * @param {string} itemId
         * @param {string} [categoryPath] The forward slash separated path of categories of the item.
         * @param {string} language
         * @param {string} title
         * @param {string} productUrl
         * @param {string} image
         * @param {string} price
         * @returns {YcTracking} This object's instance.
         */
        this.trackClick = function (itemTypeId, itemId, categoryPath, language, title, productUrl, image, price) {
            var url = '/click/' + _userId() + '/' + itemTypeId + '/' + itemId;
            
            url += '?categorypath=' + (categoryPath ? encodeURIComponent(categoryPath) : '');
            url += '&lang=' + language;
            url += title ? '&title=' + encodeURIComponent(title) : '';
            url += productUrl ? '&url=' + encodeURIComponent(productUrl) : '';
            url += image ? '&image=' + encodeURIComponent(image) : '';
            url += price ? '&price=' + encodeURIComponent((price + '').replace(',', '.')) : '';

            _executeEventCall(url);
            return this;
        };

        /**
         * Method for tracking Rate event.
         *
         * @param {number} itemTypeId
         * @param {string} itemId
         * @param {number} rating The rating a user gives an item. Value range: [0-100]
         * @param {string} language
         * @return {YcTracking} This object's instance.
         */
        this.trackRate = function (itemTypeId, itemId, rating, language) {
            var url = '/rate/' + _userId() + '/' + itemTypeId + '/' + itemId + '?rating=' + rating + '&lang=' + language;
            _executeEventCall(url);
            return this;
        };

        /**
         * Method for tracking Basket event.
         *
         * @param {number} itemTypeId
         * @param {string} itemId
         * @param {string} [categoryPath] The category path from where the item is placed into the shopping cart.
         * @param {string} language
         * @return {YcTracking} This object's instance.
         */
        this.trackBasket = function (itemTypeId, itemId, categoryPath, language) {
            var url = '/basket/' + _userId() + '/' + itemTypeId + '/' + itemId;

            url += '?categorypath=' + (categoryPath ? encodeURIComponent(categoryPath) : '');
            url += '&lang=' + language;

            _executeEventCall(url);
            return this;
        };

        /**
         * Method for tracking Buy event.
         *
         * @param {number} itemTypeId
         * @param {string} itemId
         * @param {number} quantity The number of items the user bought.
         * @param {number} price A price in decimal format for a <b>single item</b>.
         *      If the price has a decimal part, the dot must be used.
         * @param {string} currencyCode
         * @param {string} language
         * @return {YcTracking} This object's instance.
         */
        this.trackBuy = function (itemTypeId, itemId, quantity, price, currencyCode, language) {
            var url = '/buy/' + _userId() + '/' + itemTypeId + '/' + itemId +
                '?fullprice=' + (price + '').replace(',', '.') + currencyCode + '&quantity=' + quantity
                + '&lang=' + language;

            _executeEventCall(url);
            return this;
        };

        /**
         * Method for tracking Login (Transfer) event.
         *
         * @param {string} targetUserId - New user ID
         * @return {YcTracking} This object's instance.
         */
        this.trackLogin = function (targetUserId) {
            var userID = _userId();
            if (targetUserId && userID !== targetUserId) {
                _executeEventCall('/login/' + userID + '/' + encodeURIComponent(targetUserId));
                _userId(targetUserId);
            }

            return this;
        };

        /**
         * Method for tracking Rendered event.
         *
         * @param {number} itemTypeId
         * @param {string[]} itemIds - Array of item identifiers (string).
         * @param {string} scenario - Recommendation scenario.
         * @return {YcTracking} This object's instance.
         */
        this.trackRendered = function (itemTypeId, itemIds, scenario) {
            var url = '/rendered/' + _userId() + '/' + itemTypeId + '/';

            if (!Array.isArray(itemIds)) {
                itemIds = [itemIds];
            }

            if (itemIds.length > 0) {
                url += itemIds.join(',');
                url += scenario ? '?scenario=' + encodeURIComponent(scenario) : '';
                _executeEventCall(url);
            }

            return this;
        };

        /**
         * Method for tracking Click Recommended (Follow) event.
         *
         * @param {number} itemTypeId
         * @param {number} itemId
         * @param {string} scenario Name of the scenario, where recommendations originated from.
         * @return {YcTracking} This object's instance.
         */
        this.trackClickRecommended = function (itemTypeId, itemId, scenario) {
            var url = '/clickrecommended/' + _userId() + '/' + itemTypeId + '/' + itemId + '?scenario=' + encodeURIComponent(scenario);

            _executeEventCall(url);
            return this;
        };

        /**
         * Method for tracking Consume event.
         *
         * @param {number} itemTypeId
         * @param {string} itemId
         * @param {number} percentage It defines how much of an item was consumed,
         *      e.g. an article was read only by 20%, a movie was watched by 90% or someone finished 3/4
         *      of all levels of a game. Value range: [0-100]
         * @return {YcTracking} This object's instance.
         */
        this.trackConsume = function (itemTypeId, itemId, percentage) {
            _executeEventCall('/consume/' + _userId() + '/' + itemTypeId + '/' + itemId + (percentage ? '?percentage=' + percentage : ''));
            return this;
        };

        /**
         * Method for tracking Blacklist event.
         *
         * @param {number} itemTypeId
         * @param {string} itemId
         * @return {YcTracking} This object's instance.
         */
        this.trackBlacklist = function (itemTypeId, itemId) {
            var url = '/blacklist/' + _userId() + '/' + itemTypeId + '/' + itemId;
            _executeEventCall(url);
            return this;
        };

        /**
         * Method for fetching product ids for recommendation scenario.
         * Generates JSONP call to server.
         *
         * @param {object} config - This object contains all paramaters needed to make API call
         * @returns {YcTracking} This object's instance.
         */
        this.callFetchRecommendedProducts = function (config) {
            var script = document.createElement('script'),
                url = recommendationHost + '/' + _userId() + '/' + config.scenario +
                        '.jsonp?numrecs=' + (config.count * 2) + '&outputtypeid=' + config.itemTypeId +
                        '&jsonpcallback=' + config.callback;

            url += '&contextitems=' + (config.products ? encodeURIComponent(config.products) : '');
            url += '&categorypath=' + (config.categoryPath ? encodeURIComponent(config.categoryPath) : '');
            url += '&usecontextcategorypath=' + (config.useContextCategoryPath === true);
            url += '&recommendCategory=' + (config.recommendCategory  === true);

            config.attributes.forEach(function (attr) {
                url += '&attribute=' + encodeURIComponent(attr);
            });

            if (config.attributeValues) {
                for (var atr in config.attributeValues) {
                    if (config.attributeValues.hasOwnProperty(atr)) {
                        url += '&' + atr + '=' + config.attributeValues[atr];
                    }
                }
            }

            script.src = url;
            document.getElementsByTagName('head')[0].appendChild(script);

            return this;
        };

        /**
         * Renders recommendation boxes and displays them on frontend page.
         * 
         * @param {object} box
         */
        this.renderRecommendation = function(box) {
            var template = box.template,
                section = template.html_template,
                num = 0,
                compiled,
                wrapper = document.createElement('div'),
                rows = [],
                columns = [],
                elem = document.querySelector(template.target);

            if (!box.products || !box.products.length || !elem) {
                return;
            }

            box.products.forEach(function (product) {
               num++;
               columns.push(product);
               if ((num % template.columns) === 0) {
                    rows.push({'columns' : columns});
                    columns = [];
                }
            });
            if (columns.length) {
                rows.push({'columns' : columns});
            }

            box.rows = rows;
            compiled = Handlebars.compile(section);
            wrapper.innerHTML = compiled(box);
            elem.appendChild(wrapper);
        };

        return this;
    };
    
    var YcValidator = {

        /**
         * Validates integer number.
         *
         * @param {*} param - Variable to validate. Numbers with exponent (e.g. 12e3) will not pass validation.
         * @param {boolean} throwException - If set to true, exception will be thrown if variable is not valid.
         * @returns {*|boolean}
         */
        validateInt: function (param, throwException) {
            var result = /^-?\d+$/.test(param);
            if (!result && throwException) {
                throw 'Param is not valid. Expected integer.';
            }

            return result;
        },

        /**
         * Validates floating point number number. Numbers with exponent (e.g. 12.4e3) will not pass validation.
         *
         * @param {*} param - Variable to validate.
         * @param {boolean} throwException - If set to true, exception will be thrown if variable is not valid.
         * @returns {*|boolean}
         */
        validateFloat: function (param, throwException) {
            var result = /^-?\d*(\.\d*)?$/.test(param);
            if (!result && throwException) {
                throw 'Param is not valid. Expected number.';
            }

            return result;
        }
    };

    context.YcTracking = new YcTracking();
    context.YcValidator = YcValidator;
}
