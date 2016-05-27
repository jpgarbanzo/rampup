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

require([
        'jquery',
        'ju-shared/logger',
        'ju-mvc/history',
        'ju-mvc/page-manager',
        'app/common/helper/resources-origin-setter',
        'app/routes'
    ],
    function(
        $,
        Logger,
        History,
        PageManager,
        ResourcesOriginSetter
    ) {
        'use strict';

        /**
         * app main initialization
         */
        var init = function() {
            var matchedUrl = History.start();
            if (!matchedUrl) {
                log('No tab loaded by default, we will load the first available...');

                PageManager.navigateToRoute('nihao');
            }

            ResourcesOriginSetter.configureAsServerless();
        };

        // app bootstrap
        $(init);
});
