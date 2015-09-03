function initYcTrackingModule(context) {

    'use strict';

    var YcTracking = context.YcTracking,
        templates = YC_RECO_TEMPLATES,
        currentPage = null,
        lang = null,
        currency = null,
        requestsSent = 0,
        responsesCount = 0,
        allBoxes = [];

    function getCategory() {
        var breadcrumbs = document.getElementsByClassName(YC_BREADCRUMBS)[0],
            crumbs,
            categories = [],
            i = 1;

        if (breadcrumbs) {
            crumbs = breadcrumbs.getElementsByTagName('a');
            for (; i < crumbs.length; i++) {
                categories.push(crumbs[i].text);
            }
        }

        return categories.join('/');
    }

    function trackClick() {
        var product = document.getElementsByName(YC_ARTICLE_ID_SELECTOR)[0],
            url = location.href,
            image = '',
            price = '',
            title = '',
            category = '';

        if (currentPage === 'product' && product) {
            price = document.querySelector(YC_ARTICLE_PRICE_SELECTOR.replace('{id}', product.value)).innerHTML + currency;
            title = document.querySelector(YC_ARTICLE_TITLE_SELECTOR.replace('{id}', product.value)).innerHTML;
            image = document.querySelector(YC_ARTICLE_IMAGE_SELECTOR.replace('{id}', product.value)).src;
            category = getCategory();
            YcTracking.trackClick(1, product.value, category, lang, title, url, image, price);
        }
    }

    function hookBasketEvent() {
        var buttons = document.querySelectorAll(YC_ADD_BASKET_BUTTON),
            i = 0,
            category,
            hookClickEvent = function (button) {
                var oldFunction = button.onclick,
                    productId,
                    form = button.form;

                productId = form.elements[YC_ARTICLE_ID_SELECTOR].value;

                button.onclick = function (e) {
                    YcTracking.trackBasket(1, productId, category, lang);
                    // we want to preserve old behaviour
                    if (oldFunction) {
                        oldFunction.call(this, e);
                    }
                }
            };

        if (buttons) {
            category = getCategory();
            for (; i < buttons.length; i++) {
                hookClickEvent(buttons[i]);
            }
        }
    }

    function trackBuyHandle() {
        var xmlHttp = null;

        if (currentPage === 'buyout') {
            if (window.XMLHttpRequest) {
                xmlHttp = new XMLHttpRequest();
            } else {
                xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
            }

            xmlHttp.onreadystatechange = function () {
                var response,
                    items = null;

                if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                    response = JSON.parse(xmlHttp.responseText);

                    if (response.data && response.data.OrderID) {
                        items = response.data.OrderConfirmationItemsList;
                        items.forEach(function (item) {
                            YcTracking.trackBuy(1, item.OrderConfirmationItemItemID, item.OrderConfirmationItemQuantity,
                                item.OrderConfirmationItemPrice, currency, lang);
                        });
                    }
                }
            };

            xmlHttp.open('GET', location.origin + '/rest/checkout/orderconfirmation/', true);
            xmlHttp.send();
        }
    }

    function processRecommendationBoxes() {
        var category = getCategory(),
            product,
            products,
            contextProducts = [],
            xmlHttp,
            i;

        switch (currentPage) {
            case 'product':
                allBoxes.push({id: 'related', template: templates.related});
                allBoxes.push({id: 'upselling', template: templates.upselling});
                product = document.getElementsByName(YC_ARTICLE_ID_SELECTOR)[0];
                if (product) {
                    contextProducts.push(product.value);
                }

                fetchRecommendations(contextProducts, category);
                break;
            case 'home':
                allBoxes.push({id: 'personal', template: templates.personal});
                allBoxes.push({id: 'bestseller', template: templates.bestseller});
                fetchRecommendations(contextProducts, category);
                break;
            case 'category':
                allBoxes.push({id: 'category_page', template: templates.category_page});
                products = document.querySelectorAll(YC_CATEGORY_LIST_PRODUCTS);
                for (i = 0; i < products.length; i++) {
                    contextProducts.push(products[i].value);
                }

                fetchRecommendations(contextProducts, category);
                break;
            case 'cart':
                allBoxes.push({id: 'crossselling', template: templates.crossselling});

                //fetch all cart items
                if (window.XMLHttpRequest) {
                    xmlHttp = new XMLHttpRequest();
                } else {
                    xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
                }

                xmlHttp.onreadystatechange = function () {
                    var response;
                    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                        response = JSON.parse(xmlHttp.responseText);
                        response.data.forEach(function (elem) {
                            contextProducts.push(elem.ID);
                        });

                        fetchRecommendations(contextProducts, category);
                    }
                };

                xmlHttp.open('GET', location.origin + '/rest/itemview/basketitemslist/', true);
                xmlHttp.send();
                break;
        }
    }

    function fetchRecommendations (products, category) {
        allBoxes.forEach(function (box) {
            var tpl = box.template,
                fncName;

            if (!tpl) {
                document.getElementsByTagName('body')[0].innerHTML +=
                    '<!-- Yoochoose: Template for ' + box.id + ' recommendation box is not found! -->';
                console.log('Template for ' + box.id + ' recommendation box is not found!');
                box.priority = 999;
                return;
            }

            if (tpl.display) {
                box.priority = tpl.priority;
                box.title = tpl.title;
                box.trackFollowEvent = trackFollowEvent;
                fncName = 'YcTracking_jsonpCallback' + box.id;
                window[fncName] = fetchRecommendedProducts(box);
                YcTracking.callFetchRecommendedProducts({
                    itemTypeId: 1,
                    scenario: tpl.scenario,
                    count: tpl.rows * tpl.columns,
                    products: products,
                    categoryPath: category,
                    callback: fncName,
                    attributes: YC_PRODUCT_ATTRIBUTES,
                    useContextCategoryPath: false,
                    recommendCategory: false,
                    attributeValues: null
                });
                requestsSent++;
            }
        });
    }

    function fetchRecommendedProducts(box) {
        return function (response) {
            var productIds = [],
                handleHistory = [];

            responsesCount++;
            if (!response.hasOwnProperty('recommendationItems') || !response.recommendationItems.length) {
                return;
            }

            box.products = [];
            response.recommendationItems.forEach(function (item) {
                var product = {
                    itemId: item.itemId
                };

                item.attributes.forEach(function (attribute) {
                    product[attribute.key] = attribute.values.length ? attribute.values[0] : '';
                });

                if (product.title) {
                    productIds.push(item.itemId);
                    box.products.push(product);
                }
            });

            if (responsesCount === requestsSent) {
                //sort recommendation boxes by priority
                allBoxes.sort(function (a, b) {
                    return a.priority - b.priority;
                });

                allBoxes.forEach(function (box) {
                    var renderedHandles = [],
                        currentBox = [];

                    if (!box.products) {
                        return;
                    }

                    //select products that weren't rendered in any of higher priority boxes
                    box.products.forEach(function (item) {
                        if (handleHistory.indexOf(item.itemId) === -1) {
                            currentBox.push(item);
                        }
                    });

                    //out of unique products, take first N products
                    box.products = currentBox.slice(0, box.template.rows * box.template.columns);

                    //add Ids of N selected products, so they wouldn't have duplicates
                    box.products.forEach(function (item) {
                        handleHistory.push(item.itemId);
                        renderedHandles.push(item.itemId);
                    });

                    YcTracking.trackRendered(1, renderedHandles, box.template.scenario);
                    YcTracking.renderRecommendation(box);
                    attachFollowEvents(box);
                });
            }
        };
    }

    function attachFollowEvents(box){
        var elem = document.getElementsByClassName('rendered-' + box.id), i;

        for (i = 0; i < elem.length; i++) {
            elem[i].onclick = trackFollowEvent(box.products[i], box.template.scenario);
        }
    }

    function trackFollowEvent(product, scenario) {
        return function () {
            YcTracking.trackClickRecommended(1, product.itemId, scenario);
        };
    }

    function logoutHandler(trackid) {
        if (!trackid && (typeof YcTracking.getUserId() === 'number')) {
            YcTracking.resetUser();
        }
    }

    window.onload = function () {
        var ycObject = context['yc_config_object'] ? context['yc_config_object'] : null,
            trackid = ycObject ? ycObject.trackid : null,
            script;

        lang = ycObject ? ycObject.lang : null;
        currentPage = ycObject ? ycObject.page : null;
        currency = ycObject ? ycObject.currency : null;

        if (!context['Handlebars']) {
            script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/handlebars.js/3.0.2/handlebars.min.js';
            document.getElementsByTagName('head')[0].appendChild(script);
        }

        YcTracking.trackLogin(trackid);
        trackClick();
        hookBasketEvent();
        trackBuyHandle();
        logoutHandler(trackid);
        processRecommendationBoxes();
    };
}
