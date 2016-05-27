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
 * Controller that loads a component
 *
 * How to use:
 * To load a component in a page, add the following configuration in your routes file:
 *
    var routesDef = {
        'example' : {
            route : 'example',
            controller : 'app/common/component-controller', // path to this file
            dependencies : {
                component : 'path/to/component/to/load'
            }
        }
    };

 */

define([
            'ju-shared/logger',
            'ju-mvc/controller',
            'ju-components/base'
        ],
        function(
            Logger,
            Controller,
            BaseComponent
        ) {

    'use strict';

    var ComponentController = Controller.extend({

        init : function() {
            this._super.apply(this, arguments);

            // component definition to load
            this.ComponentDefinition = null;
            // instance of the loaded component
            this.componentInstance = null;
            // flag to prevent loading the same component multiple times
            // like in cases the page is refreshed before the component is ready
            this.isComponentLoaded = false;
        },

        setComponent : function(ComponentDefinition) {
            this.ComponentDefinition = ComponentDefinition;
        },

        handleRoute : function(alreadyInStack, routerParams, urlParams) {
            this._super.call(this, alreadyInStack, routerParams, urlParams);
            this.load.apply(this, urlParams);
        },

        load : function() {
            if (this.ComponentDefinition) {

                if (this.componentInstance) {
                    if (!this.isComponentLoaded) {
                        // prevents component loading more than once
                        log('ComponentController: wont\'t load again, current component is still loading...');
                        return;
                    }

                    // before creating a new instance of the component, destroy the current one
                    this._destroyComponent();
                }

                // adds placeholder markup to insert the component
                var $componentPlaceholder = this._loadComponentPlaceholder();
                // creates and loads the component into the view
                this.componentInstance = this._loadComponent($componentPlaceholder, arguments);

            } else {
                Logger.error('ComponentController: couldn\'t instantiate component. Did you add a `component` dependency in the route config?');
            }
        },

        _loadComponent : function($componentPlaceholder, loadArguments) {
            var componentInstance = new this.ComponentDefinition();
            componentInstance.isRootComponent = true;

            // when the component is ready, sets `this.isComponentLoaded` flag to true
            componentInstance.on(BaseComponent.EV.READY, this._setIsComponentLoaded.bind(this));

            componentInstance.load.apply(componentInstance, $.merge([$componentPlaceholder], loadArguments));

            return componentInstance;
        },

        _destroyComponent : function() {
            if (this.componentInstance) {
                this.componentInstance.destroy();
                this.isComponentLoaded = false;
            }
        },

        _loadComponentPlaceholder : function() {
            var $componentPlaceholder = $('<div class="component-content"></div>');
            this.setContent($componentPlaceholder);

            return $componentPlaceholder;
        },

        _setIsComponentLoaded : function() {
            this.isComponentLoaded = true;
        },

        destroy : function() {
            log('ComponentController: destroying...');

            if (this.$pageContainer) {
                this.$pageContainer.remove();
            }

            this._destroyComponent();
        }
    });

    return ComponentController;

});
