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
 * Example self contained component with no resource dependencies
 * that displays a "hello world" in the view
 *
 * WARNING : proof of concept only, not a "good practices" guideline
 *           however, explanatory comments are reliable :p
 */
define([
        'lib/vendor/mustache.js/mustache',
        'ju-components/base',
        'ju-components/resource/lazy-load-helper'
    ],
    function(
        Mustache,
        BaseComponent,
        LazyLoadHelper
    ) {

    'use strict';

    var MAIN_VIEW = 'landing/component';

    var RESOURCE_MAP = {
        template : [
            MAIN_VIEW
        ],
        cssFile : [
            // 'path/to/css/file'
        ]
    };

    var CHILDREN_DEFINITION = {
        child_component : {
            component : 'app/modules/landing/carousel',
            insertionPoint : '.carousel',
            opts : {
                // component-dependent options
            }
        }
    };

    var BasicComponent = BaseComponent.extend({
        /**
         * Constructor
         *
         * Common place for setting default options, resources, children definition,
         * selectors, variables...
         */
        init : function() {
            this.setOptions({
                // set any default options values here
                customizableLabel : 'Hello world!'
            });

            this._super.apply(this, arguments);

            this.addResources(RESOURCE_MAP);

            this.childrenDef = CHILDREN_DEFINITION;
        },

        /**
         * Commonly used to setup the component's markup
         */
        configureComponent : function() {
            var mainView = LazyLoadHelper.getTemplate(MAIN_VIEW),
                viewMarkup = Mustache.render(mainView, {
                    customizableText : this.opts.customizableLabel
                });

            this.appendToView(viewMarkup);
        }

    });

    BasicComponent.classMembers({
        // add 'static' class members here
        // i.e. can be accessed from the class definition without an instance
    });

    return BasicComponent;
});
