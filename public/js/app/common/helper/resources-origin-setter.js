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

/**
 * Sets the components serverless strategy to fetch the resources
 */
define([
        'ju-components/resource/resource-manager',
        'ju-components/resource/strategy/serverless'
    ],
    function(
        ResourceManager,
        ServerLessResourceFetcher
    ) {

        'use strict';

        var ResourcesOriginSetter = {
            configureAsServerless : function() {
                var strategy = new ServerLessResourceFetcher({
                    templates : {
                        templatePath : '/view/',
                        templateExtension : '.html'
                    }
                });
                ResourceManager.setStrategy(strategy);
            }
        };

        // Exporting module
        return ResourcesOriginSetter;
});
