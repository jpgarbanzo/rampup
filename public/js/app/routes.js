/**                   _
 *  _             _ _| |_
 * | |           | |_   _|
 * | |___  _   _ | | |_|
 * | '_  \| | | || | | |
 * | | | || |_| || | | |
 * |_| |_|\___,_||_| |_|
 *
 * (c) Huli Inc
 */

define([
    'ju-mvc/page-manager'
    ],
    function(
        PageManager
    ) {

    'use strict';

    var routesDef = {
        'nihao' : {
            route : 'nihao',
            defaultRoute : 'nihao',
            controller : 'app/common/component-controller',
            dependencies : {
                component : 'app/modules/landing/component'
            }
        }
    };

    // Register the routes mapping with the page manager
    PageManager.routes(routesDef);
});
